// ========================================================
// DECLARACIONES
// ========================================================

const { Engine, World, Bodies, Body, Events } = Matter;

let engine;
let world;
let frutas = [];
let frutaActual = null;
let canSpawn = true;
let puntaje = 0;
let musicaSonando = false;
let colaFusiones = [];
const VELOCIDAD_MAXIMA = 30;



// --- Siguiente fruta ---
// Solo aparecen como fruta del jugador los niveles [0, NIVELES_SPAWN) (Uva, Fresa, Cereza)
const NIVELES_SPAWN = 3;
let indiceSiguiente = 0; // nivel de la fruta que se lanzará DESPUÉS de frutaActual
// Panel "Siguiente" en la columna izquierda, bajo el botón Reiniciar (y 180-220)
const PANEL_SIGUIENTE = { x: 50, y: 250, ancho: 130, alto: 140, tamMax: 80 };

// --- Game Over ---
let juegoTerminado = false;
let temporizadorSpawn = null; // id del setTimeout que genera la siguiente fruta
// Una fruta recién soltada/fusionada no cuenta para perder durante este tiempo

// (la fruta se suelta desde y = CAJA.y - 30, es decir, POR ENCIMA de la línea).
const FRAMES_GRACIA_NACIMIENTO = 60; // ~1 s a 60 fps

// Frames consecutivos que una fruta debe permanecer sobre la línea para perder
const FRAMES_LIMITE_GAME_OVER = 120; // ~2 s a 60 fps
const BOTON_REINICIAR_FIN = { ancho: 180, alto: 50 }; // centrado en la caja (ver dibujarGameOver)

// donde se guardan las imagenes
let imagenes = {};
let music = {};

const CAJA = { x: 250, y: 180, ancho: 400, alto: 350, grosor: 20 };

const CONFIG_FRUTAS = [
  { nombre: "Uva", radio: 15, puntos: 1, imgKey: "uva" },
  { nombre: "Fresa", radio: 20, puntos: 3, imgKey: "fresa" },
  { nombre: "Cereza", radio: 25, puntos: 6, imgKey: "cereza" },
  { nombre: "Limón", radio: 32, puntos: 10, imgKey: "limon" },  
  { nombre: "Tomate", radio: 40, puntos: 15, imgKey: "tomate" },
  { nombre: "Manzana", radio: 48, puntos: 21, imgKey: "manzana" },
  // El índice de cada entrada DEBE coincidir con el de su subclase en Model.js
  // y con instanciarFruta(): 6 = Aguacate, 7 = Mango.
  { nombre: "Aguacate", radio: 58, puntos: 28, imgKey: "aguacate" },
  { nombre: "Mango", radio: 70, puntos: 36, imgKey: "mango", escalaX: 0.7, escalaY: 1.1 },
  { nombre: "Maíz", radio: 82, puntos: 45, imgKey: "maiz", escalaX: 0.5, escalaY: 1.2 },
  { nombre: "Piña", radio: 95, puntos: 55, imgKey: "pina" },
  { nombre: "Sandía", radio: 110, puntos: 66, imgKey: "sandia" }
];


// ========================================================
// FUNCIONES PRINCIPALES
// ========================================================


function preload() {
  imagenes = {
      uva: loadImage('Resources/img/uva.png'),
      fresa: loadImage('Resources/img/fresa.png'),
      cereza: loadImage('Resources/img/cereza.png'),
      limon: loadImage('Resources/img/limon.png'),
      tomate: loadImage('Resources/img/tomate.png'),
      manzana: loadImage('Resources/img/maracuya.png'), // *****es una manzana 
      aguacate: loadImage('Resources/img/aguacate.png'),
      mango: loadImage('Resources/img/mango.png'),
      maiz: loadImage('Resources/img/maiz.png'),
      pina: loadImage('Resources/img/pina.png'),
      sandia: loadImage('Resources/img/sandia.png'),
     background: loadImage('Resources/img/background.png')
  }

    music = {
      song: loadSound("Resources/sound/suika-game-song.mp3")
      //merge: loadSound("Resources/sound/Merge.mp3"),
    };     
}

