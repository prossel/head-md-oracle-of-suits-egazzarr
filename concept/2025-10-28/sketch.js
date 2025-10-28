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

function preload() {
  bgImg = loadImage('proto4.png');
  preloadSymbols(); 
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
  // --- Draw background ---
  if (bgImg) {
    push();
    tint(255, 230);
    image(bgImg, 0, 0, width, height);
    pop();
  } else {
    background(255);
  }

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

  // --- Color detection for fingers ---
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
}
  //write on top left corner
  fill(0);
  noStroke();
  textSize(14);
  textFont('Courier New');
  textAlign(LEFT, TOP);
  text(`TOUCHING SOUNDS\n\n\nMove your hand above the wheel \nto discover the history of card suits`, 10, 10);
  // --- Draw symbols ---
  updateAndDrawSymbols();

  // --- Overlay UI ---
  drawColorOverlay();


}

// === Overlay UI ===
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
