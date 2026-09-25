const { Engine, World, Bodies, Body, Events } = Matter;

let engine;
let world;
let frutas = [];
let frutaActual = null;
let canSpawn = true;
let puntaje = 0;
let musicaSonando = false;

// 1. DECLARAR EL OBJETO DONDE SE GUARDARÁN LAS IMÁGENES
let imagenes = {};

const CONFIG_FRUTAS = [
  { nombre: "Uva", radio: 15, puntos: 1, imgKey: "uva" },
  { nombre: "Fresa", radio: 20, puntos: 3, imgKey: "fresa" },
  { nombre: "Cereza", radio: 25, puntos: 6, imgKey: "cereza" },
  { nombre: "Limón", radio: 32, puntos: 10, imgKey: "limon" },  
  { nombre: "Tomate", radio: 40, puntos: 15, imgKey: "tomate" },
  { nombre: "Manzana", radio: 48, puntos: 21, imgKey: "manzana" },
  { nombre: "Mango", radio: 70, puntos: 28, imgKey: "mango", escalaX: 0.7, escalaY: 1.1 },
  { nombre: "Aguacate", radio: 58, puntos: 36, imgKey: "aguacate" },  
  { nombre: "Maíz", radio: 82, puntos: 45, imgKey: "maiz", escalaX: 0.5, escalaY: 1.2 },
  { nombre: "Piña", radio: 95, puntos: 55, imgKey: "pina" },
  { nombre: "Sandía", radio: 110, puntos: 66, imgKey: "sandia" }
];

const CAJA = { x: 250, y: 80, ancho: 400, alto: 500, grosor: 20 };

// 2. FUNCIÓN PRELOAD: CARGA TUS IMÁGENES AQUÍ ANTES DE SETUP
function preload() {
  // Reemplaza estas URLs de ejemplo por los nombres de tus archivos subidos a p5.js (ej: 'assets/uva.png')
  imagenes.uva = loadImage('img/uva.png');
  imagenes.fresa = loadImage('img/fresa.png');
  imagenes.cereza = loadImage('img/cereza.png');
  imagenes.limon = loadImage('img/limon.png');
  imagenes.tomate = loadImage('img/tomate.png');
  imagenes.manzana = loadImage('img/maracuya.png');
  imagenes.aguacate = loadImage('img/aguacate.png');
  imagenes.mango = loadImage('img/mango.png');
  imagenes.maiz = loadImage('img/maiz.png');
  imagenes.pina = loadImage('img/pina.png');
  imagenes.sandia = loadImage('img/sandia.png');
}

function setup() {
  createCanvas(900, 650);
  imageMode(CENTER); // ¡MUY IMPORTANTE! Centra las imágenes en el origen
  
  engine = Engine.create();
  world = engine.world;
  world.gravity.y = 1;

  let suelo = Bodies.rectangle(CAJA.x + CAJA.ancho / 2, CAJA.y + CAJA.alto, CAJA.ancho, CAJA.grosor, { isStatic: true, restitution: 0.2 });
  let paredIzquierda = Bodies.rectangle(CAJA.x, CAJA.y + CAJA.alto / 2, CAJA.grosor, CAJA.alto, { isStatic: true, restitution: 0.2 });
  let paredDerecha = Bodies.rectangle(CAJA.x + CAJA.ancho, CAJA.y + CAJA.alto / 2, CAJA.grosor, CAJA.alto, { isStatic: true, restitution: 0.2 });
  
  World.add(world, [suelo, paredIzquierda, paredDerecha]);
  Events.on(engine, 'collisionStart', manejarColisiones);
  spawnFrutaInicial();
}