function setup() {
  createCanvas(900, 650);
  imageMode(CENTER); // ¡MUY IMPORTANTE! Centra las imágenes en el origen
  
  engine = Engine.create();
  world = engine.world;
  world.gravity.y = 1;
  // Más iteraciones = menos solape residual cuando hay muchas frutas apiladas
  engine.positionIterations = 10;
  engine.velocityIterations = 8;
   // dibuja la caja
   let suelo = Bodies.rectangle(CAJA.x + CAJA.ancho / 2, CAJA.y + CAJA.alto, CAJA.ancho, CAJA.grosor, { isStatic: true, restitution: 0.2 });
  let paredIzquierda = Bodies.rectangle(CAJA.x, CAJA.y + CAJA.alto / 2, CAJA.grosor, CAJA.alto, { isStatic: true, restitution: 0.2 });
  let paredDerecha = Bodies.rectangle(CAJA.x + CAJA.ancho, CAJA.y + CAJA.alto / 2, CAJA.grosor, CAJA.alto, { isStatic: true, restitution: 0.2 });
  
  World.add(world, [suelo, paredIzquierda, paredDerecha]);
  Events.on(engine, 'collisionStart', manejarColisiones);
  indiceSiguiente = elegirIndiceSpawn();
  spawnFrutaInicial();
}

function draw() {
  background(245, 245, 245);
  image(imagenes["background"], width / 2, height / 2, width, height);   
  
  // dt fijo: evita saltos de física grandes si el navegador tiene un frame lento
  // Con el juego terminado la física queda congelada
  if (!juegoTerminado) {
    Engine.update(engine, 1000 / 60);
    // Las fusiones se aplican DESPUÉS del paso de física, nunca durante él
    procesarFusiones();
    limitarVelocidad();
    verificarGameOver();
  }

  dibujarInterfaz();

  // Caja transparente contenedor
  stroke(230, 185, 110);    // Color dorado/arena para los bordes
  strokeWeight(10);          // El grosor que ya tienes configurado
  strokeJoin(ROUND);        // Esquinas suavizadas
  
  // 1. CARA TRASERA (El fondo del contenedor)
  // Desplazamos esta cara hacia arriba y atrás para dar el efecto 3D
  let desvX = 50; // Qué tan movida a la derecha está la perspectiva
  let desvY = 30; // Qué tan alta es la boca de la caja (profundidad)
  
    // 2. LÍNEAS DE CONEXIÓN (Profundidad de las esquinas)
  // Conectamos las 4 esquinas de la cara trasera con la delantera
  line(CAJA.x + CAJA.grosor / 2, CAJA.y, CAJA.x + desvX, CAJA.y - desvY); // Esquina Superior Izquierda
  line(CAJA.x + desvX, CAJA.y - desvY, 590, CAJA.y - desvY); // Esquina Superior Izquierda  
  line(590, CAJA.y - desvY, CAJA.x + CAJA.ancho- CAJA.grosor/2, CAJA.y); // Esquina Superior Derecha

  
  fill(255, 255, 255, 100); // El color blanco transparente que ya tenías
  rect(CAJA.x + CAJA.grosor / 2, CAJA.y, CAJA.ancho - CAJA.grosor, CAJA.alto);  
  strokeWeight(); 
  fill(215, 180, 130, 50); // Fondo interior ligeramente más oscuro/cálido
  rect(CAJA.x + desvX, CAJA.y - desvY, 289, CAJA.alto- desvY);

  
  
  dibujarLineaLimite();

  if (!juegoTerminado && frutaActual && !frutaActual.suelta) {
    let xLimitada = constrain(mouseX, CAJA.x + CAJA.grosor + frutaActual.radio, CAJA.x + CAJA.ancho - CAJA.grosor - frutaActual.radio);
    frutaActual.actualizarPosicion(xLimitada, CAJA.y - 30);
    frutaActual.dibujarGuia();
  }

  for (let f of frutas) f.show();
  if (frutaActual && !juegoTerminado) frutaActual.show();

  dibujarFilaEvolucion();

  if (juegoTerminado) dibujarGameOver();
}

