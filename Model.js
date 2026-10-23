// CLASE PADRE "FRUTA" 
class Fruta {
  constructor(x, y, index, esFisica = false) {
    this.index = index;
    this.config = CONFIG_FRUTAS[index];
    this.radio = this.config.radio;
    this.nombre = this.config.nombre;
    this.imgKey = this.config.imgKey;
    this.suelta = esFisica;
    this.fusionando = false; // true mientras espera a ser reemplazada por la fruta fusionada
    
    // Frame en que la fruta pasó a ser física.
    this.frameNacimiento = esFisica ? frameCount : null;
    this.framesSobreLimite = 0; // frames consecutivos por encima del borde superior de la caja

    if (esFisica) { this.construirCuerpo(x, y); }
    else { this.body = null; this.x = x; this.y = y; }
  }

  construirCuerpo(x, y) {
    this.body = Bodies.circle(x, y, this.radio, {
      restitution: 0.4,
      friction: 0.05,
      density: 0.001
    });
    World.add(world, this.body);
  }
  
  // Actualiza posición previa al lanzamiento
  actualizarPosicion(x, y) { if (!this.suelta) { this.x = x; this.y = y; } }
  soltar() { this.suelta = true; this.frameNacimiento = frameCount; this.construirCuerpo(this.x, this.y); }

  dibujarGuia() {
    stroke(200, 200, 200, 120); 
    strokeWeight(1);
    line(this.x, this.y, this.x, CAJA.y + CAJA.alto);
  }

  show() {
    let pos = (this.suelta && this.body) ? this.body.position : { x: this.x, y: this.y };
    let angulo = (this.suelta && this.body) ? this.body.angle : 0;

    push();
    translate(pos.x, pos.y);
    rotate(angulo);
    
    this.drawImage();
    
    pop();
  }
  
  drawImage(){
    if (imagenes[this.imgKey]) {
      image(imagenes[this.imgKey], 0, 0, this.radio * 2, this.radio * 2);
    } else {
      fill(200); 
      ellipse(0, 0, this.radio * 2, this.radio * 2);
    }
  }
} 


// SUBCLASES DE FRUTAS
class Uva extends Fruta { constructor(x, y, f) { super(x, y, 0, f); } }
class Fresa extends Fruta { constructor(x, y, f) { super(x, y, 1, f); } }
class Cereza extends Fruta { 
  constructor(x, y, f) { super(x, y, 2, f); } 
  
  drawImage(){
    if (imagenes[this.imgKey]) {
      image(imagenes[this.imgKey], 0, -8, this.radio * 2, this.radio * 2.7);
    } else {
      fill(200); 
      ellipse(0, 0, this.radio * 2, this.radio * 2);
    }
  }
}
class Limon extends Fruta { constructor(x, y, f) { super(x, y, 3, f); } }
class Tomate extends Fruta { constructor(x, y, f) { super(x, y, 4, f); } }
class Manzana extends Fruta { constructor(x, y, f) { super(x, y, 5, f); } }
class Aguacate extends Fruta { constructor(x, y, f) { super(x, y, 6, f); } }
class Mango extends Fruta { constructor(x, y, f) { super(x, y, 7, f); } }
class Maiz extends Fruta { constructor(x, y, f) { super(x, y, 8, f); } }
class Pina extends Fruta { constructor(x, y, f) { super(x, y, 9, f); } }
class Sandia extends Fruta { constructor(x, y, f) { super(x, y, 10, f); } }
