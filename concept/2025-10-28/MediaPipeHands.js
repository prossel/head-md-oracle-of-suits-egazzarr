// the video element used by MediaPipe Camera util
let videoElement;
// if detections is null it means no hands detected
let detections = null;
let cam;
let offscreen; // p5 graphics buffer for flipped frames

// Active area definition
let activeArea = loadActiveArea() || {
  x: 160,      // top-left x
  y: 120,      // top-left y
  width: 320,  // width of the area
  height: 240  // height of the area
};
const MOVE_STEP = 5;    // pixels to move with arrow keys
const SIZE_STEP = 5;   // pixels to resize with SHIFT + arrows
let calibrationMode = false;  // calibration mode off by default
let positionMode = false;  // position adjustment mode
let sizeMode = false;      // size adjustment mode
let diameterMode = false;  // diameter adjustment mode
let saveTimeout = null;    // for debouncing saves

// Load active area from localStorage
function loadActiveArea() {
  const stored = localStorage.getItem('activeArea');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load active area:', e);
      return null;
    }
  }
  return null;
}

// Save active area to localStorage
function saveActiveArea() {
  try {
    localStorage.setItem('activeArea', JSON.stringify(activeArea));
    console.log('Active area saved');
  } catch (e) {
    console.error('Failed to save active area:', e);
  }
}

// Create the Hands instance and provide a tiny init helper.
if (!window.hands) {
    window.hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
}

// now create a local reference to the shared instance
const hands = window.hands;

const FINGER_TIPS = {
  thumb: 4,
  index: 8,
  middle: 12,
  ring: 16,
  pinky: 20
};

const HAND_CONNECTIONS = [
    // wrist to thumb
    [0, 1], [1, 2], [2, 3], [3, 4],
    // wrist to index
    [0, 5], [5, 6], [6, 7], [7, 8],
    // middle
    [0, 9], [9, 10], [10, 11], [11, 12],
    // ring
    [0, 13], [13, 14], [14, 15], [15, 16],
    // pinky
    [0, 17], [17, 18], [18, 19], [19, 20]
];

function setupVideo(selfieMode = false) {
  videoElement = createCapture(VIDEO);
  videoElement.size(640, 480);
  videoElement.hide();

  offscreen = createGraphics(640, 480);

  cam = new Camera(videoElement.elt, {
    onFrame: async () => {
      // Draw the video frame directly to offscreen buffer
      offscreen.clear();
      offscreen.image(videoElement, 0, 0, offscreen.width, offscreen.height);
      
      // Send the video to MediaPipe
      await hands.send({ image: videoElement.elt });
    },
    width: 640,
    height: 480
  });

  cam.start();
}


function setupHands() {
    hands.setOptions({
        maxNumHands: 4,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
        selfieMode: false, // Mirror coordinates to match flipped video display
    });

    // register results handler on the shared instance
    hands.onResults(onHandsResults);
}

// store the results of the hand detection
function onHandsResults(results) {
  detections = results;
}


// move the videoElement && videoElement.loadedmetadata checks to here
function isVideoReady() {
    return videoElement && videoElement.loadedmetadata;
}

// Map camera coordinates to canvas coordinates using active area calibration
function mapCameraToCanvas(cameraX, cameraY, canvasWidth, canvasHeight) {
    // Convert normalized coordinates to camera pixel coordinates
    const camX = cameraX * 640; // camera width
    const camY = cameraY * 480; // camera height
    
    // Map from active area to canvas space
    const mappedX = map(camX, activeArea.x, activeArea.x + activeArea.width, 0, canvasWidth);
    const mappedY = map(camY, activeArea.y, activeArea.y + activeArea.height, 0, canvasHeight);
    
    return { x: mappedX, y: mappedY };
}


function getCameraPreview() {
    // Draw hand landmarks and connections on the preview buffer
    if (detections && detections.multiHandLandmarks) {
        offscreen.push();
        offscreen.strokeWeight(2);
        for (let i = 0; i < detections.multiHandLandmarks.length; i++) {
            const hand = detections.multiHandLandmarks[i];
            // Draw connections
            drawConnectionsOnPreview(hand);
            // Draw all landmarks
            drawAllLandmarksOnPreview(hand);
        }
        offscreen.pop();
    }
    
    // Handle calibration mode features
    if (calibrationMode) {
        // Handle continuous keyboard input for active area adjustment
        handleActiveAreaControls();
        
        // Draw active area
        drawActiveAreaOnPreview();
        
        // Display active area coordinates
        displayActiveAreaInfoOnPreview();
    }
    
    return offscreen;
}

