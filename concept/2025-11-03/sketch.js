let activeQuadrant = null;
let diameter, cx, cy, radius;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  textSize(30);
  fill(255);
  diameter = height * 4 / 5;
  cx = width / 2;
  cy = height / 2;
  radius = diameter / 2;
}

function draw() {
  background(0);
  drawCircleWithNumbers();
}

function drawCircleWithNumbers() {
  const diameter = height * 4 / 5;
  const cx = width / 2;
  const cy = height / 2;
  const radius = diameter / 2;

  // main circle outline
  noFill();
  stroke(255);
  strokeWeight(2);
  ellipse(cx, cy, diameter, diameter);

  // quadrant cross
  line(cx - radius, cy, cx + radius, cy);
  line(cx, cy - radius, cx, cy + radius);

  // quadrant numbers
  noStroke();
  fill(255);
  const offset = radius / 2;
  text('1', cx + offset, cy - offset);
  text('2', cx - offset, cy - offset);
  text('3', cx - offset, cy + offset);
  text('4', cx + offset, cy + offset);

  // --- concentric circles with years ---
  const years = [1100, 1200, 1300, 1400, 1500, 1600, 1700];
  const ringCount = years.length;

  // smaller radii, more spacing
  for (let i = 0; i < ringCount; i++) {
    const r = map(i, 0, ringCount - 1, radius * 0.1, radius * 0.9);
    stroke(100 + i * 20);  // make inner rings darker, outer lighter
    noFill();
    ellipse(cx, cy, r * 2, r * 2);

    // label each ring above the horizontal line, spaced along x
    noStroke();
    fill(255);
    textSize(16);
    textAlign(LEFT, BOTTOM);
    const labelX = cx + r * cos(-PI / 6); // 30° offset to the right
    const labelY = cy - r * sin(-PI / 6) - 10; // above the line
    text(years[i], labelX, labelY);
  }
}

/* function mousePressed() {
  const diameter = height * 4 / 5;
  const cx = width / 2;
  const cy = height / 2;
  const dx = mouseX - cx;
  const dy = mouseY - cy;

  if (dx * dx + dy * dy > (diameter / 2) ** 2) return; // ignore clicks outside circle

  if (dx >= 0 && dy <= 0) {
    console.log('Quadrant 1 (Top-right)');
    playMelody();
  } else if (dx < 0 && dy <= 0) {
    console.log('Quadrant 2 (Top-left)');
    playNote(330);
  } else if (dx < 0 && dy > 0) {
    console.log('Quadrant 3 (Bottom-left)');
    playNote(220);
  } else {
    console.log('Quadrant 4 (Bottom-right)');
    playKick();
  }
}
 */


function mousePressed() {
  const dx = mouseX - cx;
  const dy = mouseY - cy;
  if (dx * dx + dy * dy > radius * radius) return;

  if (dx >= 0 && dy <= 0) {
    activeQuadrant = 1;

    const distFromCenter = sqrt(dx * dx + dy * dy);
    const distanceRatio = constrain(distFromCenter / radius, 0, 1);

    // Start note at this position
    startHeldNote(distanceRatio);
  }
  if (dx < 0 && dy <= 0) {
    console.log('Quadrant 2 (Top-left)');
    playMelody();
  }
  

}

function mouseDragged() {
  if (activeQuadrant !== 1 || !heldSynth) return;

  const dx = mouseX - cx;
  const dy = mouseY - cy;
  const distFromCenter = sqrt(dx * dx + dy * dy);
  const distanceRatio = constrain(distFromCenter / radius, 0, 1);

  updateHeldPitch(distanceRatio);
}

function mouseReleased() {
  if (activeQuadrant === 1) {
    stopHeldNote();
    activeQuadrant = null;
  }
}