// minimal melody synth for quadrant 1
let melodySynth;
let melodySeq;
let glideSynth; // persistent synth for continuous control
let heldSynth = null;
const noteSet = [220, 264, 330, 392, 440, 523, 660, 784]; // A simple ascending scale

    // sound.js — minimal Gibberish setup
(() => {
  Gibberish.workletPath = 'https://unpkg.com/gibberish-dsp/dist/gibberish_worklet.js';
  let ready = false;

  async function initSound() {
    if (ready) return;
    try {
      if (typeof userStartAudio === 'function') await userStartAudio(); // for p5
      await Gibberish.init();
      Gibberish.export(window);
      ready = true;
      console.log('🎵 Gibberish ready');
    } catch (e) {
      console.error('Audio init failed:', e);
    }
  }


  window.addEventListener('pointerdown', initSound, { once: true });

  // make simple synth and kick
  window.playNote = freq => {
    if (!ready) return;
    const synth = Synth().connect();
    synth.note(freq);
  };

  window.playKick = () => {
    if (!ready) return;
    const kick = Kick().connect();
    kick.trigger();
  };

window.playMelody = () => {
  if (!ready) return;
  melodySynth = Synth().connect();

  melodySeq = Sequencer({
    target: melodySynth,
    key: 'note',
    values: [220, 264, 330, 392],
    timings: [12050]
  }).start();
};


window.startHeldNote = distanceRatio => {
  if (!ready) return;
  const idx = Math.round(distanceRatio * (noteSet.length - 1));
  const freq = noteSet[idx];
  heldSynth = Synth({ attack: 44, decay: 441000 }).connect();
  heldSynth.note(freq);
};

window.updateHeldPitch = distanceRatio => {
  if (!ready || !heldSynth) return;
  const idx = distanceRatio * (noteSet.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.min(lower + 1, noteSet.length - 1);
  const frac = idx - lower;
  const freq = lerp(noteSet[lower], noteSet[upper], frac);
  heldSynth.note(freq); // smooth modulation
};

window.stopHeldNote = () => {
  if (heldSynth) {
    heldSynth.disconnect();
    heldSynth = null;
  }
};

})();
