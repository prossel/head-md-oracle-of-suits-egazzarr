// generatevisuals.js

let symbolImg;
let symbolParticles = [];

function preloadSymbols() {
  symbolImg = loadImage('../../process/2025-10-material-sounds/symbol_images/spades/1300-ita.png');
}

class SymbolParticle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(0.5, 2));
    this.size = 60; // ≈ 1 cm visual scale
    this.birthTime = millis();
    this.life = 300;
  }

  update() {
    this.pos.add(this.vel);
    this.life = 255 - map(millis() - this.birthTime, 0, 3000, 0, 255);
  }

  draw() {
    if (!symbolImg) return;
    push();
    tint(255, this.life);
    image(symbolImg, this.pos.x - this.size / 2, this.pos.y - this.size / 2, this.size, this.size);
    pop();
  }

  isDead() {
    return this.life <= 0;
  }
}

function symbolgen(x, y, count = 1) {
  for (let i = 0; i < count; i++) {
    symbolParticles.push(new SymbolParticle(x, y));
  }
}

function updateAndDrawSymbols() {
  for (let i = symbolParticles.length - 1; i >= 0; i--) {
    let p = symbolParticles[i];
    p.update();
    p.draw();
    if (p.isDead()) symbolParticles.splice(i, 1);
  }
}