function mouseReleased() {
  if (mouseX > 50 && mouseX < 180) {
    if (mouseY > 120 && mouseY < 160) { musicaSonando = !musicaSonando; return; }
    if (mouseY > 180 && mouseY < 220) { reiniciarJuego(); return; }
  }
  if (juegoTerminado) {
    // Solo el botón "Reiniciar" del panel de derrota responde; no se sueltan frutas
    if (dentroDeBotonReiniciarFin(mouseX, mouseY)) reiniciarJuego();
    return;
  }
  if (frutaActual && !frutaActual.suelta && canSpawn) {
    if (mouseX > CAJA.x && mouseX < CAJA.x + CAJA.ancho) {
      frutaActual.soltar();
      frutas.push(frutaActual);
      frutaActual = null;
      canSpawn = false;
      temporizadorSpawn = setTimeout(() => {
        temporizadorSpawn = null;
        spawnFrutaInicial();
        canSpawn = true;
      }, 500);
    }
  }
  musicaSonando ? false : true
}

// ========================================================
// FUNCIONES
// ========================================================


function elegirIndiceSpawn() {
  return floor(random(0, NIVELES_SPAWN));
}

// La nueva fruta del jugador es la que se mostraba como "Siguiente";
// después se sortea la próxima.
function spawnFrutaInicial() {
  frutaActual = instanciarFruta(indiceSiguiente, mouseX, CAJA.y - 30, false);
  indiceSiguiente = elegirIndiceSpawn();
}

function instanciarFruta(idx, x, y, esFisica) {
  switch(idx) {
    case 0: return new Uva(x, y, esFisica);
    case 1: return new Fresa(x, y, esFisica);
    case 2: return new Cereza(x, y, esFisica);
    case 3: return new Limon(x, y, esFisica);
    case 4: return new Tomate(x, y, esFisica);
    case 5: return new Manzana(x, y, esFisica);
    case 6: return new Aguacate(x, y, esFisica);
    case 7: return new Mango(x, y, esFisica);
    case 8: return new Maiz(x, y, esFisica);
    case 9: return new Pina(x, y, esFisica);
    case 10: return new Sandia(x, y, esFisica);
    default: return null;
  }
}

function manejarColisiones(event) {
  // Solo detecta y ENCOLA fusiones aquí. No se toca el mundo de Matter
  // en medio del paso de física: eso es lo que causaba que las frutas
  // nuevas nacieran solapadas y salieran "disparadas" de la caja.
  let parejas = event.pairs;
  for (let i = 0; i < parejas.length; i++) {
    let bodyA = parejas[i].bodyA; let bodyB = parejas[i].bodyB;
    let fA = frutas.find(f => f.body === bodyA); let fB = frutas.find(f => f.body === bodyB);

    if (!fA || !fB || fA === fB || fA.index !== fB.index) continue;
    // Evita procesar dos veces la misma fruta si varios pares válidos
    // aparecen en el mismo frame (p. ej. 3 frutas iguales tocándose a la vez)
    if (fA.fusionando || fB.fusionando) continue;

    let nuevoIndex = fA.index + 1;
    if (nuevoIndex >= CONFIG_FRUTAS.length) continue;

    fA.fusionando = true;
    fB.fusionando = true;

    let posA = bodyA.position; let posB = bodyB.position;
    colaFusiones.push({
      nuevoIndex,
      x: (posA.x + posB.x) / 2,
      y: (posA.y + posB.y) / 2,
      viejas: [fA, fB]
    });
  }
}

function procesarFusiones() {
  if (colaFusiones.length === 0) return;

  for (let fusion of colaFusiones) {
    World.remove(world, fusion.viejas.map(f => f.body));
    frutas = frutas.filter(f => !fusion.viejas.includes(f));

    puntaje += CONFIG_FRUTAS[fusion.nuevoIndex].puntos;

    // La fruta resultante puede ser más grande que las dos originales:
    // se limita su punto de aparición para que no nazca encajada dentro
    // de una pared de la caja.
    // Para frutas ovaladas (Mango, Maíz) se usa su semieje real en cada eje.
    let cfgNueva = CONFIG_FRUTAS[fusion.nuevoIndex];
    let radioX = cfgNueva.radio * (cfgNueva.escalaX || 1);
    let radioY = cfgNueva.radio * (cfgNueva.escalaY || 1);
    let xClamp = constrain(fusion.x, CAJA.x + CAJA.grosor + radioX, CAJA.x + CAJA.ancho - CAJA.grosor - radioX);
    let yClamp = constrain(fusion.y, CAJA.y + radioY, CAJA.y + CAJA.alto - CAJA.grosor - radioY);

    let nuevaFruta = instanciarFruta(fusion.nuevoIndex, xClamp, yClamp, true);
    frutas.push(nuevaFruta);
  }

  colaFusiones = [];
}

