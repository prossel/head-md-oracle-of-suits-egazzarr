// sketch.js

let bgImg;

// Hand detection globals
let leftHandDetected = false;
let rightHandDetected = false;
let leftIndexPos = null;
let rightIndexPos = null;
let lastLeftPos = null;
let lastRightPos = null;

// Color feedback
let leftHoverColor = "Unknown";
let rightHoverColor = "Unknown";

// Track previous quadrant states
let wasInQ1 = false;
let wasInQ2 = false;
let wasInQ3 = false;
let wasInQ4 = false;

function preload() {
  preloadSymbols();

  // Try to load the image, but don't crash if missing
  bgImg = loadImage(
    'line_art.png',
    () => console.log("Background loaded"),
    () => {
      console.warn("line_art.png not found — using plain white background");
      bgImg = null; // Just mark as missing
    }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Initialize MediaPipe
  setupHands();
  setupVideo();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}



function draw() {
  // --- White background ---
  background(255);
  
  // --- Background image (square, centered, keeping proportions) ---
  if (bgImg) {
    push();
    tint(255, 230);
    // Make it square based on height, centered horizontally
    let imgSize = height * 0.9; // 0.8 * 0.9 = 0.72
    let imgX = (width - imgSize) / 2;
    let imgY = (height - imgSize) / 2;
    image(bgImg, imgX, imgY, imgSize, imgSize);
    pop();
  }

  // Create circular mask - only show content inside largest circle
  const diameter = height * 4 / 5;
  const cx = width / 2;
  const cy = height / 2;
  
  // Draw everything that needs masking
  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.arc(cx, cy, diameter / 2, 0, TWO_PI);
  drawingContext.clip();

  // Always draw the circle overlay
  drawCircleWithNumbers();

  strokeWeight(2);

  // Reset flags
  leftHandDetected = false;
  rightHandDetected = false;
  leftIndexPos = null;
  rightIndexPos = null;

  // --- Process hands ---
  if (detections && detections.multiHandLandmarks && detections.multiHandLandmarks.length > 0) {
    for (let i = 0; i < detections.multiHandLandmarks.length; i++) {
      let hand = detections.multiHandLandmarks[i];
      let handedness = detections.multiHandedness[i].label;
      let indexTip = hand[FINGER_TIPS.index];

      let fingerPos = {
        x: indexTip.x * width,
        y: indexTip.y * height
      };

      if (handedness === 'Left') {
        leftHandDetected = true;
        leftIndexPos = fingerPos;
      } else if (handedness === 'Right') {
        rightHandDetected = true;
        rightIndexPos = fingerPos;
      }

      drawIndex(hand);
      drawConnections(hand);
    }
  }
  drawQuadrantOverlay();

  // --- Draw red indicator dot before hand is detected (Q3, 1200 ring) ---
  if (!leftHandDetected && !rightHandDetected) {
    const cx = width / 2;
    const cy = height / 2;
    const radius = (height * 4 / 5) / 2;
    const r1200 = map(1, 0, 6, radius * 0.1, radius * 0.9); // 1200 is index 1
    
    // Q3: bottom-left (negative x, positive y from center in screen coords)
    const offset = r1200 / sqrt(2); // 45 degree diagonal
    const dotX = cx - offset; // left
    const dotY = cy + offset; // bottom (screen Y increases downward)
    
    fill(255, 0, 0, 200); // red, alpha 0.5
    noStroke();
    ellipse(dotX, dotY, 30, 30);
  }

  // --- Generate snake trail symbols based on finger position and quadrant ---
  let currentlyInQ1 = false;
  let currentlyInQ2 = false;
  let currentlyInQ3 = false;
  let currentlyInQ4 = false;
  
  if (leftIndexPos) {
    const leftQuadrant = getQuadrant(leftIndexPos);
    if (leftQuadrant !== "None") {
      symbolgenTrail(leftIndexPos.x, leftIndexPos.y, leftQuadrant);
      
      // Q1: Monosynth - sustained notes
      if (leftQuadrant === "1") {
        currentlyInQ1 = true;
        if (window.isQ1Playing && !window.isQ1Playing()) {
          window.playQ1();
        }
        // Update note based on year ring
        if (window.updateQ1Note && window.getYearFromFingerPos) {
          const year = window.getYearFromFingerPos(leftIndexPos);
          if (year) window.updateQ1Note(year);
        }
      }
      
      // Q2: Soft melody sequencer
      if (leftQuadrant === "2") {
        currentlyInQ2 = true;
        if (window.isQ2Playing && !window.isQ2Playing()) {
          window.playQ2();
        }
        // Update melody based on distance from center
        if (window.updateQ2Melody && window.getYearFromFingerPos) {
          const year = window.getYearFromFingerPos(leftIndexPos);
          if (year) window.updateQ2Melody(year);
        }
      }
      
      // Q3: Kick drum with sequencer
      if (leftQuadrant === "3") {
        currentlyInQ3 = true;
        if (window.isQ3Playing && !window.isQ3Playing()) {
          window.playQ3();
        }
        // Modulate sequence based on year ring
        if (window.modulateQ3ByCircles && window.getYearFromFingerPos) {
          const year = window.getYearFromFingerPos(leftIndexPos);
          if (year) window.modulateQ3ByCircles(year);
        }
      }
      
      // Q4: PolyFM - constant chord
      if (leftQuadrant === "4") {
        currentlyInQ4 = true;
        if (window.isQ4Playing && !window.isQ4Playing()) {
          window.playQ4();
        }
      }
    }
  }

  if (rightIndexPos) {
    const rightQuadrant = getQuadrant(rightIndexPos);
    if (rightQuadrant !== "None") {
      symbolgenTrail(rightIndexPos.x, rightIndexPos.y, rightQuadrant);
      
      // Q1: Monosynth - sustained notes
      if (rightQuadrant === "1") {
        currentlyInQ1 = true;
        if (window.isQ1Playing && !window.isQ1Playing()) {
          window.playQ1();
        }
        // Update note based on year ring
        if (window.updateQ1Note && window.getYearFromFingerPos) {
          const year = window.getYearFromFingerPos(rightIndexPos);
          if (year) window.updateQ1Note(year);
        }
      }
      
      // Q2: Soft melody sequencer
      if (rightQuadrant === "2") {
        currentlyInQ2 = true;
        if (window.isQ2Playing && !window.isQ2Playing()) {
          window.playQ2();
        }
        // Update melody based on distance from center
        if (window.updateQ2Melody && window.getYearFromFingerPos) {
          const year = window.getYearFromFingerPos(rightIndexPos);
          if (year) window.updateQ2Melody(year);
        }
      }
      
      // Q3: Kick drum with sequencer
      if (rightQuadrant === "3") {
        currentlyInQ3 = true;
        if (window.isQ3Playing && !window.isQ3Playing()) {
          window.playQ3();
        }
        // Modulate sequence based on year ring
        if (window.modulateQ3ByCircles && window.getYearFromFingerPos) {
          const year = window.getYearFromFingerPos(rightIndexPos);
          if (year) window.modulateQ3ByCircles(year);
        }
      }
      
      // Q4: PolyFM - constant chord
      if (rightQuadrant === "4") {
        currentlyInQ4 = true;
        if (window.isQ4Playing && !window.isQ4Playing()) {
          window.playQ4();
        }
      }
    }
  }

  // Stop sounds when finger leaves quadrants
  if (wasInQ1 && !currentlyInQ1 && window.isQ1Playing && window.isQ1Playing()) {
    window.stopQ1();
  }
  if (wasInQ2 && !currentlyInQ2 && window.isQ2Playing && window.isQ2Playing()) {
    window.fadeOutQ2(600);
  }
  if (wasInQ3 && !currentlyInQ3 && window.isQ3Playing && window.isQ3Playing()) {
    window.stopQ3();
  }
  if (wasInQ4 && !currentlyInQ4 && window.isQ4Playing && window.isQ4Playing()) {
    window.stopQ4();
  }
  
  // Update previous state
  wasInQ1 = currentlyInQ1;
  wasInQ2 = currentlyInQ2;
  wasInQ3 = currentlyInQ3;
  wasInQ4 = currentlyInQ4;

  /* // --- Color detection for fingers ---
if (leftIndexPos) {
  let imgPt = canvasToImageCoords(leftIndexPos.x, leftIndexPos.y, bgImg, width, height);
  let avgRgb = sampleAvgColor(bgImg, imgPt.x, imgPt.y, 5);
  leftHoverColor = detectColor(rgbToHsv(...avgRgb));

  // Continuous emission if on silver
  if (leftHoverColor === "Silver" && frameCount % 4 === 0) {
    symbolgen(leftIndexPos.x, leftIndexPos.y);
  }
} else {
  leftHoverColor = "Unknown";
}

if (rightIndexPos) {
  let imgPt = canvasToImageCoords(rightIndexPos.x, rightIndexPos.y, bgImg, width, height);
  let avgRgb = sampleAvgColor(bgImg, imgPt.x, imgPt.y, 5);
  rightHoverColor = detectColor(rgbToHsv(...avgRgb));

  if (rightHoverColor === "Silver" && frameCount % 4 === 0) {
    symbolgen(rightIndexPos.x, rightIndexPos.y);
  }
} else {
  rightHoverColor = "Unknown";
} */
  
  // --- Draw trail symbols (snake formation) ---
  updateAndDrawTrail();

  // End circular mask
  drawingContext.restore();
  pop();

  // --- Overlay UI (outside the mask) ---
  //write on top left corner
  fill(255,0,0);
  noStroke();
  textSize(14);
  textFont('Courier New');
  textAlign(LEFT, TOP);
  text(`TOUCH THE DOT\n\n\nDid you know that \nin the Mamluk empire, in 1200,\none of the symbols on playing cards \nwere polo sticks?`, 10, 10);
  
  /* drawColorOverlay(); */


}

function getQuadrant(fingerPos) {
  if (!fingerPos) return "None";

  const cx = width / 2;
  const cy = height / 2;

  const dx = fingerPos.x - cx;
  const dy = cy - fingerPos.y; // invert y because p5 y increases downwards

  if (dx >= 0 && dy >= 0) return "1"; // top-right
  if (dx < 0 && dy >= 0) return "2";  // top-left
  if (dx < 0 && dy < 0) return "3";   // bottom-left
  if (dx >= 0 && dy < 0) return "4";  // bottom-right

  return "Unknown";
}

function drawCircleWithNumbers() {
  const diameter = height * 4 / 5;
  const cx = width / 2;
  const cy = height / 2;
  const radius = diameter / 2;

  // main circle outline
  noFill();
  stroke(0);
  strokeWeight(2);
  ellipse(cx, cy, diameter, diameter);

  // quadrant cross
  line(cx - radius, cy, cx + radius, cy);
  line(cx, cy - radius, cx, cy + radius);

  // --- concentric circles with years ---
  const years = [1100, 1200, 1300, 1400, 1500, 1600, 1700];
  const ringCount = years.length;

  // All rings in black
  stroke(0);
  strokeWeight(1);
  noFill();
  
  for (let i = 0; i < ringCount; i++) {
    const r = map(i, 0, ringCount - 1, radius * 0.1, radius * 0.9);
    ellipse(cx, cy, r * 2, r * 2);
  }

  // Draw year labels radially in each quadrant, readable from that side
  // Q1: bottom edge (right side) - readable from bottom
  // Q2: bottom edge (left side) - readable from bottom  
  // Q3: top edge (left side) - readable from top
  // Q4: top edge (right side) - readable from top
  
  noStroke();
  fill(0);
  textSize(14);
  
  for (let i = 0; i < ringCount; i++) {
    const r = map(i, 0, ringCount - 1, radius * 0.1, radius * 0.9);
    const yearText = years[i].toString();
    const offset = 15; // distance from circle line
    
    // Q1: Top-right quadrant (45°) - text readable from right side
    push();
    translate(cx + r * cos(PI/4), cy + r * sin(PI/4) + offset);
    rotate(0); // horizontal, readable from right
    textAlign(CENTER, TOP);
    text(yearText, 0, 0);
    pop();
    
    // Q2: Top-left quadrant (135°) - text readable from left side
    push();
    translate(cx + r * cos(3*PI/4), cy + r * sin(3*PI/4) + offset);
    rotate(0); // horizontal, readable from left
    textAlign(CENTER, TOP);
    text(yearText, 0, 0);
    pop();
    
    // Q3: Bottom-left quadrant (225°) - text readable from left side
    push();
    translate(cx + r * cos(-3*PI/4), cy + r * sin(-3*PI/4) - offset);
    rotate(0); // horizontal, readable from left
    textAlign(CENTER, BOTTOM);
    text(yearText, 0, 0);
    pop();
    
    // Q4: Bottom-right quadrant (315°) - text readable from right side
    push();
    translate(cx + r * cos(-PI/4), cy + r * sin(-PI/4) - offset);
    rotate(0); // horizontal, readable from right
    textAlign(CENTER, BOTTOM);
    text(yearText, 0, 0);
    pop();
  }
}

// --- Overlay: show which quadrant each finger is in ---
function drawQuadrantOverlay() {
  const pad = 12;
  const leftQuadrant = getQuadrant(leftIndexPos);
  const rightQuadrant = getQuadrant(rightIndexPos);

  const lines = [
    `Left: Q${leftQuadrant}`,
    `Right: Q${rightQuadrant}`
  ];

  textSize(18);
  textAlign(RIGHT, BOTTOM);

  let boxW = max(textWidth(lines[0]), textWidth(lines[1])) + pad * 2;
  let boxH = lines.length * 22 + pad;

  noStroke();
  fill(0, 150);
  rect(width - boxW - 20, height - boxH - 20, boxW, boxH, 8);

  fill(255);
  for (let i = 0; i < lines.length; i++) {
    text(
      lines[i],
      width - 20 - pad / 2,
      height - 20 - (lines.length - 1 - i) * 22 - pad / 2
    );
  }
}


/* 
function drawColorOverlay() {
  const pad = 12;
  const lines = [
    `Left: ${leftHoverColor}`,
    `Right: ${rightHoverColor}`
  ];

  textSize(18);
  textAlign(RIGHT, BOTTOM);

  let boxW = max(textWidth(lines[0]), textWidth(lines[1])) + pad * 2;
  let boxH = lines.length * 22 + pad;

  noStroke();
  fill(0, 150);
  rect(width - boxW - 20, height - boxH - 20, boxW, boxH, 8);

  fill(255);
  for (let i = 0; i < lines.length; i++) {
    text(
      lines[i],
      width - 20 - pad / 2,
      height - 20 - (lines.length - 1 - i) * 22 - pad / 2
    );
  }
}
 */