// Handle active area controls
function handleActiveAreaControls() {
  // Determine step size: use STEP if SHIFT is held, otherwise 1 pixel
  const moveStep = keyIsDown(SHIFT) ? MOVE_STEP : 1;
  const sizeStep = keyIsDown(SHIFT) ? SIZE_STEP : 1;
  const diameterStep = keyIsDown(SHIFT) ? 0.005 : 0.001; // 5% or 1% adjustment
  
  let changed = false;
  
  // Handle position mode
  if (positionMode) {
    if (keyIsDown(LEFT_ARROW)) {
      activeArea.x = max(0, activeArea.x - moveStep);
      changed = true;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      activeArea.x = min(offscreen.width - activeArea.width, activeArea.x + moveStep);
      changed = true;
    }
    if (keyIsDown(UP_ARROW)) {
      activeArea.y = max(0, activeArea.y - moveStep);
      changed = true;
    }
    if (keyIsDown(DOWN_ARROW)) {
      activeArea.y = min(offscreen.height - activeArea.height, activeArea.y + moveStep);
      changed = true;
    }
  }
  
  // Handle size mode
  if (sizeMode) {
    if (keyIsDown(LEFT_ARROW)) {
      activeArea.width = max(50, activeArea.width - sizeStep);
      changed = true;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      activeArea.width = min(offscreen.width - activeArea.x, activeArea.width + sizeStep);
      changed = true;
    }
    if (keyIsDown(UP_ARROW)) {
      activeArea.height = max(50, activeArea.height - sizeStep);
      changed = true;
    }
    if (keyIsDown(DOWN_ARROW)) {
      activeArea.height = min(offscreen.height - activeArea.y, activeArea.height + sizeStep);
      changed = true;
    }
  }
  
  // Handle diameter mode
  if (diameterMode && typeof updateDiameter === 'function' && typeof diameterRatio !== 'undefined') {
    if (keyIsDown(UP_ARROW) || keyIsDown(RIGHT_ARROW)) {
      updateDiameter(diameterRatio + diameterStep);
      // No changed = true because updateDiameter handles its own saving
    }
    if (keyIsDown(DOWN_ARROW) || keyIsDown(LEFT_ARROW)) {
      updateDiameter(diameterRatio - diameterStep);
      // No changed = true because updateDiameter handles its own saving
    }
  }
  
  // Debounce save: only save 500ms after the last change
  if (changed) {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      saveActiveArea();
    }, 500);
  }
}

// Draw connections on the preview buffer
function drawConnectionsOnPreview(landmarks) {
    offscreen.stroke(0, 255, 0);
    
    for (let connection of HAND_CONNECTIONS) {
        const a = landmarks[connection[0]];
        const b = landmarks[connection[1]];
        if (!a || !b) continue;
        
        let ax = a.x * offscreen.width;
        let ay = a.y * offscreen.height;
        let bx = b.x * offscreen.width;
        let by = b.y * offscreen.height;
        offscreen.line(ax, ay, bx, by);
    }
}

// Draw all landmarks on the preview buffer
function drawAllLandmarksOnPreview(landmarks) {
    offscreen.noStroke();
    offscreen.fill(255, 0, 0);
    
    for (const lm of landmarks) {
        const x = lm.x * offscreen.width;
        const y = lm.y * offscreen.height;
        offscreen.circle(x, y, 6);
    }

    // Display index tip coordinates (landmark 8) and mapped to active area
    if (calibrationMode && landmarks[8]) {
        const ix = landmarks[8].x * offscreen.width;
        const iy = landmarks[8].y * offscreen.height;

        // Map to active area
        let mappedX = map(ix, activeArea.x, activeArea.x + activeArea.width, 0, activeArea.width, false);
        let mappedY = map(iy, activeArea.y, activeArea.y + activeArea.height, 0, activeArea.height, false);

        // Measure text to determine background size
        offscreen.textSize(12);
        const text1 = `(${ix.toFixed()}, ${iy.toFixed()})`;
        const text2 = `(${mappedX.toFixed()}, ${mappedY.toFixed()})`;
        const maxWidth = Math.max(offscreen.textWidth(text1), offscreen.textWidth(text2)) + 10;
        const bgHeight = 50;

        // Draw background
        offscreen.fill(0, 0, 0, 150);
        offscreen.noStroke();
        offscreen.rectMode(CENTER);
        offscreen.rect(ix, iy, maxWidth, bgHeight);
        offscreen.rectMode(CORNER);

        // Draw text
        offscreen.fill(255, 255, 255);
        offscreen.textSize(12);
        offscreen.textAlign(CENTER, BOTTOM);
        offscreen.text(text1, ix, iy - 6);
        offscreen.fill(0, 255, 255);
        offscreen.textAlign(CENTER, TOP);
        offscreen.text(text2, ix, iy + 6);
    }
}