// Red de seguridad: si una corrección de solape le da a una fruta una
// velocidad excesiva en un solo paso, se recorta para que no atraviese
// las paredes/el suelo (tunneling).
function limitarVelocidad() {
  for (let f of frutas) {
    if (!f.body) continue;
    let v = f.body.velocity;
    let rapidez = Math.sqrt(v.x * v.x + v.y * v.y);
    if (rapidez > VELOCIDAD_MAXIMA) {
      let factor = VELOCIDAD_MAXIMA / rapidez;
      Body.setVelocity(f.body, { x: v.x * factor, y: v.y * factor });
    }
  }
}

function dibujarInterfaz() {
  // PARTE IZQUIERDA DE LA INTERFAZ
  
  //-- TEXTO
  fill(40); noStroke(); textSize(24); textAlign(LEFT, TOP);
  text("FRUIT MERGE", 50, 40);
  //-- Score  
  textSize(18); text("Score: " + puntaje, 50, 80);
  
  //-- Boton musica  
  fill(musicaSonando ? "#A3E4D7" : "#FADBD8"); rect(50, 120, 130, 40, 4);
  
  //----- activa la musica
  if (music.song) {
    if (musicaSonando && !music.song.isPlaying()) {
      music.song.loop();
    } else if (!musicaSonando && music.song.isPlaying()) {
      music.song.stop();
    }
  }
  //---boton reiniciar
  fill(0); textAlign(CENTER, CENTER); text(musicaSonando ? "🎵 ON" : "🔇 OFF", 115, 140);
  fill("#D6EAF8"); rect(50, 180, 130, 40, 4); fill(0); text("🔄 Reiniciar", 115, 200);
  dibujarSiguiente();
}

// Vista previa (solo visual, sin cuerpo físico) de la próxima fruta.
// Durante el Game Over queda atenuada bajo la capa oscura, como el resto de la UI.
function dibujarSiguiente() {
  let p = PANEL_SIGUIENTE;
  let c = CONFIG_FRUTAS[indiceSiguiente];
  push();
  fill(255, 255, 255, 200); stroke(180); strokeWeight(2);
  rect(p.x, p.y, p.ancho, p.alto, 8);

  noStroke(); fill(40); textSize(16); textAlign(CENTER, TOP);
  text("Siguiente:", p.x + p.ancho / 2, p.y + 8);

  // Tamaño real de la fruta (así se aprecia la diferencia entre niveles),
  // reducido proporcionalmente si no cabe en la caja de vista previa.
  let w = c.radio * 2 * (c.escalaX || 1);
  let h = c.radio * 2 * (c.escalaY || 1);
  let factor = min(1, p.tamMax / max(w, h));
  w *= factor; h *= factor;
  let cx = p.x + p.ancho / 2;
  let cy = p.y + 30 + p.tamMax / 2;
  if (imagenes[c.imgKey]) {
    image(imagenes[c.imgKey], cx, cy, w, h);
  } else {
    fill(200); ellipse(cx, cy, w, h);
  }

  fill(100); textSize(12); textAlign(CENTER, BOTTOM);
  text(c.nombre, cx, p.y + p.alto - 6);
  pop();
}

// ----------Dibuja la fila de evolucion de las frutas.

function dibujarFilaEvolucion() {
  fill(227,227,149); //para el rectangulo
  stroke(255);
  rect(30,580, width-95, 53);
  noStroke();
  fill(0); textFont("georgia");textAlign(LEFT, CENTER); textSize(16); text("Evolución:", 37, 605);
  let startX = 150; let gap = 65;
  for (let i = 0; i < CONFIG_FRUTAS.length; i++) {
    let c = CONFIG_FRUTAS[i]; let px = startX + (i * gap); let py = 600;
    // Dibujar la imagen miniatura en la barra inferior
    if(imagenes[c.imgKey]) {
      image(imagenes[c.imgKey], px, py, 30, 30);
    }
    fill(0,125,0); noStroke(); textSize(10); textAlign(CENTER, CENTER); 
    text("(" + c.puntos + ") " + c.nombre, px, py + 25);

  }
}

// ========================================================
// GAME OVER
// ========================================================

