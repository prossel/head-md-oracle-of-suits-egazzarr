// generatesound.js - Quadrant sound systems with Gibberish

(() => {
  Gibberish.workletPath = 'https://unpkg.com/gibberish-dsp/dist/gibberish_worklet.js';
  let ready = false;
  
  // Q1: Monosynth/FM - sustained notes changing with year positions
  let q1Synth, q1LastYear = null;
  let isQ1Playing = false;
  
  // Q2: Soft melody sequencer
  let q2Synth, q2Seq;
  let isQ2Playing = false;
  
  // Q3: Kick drum with sequencer - rhythmic
  let q3Kick, q3Seq;
  let isQ3Playing = false;
  
  // Q4: PolyFM with reverb and chorus
  let q4Fm, q4Verb, q4Chorus, q4LastYear = null;
  let isQ4Playing = false;

  const yearFreqs = {
    1100: 55,
    1200: 73.42,
    1300: 110,
    1400: 146.83,
    1500: 220,
    1600: 293.66,
    1700: 440
  };

  async function initSound() {
    if (ready) return;
    try {
      if (typeof userStartAudio === 'function') await userStartAudio();
      await Gibberish.init();
      Gibberish.export(window);
      ready = true;
      console.log('🎵 Gibberish ready');
    } catch (e) {
      console.error('Audio init failed:', e);
    }
  }

  window.addEventListener('pointerdown', initSound, { once: true });

  // ============ Q1: MONOSYNTH - Sustained notes changing with years ============
  window.playQ1 = function() {
    if (!ready || isQ1Playing) return;
    q1Synth = Monosynth({ gain: .8, attack: 44, decay: 44100 }).connect();
    q1Synth.note(110);
    isQ1Playing = true;
  };

  window.updateQ1Note = function(year) {
    if (!ready || !isQ1Playing || !q1Synth) return;
    if (q1LastYear !== year && yearFreqs[year]) {
      q1Synth.note(yearFreqs[year]);
      q1LastYear = year;
    }
  };

  window.stopQ1 = function() {
    if (q1Synth && isQ1Playing) {
      q1Synth.disconnect();
      q1Synth = null;
      isQ1Playing = false;
      q1LastYear = null;
    }
  };

  window.isQ1Playing = () => isQ1Playing;

  // ============ Q2: SOFT MELODY SEQUENCER ============
  window.playQ2 = function() {
    if (!ready || isQ2Playing) return;
    
    // Use FM for a softer, different timbre
    q2Synth = FM({ 
      gain: .8,  // Louder
      attack: 220,
      decay: 8820,
      cmRatio: 2.01,
      index: 1,
      carrierWaveform: 'sine',
      modulatorWaveform: 'triangle'
    }).connect();

    q2Seq = Sequencer({
      target: q2Synth,
      key: 'note',
      values: [220, 264, 330, 392],  // Will be updated by distance
      timings: [12050]
    }).start();
    
    isQ2Playing = true;
  };

  window.updateQ2Melody = function(year) {
    if (!ready || !isQ2Playing || !q2Seq) return;
    
    // Change melody based on year (distance from center)
    const melodies = {
      1100: [110, 132, 165, 196],  // Innermost - lower tones
      1200: [147, 176, 220, 262],
      1300: [165, 198, 247, 294],
      1400: [220, 264, 330, 392],  // Middle
      1500: [262, 314, 392, 466],
      1600: [330, 396, 495, 588],
      1700: [440, 528, 660, 784]   // Outermost - higher tones
    };
    
    if (melodies[year]) {
      q2Seq.values = melodies[year];
    }
  };

  window.fadeOutQ2 = function(duration = 600) {
    if (!q2Synth || !isQ2Playing) return;
    
    // Stop sequencer immediately to prevent new notes
    if (q2Seq) q2Seq.stop();
    
    const startGain = q2Synth.gain;
    const startTime = Date.now();
    const synth = q2Synth;
    
    const fadeInterval = setInterval(() => {
      if (!synth) {
        clearInterval(fadeInterval);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      synth.gain = startGain * (1 - progress);
      
      if (progress >= 1) {
        clearInterval(fadeInterval);
        synth.disconnect();
        isQ2Playing = false;
        q2Synth = null;
        q2Seq = null;
      }
    }, 50);
  };

  window.stopQ2 = function() {
    if (q2Seq) q2Seq.stop();
    if (q2Synth) q2Synth.disconnect();
    q2Synth = null;
    q2Seq = null;
    isQ2Playing = false;
  };

  window.isQ2Playing = () => isQ2Playing;

  // ============ Q3: KICK DRUM + SEQUENCER - Rhythmic ============
  window.playQ3 = function() {
    if (!ready || isQ3Playing) return;
    
    q3Kick = Kick({ gain: .8 }).connect();
    q3Seq = Sequencer({ 
      target: q3Kick, 
      key: 'note', 
      values: [120], 
      timings: [22050] 
    }).start();
    
    isQ3Playing = true;
  };

  window.updateQ3Sequence = function(values, timings) {
    if (!ready || !isQ3Playing || !q3Seq) return;
    if (values) q3Seq.values = values;
    if (timings) q3Seq.timings = timings;
  };

  window.modulateQ3ByCircles = function(year) {
    if (!ready || !isQ3Playing || !q3Seq) return;
    // Modulate sequence based on year position
    const yearIndex = [1100, 1200, 1300, 1400, 1500, 1600, 1700].indexOf(year);
    if (yearIndex !== -1) {
      // Add more frequencies as we go further out
      const freqs = [120];
      for (let i = 0; i <= yearIndex; i++) {
        freqs.push(120 * (i + 1));
      }
      q3Seq.values = freqs;
      // Get faster as we go out
      q3Seq.timings = [22050 / (yearIndex + 1)];
    }
  };

  window.stopQ3 = function() {
    if (q3Seq) q3Seq.stop();
    if (q3Kick) q3Kick.disconnect();
    q3Kick = null;
    q3Seq = null;
    isQ3Playing = false;
  };

  window.isQ3Playing = () => isQ3Playing;

  // ============ Q4: PolyFM with Reverb & Chorus - Long sustain chord ============
  window.playQ4 = function() {
    if (!ready || isQ4Playing) return;
    
    // Create effects chain: PolyFM -> Chorus -> Freeverb -> output
    q4Verb = Freeverb({ 
      roomSize: .95, 
      damping: .15 
    }).connect();
    
    q4Chorus = Chorus().connect(q4Verb);
    
    q4Fm = PolyFM({ 
      gain: .8,
      cmRatio: 1.01,
      index: 1.2,
      carrierWaveform: 'triangle',
      modulatorWaveform: 'square',
      attack: 44100 * 32,
      decay: 44100 * 32,
      feedback: .1,
    }).connect(q4Chorus);

    // Play chord
    q4Fm.chord([110, 220, 330, 440]);
    isQ4Playing = true;
  };

  window.updateQ4Note = function(year) {
    // Q4 stays constant - no year-based changes
  };

  window.fadeOutQ4 = function(duration = 800) {
    // Not used - instant cut instead
  };

  window.stopQ4 = function() {
    if (q4Fm) q4Fm.disconnect();
    if (q4Chorus) q4Chorus.disconnect();
    if (q4Verb) q4Verb.disconnect();
    q4Fm = null;
    q4Verb = null;
    q4Chorus = null;
    isQ4Playing = false;
    q4LastYear = null;
  };

  window.isQ4Playing = () => isQ4Playing;

  // Helper to get year from position
  window.getYearFromFingerPos = function(fingerPos) {
    const cx = width / 2;
    const cy = height / 2;
    const radius = (height * 4 / 5) / 2;
    
    const dx = fingerPos.x - cx;
    const dy = fingerPos.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const years = [1100, 1200, 1300, 1400, 1500, 1600, 1700];
    const ringCount = years.length;
    const minRadius = radius * 0.1;
    const maxRadius = radius * 0.9;
    
    let closestYear = null;
    let minDiff = Infinity;
    
    for (let i = 0; i < ringCount; i++) {
      const r = minRadius + (maxRadius - minRadius) * i / (ringCount - 1);
      const diff = Math.abs(dist - r);
      
      if (diff < minDiff && diff < 30) {
        minDiff = diff;
        closestYear = years[i];
      }
    }
    
    return closestYear;
  };
})();