function draw() {
  background(245, 245, 245);
  Engine.update(engine);

  dibujarInterfaz();

  // Caja transparente contenedor
  fill(255, 255, 255, 120);
  stroke(180);
  strokeWeight(2);
  rect(CAJA.x + CAJA.grosor / 2, CAJA.y, CAJA.ancho - CAJA.grosor, CAJA.alto);

  if (frutaActual && !frutaActual.suelta) {
    let xLimitada = constrain(mouseX, CAJA.x + CAJA.grosor + frutaActual.radio, CAJA.x + CAJA.ancho - CAJA.grosor - frutaActual.radio);
    frutaActual.actualizarPosicion(xLimitada, CAJA.y - 30);
    frutaActual.dibujarGuia();
  }

  for (let f of frutas) f.show();
  if (frutaActual) frutaActual.show();

  dibujarFilaEvolucion();
}

// [Las funciones mouseReleased, spawnFrutaInicial, instanciarFruta, manejarColisiones, dibujarInterfaz se mantienen igual que tu código base anterior]
function mouseReleased() {
  if (mouseX > 50 && mouseX < 180) {
    if (mouseY > 120 && mouseY < 160) { musicaSonando = !musicaSonando; return; }
    if (mouseY > 180 && mouseY < 220) { reiniciarJuego(); return; }
  }
  if (frutaActual && !frutaActual.suelta && canSpawn) {
    if (mouseX > CAJA.x && mouseX < CAJA.x + CAJA.ancho) {
      frutaActual.soltar();
      frutas.push(frutaActual);
      frutaActual = null;
      canSpawn = false;
      setTimeout(() => { spawnFrutaInicial(); canSpawn = true; }, 500);
    }
  }
}

function spawnFrutaInicial() {
  let r = floor(random(0, 3)); 
  frutaActual = instanciarFruta(r, mouseX, CAJA.y - 30, false);
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
  let parejas = event.pairs;
  for (let i = 0; i < parejas.length; i++) {
    let bodyA = parejas[i].bodyA; let bodyB = parejas[i].bodyB;
    let fA = frutas.find(f => f.body === bodyA); let fB = frutas.find(f => f.body === bodyB);
    
    if (fA && fB && fA.index === fB.index) {
      let nuevoIndex = fA.index + 1;
      if (nuevoIndex >= CONFIG_FRUTAS.length) continue;
      let posA = bodyA.position; let posB = bodyB.position;
      puntaje += CONFIG_FRUTAS[nuevoIndex].puntos;
      World.remove(world, [bodyA, bodyB]);
      frutas = frutas.filter(f => f !== fA && f !== fB);
      let nuevaFruta = instanciarFruta(nuevoIndex, (posA.x + posB.x) / 2, (posA.y + posB.y) / 2, true);
      frutas.push(nuevaFruta);
      break;
    }
  }
}

function dibujarInterfaz() {
  fill(40); noStroke(); textSize(24); textAlign(LEFT, TOP);
  text("FRUIT MERGE", 50, 40);
  textSize(18); text("Score: " + puntaje, 50, 80);
  fill(musicaSonando ? "#A3E4D7" : "#FADBD8"); rect(50, 120, 130, 40, 4);
  fill(0); textAlign(CENTER, CENTER); text(musicaSonando ? "🎵 ON" : "🔇 OFF", 115, 140);
  fill("#D6EAF8"); rect(50, 180, 130, 40, 4); fill(0); text("🔄 Reiniciar", 115, 200);
}

function dibujarFilaEvolucion() {
  fill(60); noStroke(); textAlign(LEFT, CENTER); textSize(14); text("Evolución:", 40, 610);
  let startX = 130; let gap = 65;
  for (let i = 0; i < CONFIG_FRUTAS.length; i++) {
    let c = CONFIG_FRUTAS[i]; let px = startX + (i * gap); let py = 610;
    // Dibujar la imagen miniatura en la barra inferior
    if(imagenes[c.imgKey]) {
      image(imagenes[c.imgKey], px, py, 30, 30);
    }
    fill(100); noStroke(); textSize(9); textAlign(CENTER, CENTER); text(c.nombre, px, py + 25);
  }
}

function reiniciarJuego() {
  for (let f of frutas) World.remove(world, f.body);
  frutas = []; puntaje = 0; spawnFrutaInicial();
}