// Pierde el jugador si alguna fruta YA SOLTADA permanece con su borde superior
// por encima del borde superior de la caja durante FRAMES_LIMITE_GAME_OVER
// frames seguidos. Las frutas recién nacidas (soltadas o fusionadas) tienen
// un periodo de gracia, porque la fruta se suelta desde encima de la línea.
function verificarGameOver() {
  for (let f of frutas) {
    if (!f.body || f.fusionando) continue;

    if (frameCount - f.frameNacimiento < FRAMES_GRACIA_NACIMIENTO) {
      f.framesSobreLimite = 0;
      continue;
    }

    // bounds.min.y ya contempla la forma real (incluye óvalos de Mango/Maíz y la rotación)
    if (f.body.bounds.min.y < CAJA.y) {
      f.framesSobreLimite++;
      if (f.framesSobreLimite >= FRAMES_LIMITE_GAME_OVER) {
        activarGameOver();
        return;
      }
    } else {
      f.framesSobreLimite = 0;
    }
  }
}

function activarGameOver() {
  juegoTerminado = true;
  canSpawn = false;
  if (temporizadorSpawn !== null) { clearTimeout(temporizadorSpawn); temporizadorSpawn = null; }
}

// Línea de peligro discontinua en el borde superior de la caja.
// Se vuelve roja cuando alguna fruta está contando tiempo sobre ella.
function dibujarLineaLimite() {
  let enPeligro = frutas.some(f => f.framesSobreLimite > 0);
  push();
  stroke(enPeligro ? color(220, 60, 60, 220) : color(220, 80, 80, 110));
  strokeWeight(2);
  drawingContext.setLineDash([10, 8]);
  line(CAJA.x + CAJA.grosor / 2, CAJA.y, CAJA.x + CAJA.ancho - CAJA.grosor / 2, CAJA.y);
  drawingContext.setLineDash([]);
  pop();
}

function rectBotonReiniciarFin() {
  let cx = CAJA.x + CAJA.ancho / 2;
  let cy = CAJA.y + CAJA.alto / 2 + 60;
  return { x: cx - BOTON_REINICIAR_FIN.ancho / 2, y: cy - BOTON_REINICIAR_FIN.alto / 2, ancho: BOTON_REINICIAR_FIN.ancho, alto: BOTON_REINICIAR_FIN.alto };
}

function dentroDeBotonReiniciarFin(mx, my) {
  let b = rectBotonReiniciarFin();
  return mx > b.x && mx < b.x + b.ancho && my > b.y && my < b.y + b.alto;
}

function dibujarGameOver() {
  push();
  // Capa semitransparente sobre todo el lienzo
  noStroke(); fill(0, 0, 0, 150);
  rect(0, 0, width, height);

  let cx = CAJA.x + CAJA.ancho / 2;
  let cy = CAJA.y + CAJA.alto / 2;

  // Panel central
  fill(255, 255, 255, 235); stroke(180); strokeWeight(2);
  rectMode(CENTER); rect(cx, cy, 320, 240, 12);

  noStroke(); textAlign(CENTER, CENTER);
  fill("#C0392B"); textSize(40); text("¡Perdiste!", cx, cy - 70);
  fill(40); textSize(20); text("Puntaje final: " + puntaje, cx, cy - 20);

  // Botón Reiniciar (resalta al pasar el mouse)
  let b = rectBotonReiniciarFin();
  rectMode(CORNER);
  fill(dentroDeBotonReiniciarFin(mouseX, mouseY) ? "#AED6F1" : "#D6EAF8");
  stroke(120); strokeWeight(1);
  rect(b.x, b.y, b.ancho, b.alto, 6);
  noStroke(); fill(0); textSize(20);
  text("🔄 Reiniciar", b.x + b.ancho / 2, b.y + b.alto / 2);
  pop();
}

// Reinicio único, usado por el botón lateral y por el del panel de derrota
function reiniciarJuego() {
  if (temporizadorSpawn !== null) { clearTimeout(temporizadorSpawn); temporizadorSpawn = null; }
  for (let f of frutas) if (f.body) World.remove(world, f.body);
  frutas = [];
  colaFusiones = [];
  puntaje = 0;
  juegoTerminado = false;
  canSpawn = true;
  indiceSiguiente = elegirIndiceSpawn();
  spawnFrutaInicial();
}
