//Interfaz
function dibujarInterfaz() {


  //PARTE IZQUIERDA
  fill(40); 
  noStroke(); 
  textSize(24); 
  textAlign(LEFT, TOP);
  text("FRUIT MERGE", 50, 40);
  
  
  //Score  
  textSize(18); text("Score: " + puntaje, 50, 80);
  
  //Boton musica  
  fill(musicaSonando ? "#A3E4D7" : "#FADBD8"); rect(50, 120, 130, 40, 4);
  
  //activa la musica
  if (musica.song) {
    if (musicaSonando && !musica.song.isPlaying()) {
      musica.song.loop();
    } else if (!musicaSonando && musica.song.isPlaying()) {
      musica.song.stop();
    }
  }
  
  //boton reiniciar
  fill(0); textAlign(CENTER, CENTER); text(musicaSonando ? "🎵 ON" : "🔇 OFF", 115, 140);
  fill("#D6EAF8"); rect(50, 180, 130, 40, 4); fill(0); text("🔄 Reiniciar", 115, 200);
  
  //caja de siguiente  
  dibujarSiguiente();
  
  // dibuja la caja del juego
  dibujarCaja();
  
  // dibuja la linea limite.  
  dibujarLineaLimite();
  
  // dibuja la fila de evolucion
  dibujarFilaEvolucion();
}

function dibujarSiguiente() {
  let p = PANEL_SIGUIENTE;
  let c = CONFIG_FRUTAS[indiceSiguiente];
  push();
  fill(255, 255, 255, 200); stroke(180); strokeWeight(2);
  rect(p.x, p.y, p.ancho, p.alto, 8);

  noStroke(); fill(40); textSize(16); textAlign(CENTER, TOP);
  text("Siguiente:", p.x + p.ancho / 2, p.y + 8);

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

function dibujarCaja(){
  stroke(230, 185, 110);    // bordes
  strokeWeight(10);         // grosor 
  strokeJoin(ROUND);        // Esquinas suavizadas
  let desvX = 50;           
  let desvY = 30;           
  
  //  Caja. 
  fill(255, 255, 255, 15); 
  rect(CAJA.x + CAJA.grosor / 2, CAJA.y, CAJA.ancho - CAJA.grosor, CAJA.alto);

}

function dibujarFondoCaja() {
  push();  
  stroke(230, 185, 110);    
  strokeWeight(10);         
  strokeJoin(ROUND);        
  let desvX = 50; 
  let desvY = 30;
  line(CAJA.x + desvX, CAJA.y - desvY, 590, CAJA.y - desvY); // fondo  
  line(CAJA.x + CAJA.grosor / 2, CAJA.y, CAJA.x + desvX, CAJA.y - desvY); // Esquina Superior Izquierda
  line(590, CAJA.y - desvY, CAJA.x + CAJA.ancho- CAJA.grosor/2, CAJA.y); // Esquina Superior Derecha
  noStroke(); 
  fill(215, 180, 130, 60); // El color café del fondo con buena opacidad
  rect(CAJA.x + desvX, CAJA.y - desvY, 289, CAJA.alto - desvY);
  pop();
}
function dibujarFilaEvolucion() {
  fill(227,227,149);
  stroke(255);
  strokeWeight(1);     
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
// elegir siguiente fruta

function elegirIndiceSpawn() {
  return floor(random(0, NIVELES_SPAWN));
}

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

// GAME OVER

// Pierde el jugador si alguna fruta YA SOLTADA permanece con su borde superior
// por encima del borde superior de la caja durante FRAMES_LIMITE_GAME_OVER
// frames seguidos. Las frutas recién nacidas (soltadas o fusionadas) tienen
// un periodo de gracia.
function verificarGameOver() {
  for (let f of frutas) {
    if (!f.body || f.fusionando) continue;

    if (frameCount - f.frameNacimiento < FRAMES_GRACIA_NACIMIENTO) {
      f.framesSobreLimite = 0;
      continue;
    }

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

  // Botón Reiniciar
  let b = rectBotonReiniciarFin();
  rectMode(CORNER);
  fill(dentroDeBotonReiniciarFin(mouseX, mouseY) ? "#AED6F1" : "#D6EAF8");
  stroke(120); strokeWeight(1);
  rect(b.x, b.y, b.ancho, b.alto, 6);
  noStroke(); fill(0); textSize(20);
  text("🔄 Reiniciar", b.x + b.ancho / 2, b.y + b.alto / 2);
  pop();
}

// Reinicio
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

function activarGameOver() {
  juegoTerminado = true;
  canSpawn = false;
  if (temporizadorSpawn !== null) { clearTimeout(temporizadorSpawn); temporizadorSpawn = null; }
}
