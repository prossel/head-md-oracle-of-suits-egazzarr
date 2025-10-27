// Spin.js - a simple 4-color spinning wheel class
class Spin {
  constructor(x, y, r, colors) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.colors = colors || ['#ff7a6bff', '#797979ff', '#d69600ff', '#633700ff'];

    this.angle = 0; // current rotation angle
    this.angularVelocity = 0; // current angular velocity
    this.friction = 0.992; // per-frame damping
    this.sectorCount = this.colors.length;
    this.sectorSize = TWO_PI / this.sectorCount;

    this.spinning = false;
    this.result = null;
    this.onResult = null; // optional callback when spin finishes (colorIndex, color)
  }

  spin(minSpeed = 0.1, maxSpeed = 0.5) {
    // only start a new spin if not already spinning
    if (this.spinning) return;
    // random angular direction and magnitude
    let dir = random() < 0.5 ? -1 : 1;
    this.angularVelocity = dir * random(minSpeed, maxSpeed);
    this.spinning = true;
    this.result = null;
  }

  update() {
    // simple physics
    if (abs(this.angularVelocity) > 0.00001) {
      this.angle += this.angularVelocity;
      this.angularVelocity *= this.friction;
    }

    // when it was spinning and angular velocity now very small, stop and determine result
    if (this.spinning && abs(this.angularVelocity) < 0.001) {
      this.spinning = false;
      this.angularVelocity = 0;
      this.determineResult();
    }
  }

  determineResult() {
    // pointer is at -PI/2 (top). Determine which sector sits under the pointer.
    let pointer = -PI / 2;
    // relative angle from wheel rotation to pointer
    let rel = (pointer - this.angle) % TWO_PI;
    if (rel < 0) rel += TWO_PI;
    let idx = floor(rel / this.sectorSize) % this.sectorCount;
    this.result = {index: idx, color: this.colors[idx]};
    if (this.onResult) this.onResult(idx, this.colors[idx]);
  }

  draw(showLabels = true) {
    push();
    translate(this.x, this.y);
    rotate(this.angle);

    // draw sectors
    for (let i = 0; i < this.sectorCount; i++) {
      fill(this.colors[i]);
      stroke(40);
      strokeWeight(2);
      arc(0, 0, this.r * 2, this.r * 2, i * this.sectorSize, (i + 1) * this.sectorSize, PIE);
    }

    // draw transparent center ellipse (visual center only)
    noFill();
    stroke(0, 120);
    strokeWeight(1.5);
    // an ellipse as the visual center (slightly squashed)
    let centerW = this.r * 0.8;
    let centerH = this.r * 0.6;
    ellipse(0, 0, centerW, centerH);

    // optional labels (small)
    if (showLabels) {
      fill(0);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(max(10, this.r * 0.08));
      for (let i = 0; i < this.sectorCount; i++) {
        let a = (i + 0.5) * this.sectorSize;
        let tx = cos(a) * this.r * 0.6;
        let ty = sin(a) * this.r * 0.6;
        push();
        translate(tx, ty);
        rotate(-this.angle); // keep text upright
        text('' , 0, 0);
        pop();
      }
    }

    pop();

    // draw pointer at top
    push();
    stroke(0);
    fill(255);
    strokeWeight(2);
    // pointer triangle anchored above the wheel
    let px = this.x;
    let py = this.y - this.r - 10;
    triangle(px - 12, py, px + 12, py, px, py - 18);
    pop();
  }
}

// Export for environments that might use modules or globals (p5 global mode uses global)
if (typeof window !== 'undefined') window.Spin = Spin;
