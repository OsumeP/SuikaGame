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

// donde se guardan las imagenes y la musica
let imagenes = {};
let musica = {};


// --- Siguiente fruta ---

const NIVELES_SPAWN = 3; // solo aparece 3 frutas (Uva, Fresa, Cereza)
let indiceSiguiente = 0; // indice que se lanzará DESPUÉS de frutaActual
const PANEL_SIGUIENTE = { x: 50, y: 250, ancho: 130, alto: 140, tamMax: 80 };  // configuracion de cuadrado donde aparecera siguiente 

// --- Game Over ---
let juegoTerminado = false;
let temporizadorSpawn = null; // id del setTimeout que genera la siguiente fruta
const FRAMES_GRACIA_NACIMIENTO = 60; // Linea que dice el tope de llenado a 60 fps

// Frames consecutivos que una fruta debe permanecer sobre la línea para perder
const FRAMES_LIMITE_GAME_OVER = 120; // ~2 s a 60 fps
const BOTON_REINICIAR_FIN = { ancho: 180, alto: 50 }; // centrado en la caja (ver dibujarGameOver)

//  --- Tamaño Caja o recipiente ---
const CAJA = { x: 250, y: 180, ancho: 400, alto: 350, grosor: 20 };

// --- CONFIGURACION DE LAS FRUTAS.---
// El índice de cada entrada DEBE coincidir con el de su subclase en Model.js
//y con instanciarFruta(): 6 = Aguacate, 7 = Mango.

const CONFIG_FRUTAS = [
  { nombre: "Uva", radio: 15, puntos: 1, imgKey: "uva" },  //idx 0
  { nombre: "Fresa", radio: 20, puntos: 3, imgKey: "fresa" }, //idx 1
  { nombre: "Cereza", radio: 25, puntos: 6, imgKey: "cereza" },//idx 2
  { nombre: "Limón", radio: 32, puntos: 10, imgKey: "limon" },  //idx 3
  { nombre: "Tomate", radio: 40, puntos: 15, imgKey: "tomate" }, //idx 4
  { nombre: "Manzana", radio: 48, puntos: 21, imgKey: "manzana" },//idx 5
  { nombre: "Aguacate", radio: 58, puntos: 28, imgKey: "aguacate" },//idx 6
  { nombre: "Mango", radio: 70, puntos: 36, imgKey: "mango"},//idx 7
  { nombre: "Maíz", radio: 82, puntos: 45, imgKey: "maiz"},//idx 8
  { nombre: "Piña", radio: 95, puntos: 55, imgKey: "pina" },//idx 9
  { nombre: "Sandía", radio: 110, puntos: 66, imgKey: "sandia" }//idx 10
];


// ========================================================
// FUNCIONES PRINCIPALES
// ========================================================


function preload() {
  imagenes = {
    // --- frutas ---
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
    //--- background ---
    background_juego: loadImage('Resources/img/background.png')
  }

  musica = {
    song: loadSound("Resources/sound/suika-game-song.mp3"),
    fuse: loadSound("Resources/sound/fuse.wav"),
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
  
  // --- Coloca el background_juego
  image(imagenes["background_juego"], width / 2, height / 2, width, height);   
  dibujarFondoCaja();
  
  // Con el juego terminado la física queda congelada
  if (!juegoTerminado) {
    Engine.update(engine, 1000 / 60);
    procesarFusiones();
    limitarVelocidad();
    verificarGameOver();
  }
  
 
  //dibuja las frutas que ya cayeron.
  for (let f of frutas) f.show();
  
  dibujarInterfaz();
 

  if (!juegoTerminado && frutaActual) {
    if (!frutaActual.suelta) {
      let xLimitada = constrain(mouseX, CAJA.x + CAJA.grosor + frutaActual.radio, CAJA.x + CAJA.ancho - CAJA.grosor - frutaActual.radio);
      frutaActual.actualizarPosicion(xLimitada, CAJA.y - 30);
      frutaActual.dibujarGuia();
    }
    frutaActual.show(); // Se dibuja siempre al frente mientras no termine el juego
  }    
 
  if (juegoTerminado) {
    dibujarGameOver();
  }
}



function mouseReleased() {
  // 1. Botones del menú lateral izquierdo
  if (mouseX > 50 && mouseX < 180) {
    if (mouseY > 120 && mouseY < 160) { musicaSonando = !musicaSonando; return; }
    if (mouseY > 180 && mouseY < 220) { reiniciarJuego(); return; }
  }
  
  if (juegoTerminado) {
    if (dentroDeBotonReiniciarFin(mouseX, mouseY)) reiniciarJuego();
    return;
  }

  // 2. Soltar fruta en la caja
  if (frutaActual && !frutaActual.suelta && canSpawn) {
    if (mouseX > CAJA.x && mouseX < CAJA.x + CAJA.ancho) {
      console.log("Filtros pasados. Soltando fruta...");
      
      let frutaParaSoltar = frutaActual; // Guardamos una referencia segura
      frutaParaSoltar.soltar();
      frutas.push(frutaParaSoltar);
      
      frutaActual = null; // Ahora sí podemos vaciarla de forma segura
      canSpawn = false;
      
      temporizadorSpawn = setTimeout(() => {
        temporizadorSpawn = null;
        spawnFrutaInicial();
        canSpawn = true;
        console.log("Nueva fruta lista en el spawn.");
      }, 500);
    }
  }
}

//--- Funcion que va en el  Events.on(engine, 'collisionStart', manejarColisiones);

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
// ========================================================
// FUSIONES
// ========================================================

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
    if (musica.fuse && musicaSonando){
      musica.fuse.play();
    }
  }

  colaFusiones = [];
}

// ========================================================
// Controla no atraviese paredes /suelo por la velocidad
// ========================================================

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