// Draw active area on the preview buffer
function drawActiveAreaOnPreview() {
    offscreen.push();
    offscreen.noFill();
    offscreen.stroke(0, 255, 255);
    offscreen.strokeWeight(3);
    offscreen.rect(activeArea.x, activeArea.y, activeArea.width, activeArea.height);
    offscreen.pop();
}

// Display active area info on the preview buffer
function displayActiveAreaInfoOnPreview() {
    offscreen.push();
    offscreen.fill(0, 0, 0, 150);
    offscreen.noStroke();
    offscreen.rect(10, 10, 280, 145);
    
    offscreen.fill(255);
    offscreen.textSize(12);
    offscreen.textAlign(LEFT, TOP);
    offscreen.text(`Active Area:`, 15, 15);
    offscreen.text(`Pos: (${activeArea.x}, ${activeArea.y})`, 15, 30);
    offscreen.text(`Size: ${activeArea.width} x ${activeArea.height}`, 15, 45);
    
    // Show current mode
    let modeText = positionMode ? '[P] Position mode' : 
                   (sizeMode ? '[S] Size mode' : 
                   (diameterMode ? '[D] Diameter mode' : 'P: pos | S: size | D: diam'));
    offscreen.text(modeText, 15, 60);
    
    // Show diameter info (accessing from sketch.js globals)
    if (typeof diameter !== 'undefined' && typeof diameterRatio !== 'undefined') {
        offscreen.text(`Diameter: ${Math.round(diameter)} px`, 15, 75);
        offscreen.text(`Ratio: ${(diameterRatio * 100).toFixed(1)}%`, 15, 90);
    }
    
    offscreen.text(`SHIFT: fast adjust`, 15, 105);
    offscreen.text(`Arrows: adjust | C: toggle`, 15, 120);
    offscreen.pop();
}

function drawIndex(landmarks) {
  // get the index fingertip landmark
  let mark = landmarks[FINGER_TIPS.index];

  noStroke();
  // set fill color for index fingertip
  fill(0, 100, 255);

  // adapt the coordinates (0..1) to canvas coordinates
  let x = mark.x * width;
  let y = mark.y * height;
  circle(x, y, 20);
}

function drawLandmarks(landmarks) {
  noStroke();
  // set fill color for landmarks
  fill(255, 0, 0);

  for (let i = 0; i < landmarks.length; i++) {
    let mark = landmarks[i];
    // adapt the coordinates (0..1) to canvas coordinates
    let x = mark.x * width;
    let y = mark.y * height;
    circle(x, y, 6);
  }
}

function drawConnections(landmarks) {
  // set stroke color for connections
  stroke(0, 255, 0);

  // iterate through each connection
  for (let connection of HAND_CONNECTIONS) {
    // get the two landmarks to connect
    const a = landmarks[connection[0]];
    const b = landmarks[connection[1]];
    // skip if either landmark is missing
    if (!a || !b) continue;
    // landmarks are normalized [0..1], (x,y) with origin top-left
    let ax = a.x * width;
    let ay = a.y * height;
    let bx = b.x * width;
    let by = b.y * height;
    line(ax, ay, bx, by);
  }
}

// Keyboard event listeners for calibration controls
document.addEventListener('keydown', (e) => {
  // Toggle calibration mode with C key
  if (e.key === 'c' || e.key === 'C') {
    calibrationMode = !calibrationMode;
    console.log(`Calibration mode: ${calibrationMode ? 'ON' : 'OFF'}`);
  }
  
  // Toggle position mode with P key
  if (e.key === 'p' || e.key === 'P') {
    positionMode = !positionMode;
    if (positionMode) {
      sizeMode = false; // Turn off size mode
      diameterMode = false; // Turn off diameter mode
    }
    console.log(`Position mode: ${positionMode ? 'ON' : 'OFF'}`);
  }
  
  // Toggle size mode with S key
  if (e.key === 's' || e.key === 'S') {
    sizeMode = !sizeMode;
    if (sizeMode) {
      positionMode = false; // Turn off position mode
      diameterMode = false; // Turn off diameter mode
    }
    console.log(`Size mode: ${sizeMode ? 'ON' : 'OFF'}`);
  }
  
  // Toggle diameter mode with D key
  if (e.key === 'd' || e.key === 'D') {
    diameterMode = !diameterMode;
    if (diameterMode) {
      positionMode = false; // Turn off position mode
      sizeMode = false; // Turn off size mode
    }
    console.log(`Diameter mode: ${diameterMode ? 'ON' : 'OFF'}`);
  }
  
  // Prevent default browser behavior for arrow keys when in position, size, or diameter mode
  if ((positionMode || sizeMode || diameterMode) && 
      (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
       e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    e.preventDefault();
  }
});