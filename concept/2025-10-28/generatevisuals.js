// generatevisuals.js

let symbolImages = {
  diamonds: {},
  spades: {},
  clubs: {},
  hearts: {}
};

let symbolParticles = [];

// Available years and their corresponding images
const years = [1100, 1200, 1300, 1400, 1500, 1600, 1700];
const imageFiles = {
  1100: '1100-china.png',
  1200: '1200-egypt.png',
  1300: '1300-spain.png',
  1400: '1400-ita.png',
  1500: '1500-portugal.png',
  1600: '1600-japan.png',
  1700: '1700-fr.png'
};

function preloadSymbols() {
  // Load all images for each suit
  const suits = ['diamonds', 'spades', 'clubs', 'hearts'];
  
  suits.forEach(suit => {
    // Load each year's images
    Object.keys(imageFiles).forEach(year => {
      const files = imageFiles[year];
      if (Array.isArray(files)) {
        symbolImages[suit][year] = [];
        files.forEach(file => {
          symbolImages[suit][year].push(loadImage(`img/${suit}/${file}`));  //change to img/ or /drawings/ as needed
        });
      } else {
        symbolImages[suit][year] = loadImage(`img/${suit}/${files}`);
      }
    });
  });
}

class SymbolParticle {
  constructor(x, y, img) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(0.5, 2));
    this.size = 60; // ≈ 1 cm visual scale
    this.birthTime = millis();
    this.fadeTime = 3000; // 2 seconds fade
    this.img = img;
  }

  update() {
    this.pos.add(this.vel);
  }

  draw() {
    if (!this.img) return;
    
    let age = millis() - this.birthTime;
    let alpha = map(age, 0, this.fadeTime, 255, 0);
    alpha = constrain(alpha, 0, 255);
    
    push();
    tint(255, alpha);
    image(this.img, this.pos.x - this.size / 2, this.pos.y - this.size / 2, this.size, this.size);
    pop();
  }

  isDead() {
    return millis() - this.birthTime > this.fadeTime;
  }
}

// Get the year ring the finger is hovering over
function getYearFromPosition(fingerPos) {
  if (!fingerPos) return null;
  
  const cx = width / 2;
  const cy = height / 2;
  const radius = (height * 4 / 5) / 2;
  
  // Calculate distance from center
  const dx = fingerPos.x - cx;
  const dy = fingerPos.y - cy;
  const dist = sqrt(dx * dx + dy * dy);
  
  // Map distance to year rings
  const ringCount = years.length;
  const minRadius = radius * 0.1;
  const maxRadius = radius * 0.9;
  
  // Find which ring we're closest to
  let closestYear = null;
  let minDiff = Infinity;
  
  for (let i = 0; i < ringCount; i++) {
    const r = map(i, 0, ringCount - 1, minRadius, maxRadius);
    const diff = abs(dist - r);
    
    if (diff < minDiff && diff < 30) { // 30 pixel threshold
      minDiff = diff;
      closestYear = years[i];
    }
  }
  
  return closestYear;
}

// Get suit based on quadrant
function getSuitFromQuadrant(quadrant) {
  switch(quadrant) {
    case "1": return "diamonds";
    case "2": return "spades";
    case "3": return "clubs";
    case "4": return "hearts";
    default: return null;
  }
}

// Generate symbol at finger position
function symbolgen(x, y, quadrant) {
  const year = getYearFromPosition({x, y});
  const suit = getSuitFromQuadrant(quadrant);
  
  if (!year || !suit) return;
  
  // Get the image for this year and suit
  let img = symbolImages[suit][year];
  
  // If multiple images available, pick a random one
  if (Array.isArray(img)) {
    img = random(img);
  }
  
  if (img) {
    symbolParticles.push(new SymbolParticle(x, y, img));
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

// ============ ALTERNATIVE: SNAKE TRAIL SYSTEM ============

let symbolTrail = [];
const maxTrailLength = 20; // Maximum number of symbols in the trail

class TrailSymbol {
  constructor(x, y, img) {
    this.pos = createVector(x, y);
    this.size = 50;
    this.birthTime = millis();
    this.fadeTime = 2000; // 2 seconds fade
    this.img = img;
  }

  draw() {
    if (!this.img) return;
    
    let age = millis() - this.birthTime;
    let alpha = map(age, 0, this.fadeTime, 255, 0);
    alpha = constrain(alpha, 0, 255);
    
    push();
    tint(255, alpha);
    image(this.img, this.pos.x - this.size / 2, this.pos.y - this.size / 2, this.size, this.size);
    pop();
  }

  isDead() {
    return millis() - this.birthTime > this.fadeTime;
  }
}

// Snake-trail generation: only draws when finger moves to new position
let lastTrailPos = { x: -1, y: -1 };
const minTrailDistance = 25; // Minimum distance between trail symbols

function symbolgenTrail(x, y, quadrant) {
  // Check if finger moved enough to create new symbol
  const dist = sqrt((x - lastTrailPos.x) ** 2 + (y - lastTrailPos.y) ** 2);
  if (dist < minTrailDistance) return;
  
  const year = getYearFromPosition({x, y});
  const suit = getSuitFromQuadrant(quadrant);
  
  if (!year || !suit) return;
  
  // Get the image for this year and suit
  let img = symbolImages[suit][year];
  
  // If multiple images available, pick a random one
  if (Array.isArray(img)) {
    img = random(img);
  }
  
  if (img) {
    symbolTrail.push(new TrailSymbol(x, y, img));
    
    // Keep trail at maximum length
    if (symbolTrail.length > maxTrailLength) {
      symbolTrail.shift(); // Remove oldest symbol
    }
    
    // Update last position
    lastTrailPos.x = x;
    lastTrailPos.y = y;
  }
}

function updateAndDrawTrail() {
  for (let i = symbolTrail.length - 1; i >= 0; i--) {
    let s = symbolTrail[i];
    s.draw();
    if (s.isDead()) symbolTrail.splice(i, 1);
  }
}

function clearTrail() {
  symbolTrail = [];
  lastTrailPos = { x: -1, y: -1 };
}
