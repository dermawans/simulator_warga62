// Web Audio API Synthesizer for cheerful Indonesian comic game BGM and SFX

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgmTimer: number | null = null;
  private bgmStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policy
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- Sound Effects ---

  public playHop() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.06);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playDiceRoll() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240 + Math.random() * 220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
      }, i * 55);
    }
  }

  public playDiceLand() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Satisfying double-thud impact on felt/wood plus high sparkle
    const now = this.ctx.currentTime;
    
    // Impact 1 (first die landing)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(55, now + 0.09);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.1);

    // Impact 2 (second die landing slightly after)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(220, now + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(65, now + 0.16);
    gain2.gain.setValueAtTime(0.3, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.18);

    // Ding chime on final result
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(1046.5, now + 0.08); // C6
    chimeGain.gain.setValueAtTime(0.18, now + 0.08);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    chime.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chime.start(now + 0.08);
    chime.stop(now + 0.35);
  }

  public playMoney() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.09); // E6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1975.53, now); // B6
    osc2.frequency.setValueAtTime(2637.02, now + 0.09); // E7

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  public playSiren() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Weewoo pitch bend
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.25);
    osc.frequency.linearRampToValueAtTime(650, now + 0.5);
    osc.frequency.linearRampToValueAtTime(950, now + 0.75);
    osc.frequency.linearRampToValueAtTime(650, now + 1.0);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.05);
  }

  public playFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Cheerful arisan celebration chords
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
      }, idx * 110);
    });
  }

  public playGavel() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playBoing() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(540, now + 0.15);
    osc.frequency.linearRampToValueAtTime(320, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  // Efek Suara Api Menderu (Roaring Fire / Whoosh & Deep Rumble)
  public playRoaringFire() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 1.6;

    try {
      // 1. Noise buffer for fiery turbulent wind
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // Filter: Resonant lowpass/bandpass sweeping like an expanding fireball
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.linearRampToValueAtTime(720, now + 0.35);
      filter.frequency.exponentialRampToValueAtTime(180, now + duration);
      filter.Q.setValueAtTime(4.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.38, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + duration);

      // 2. Low-frequency combustion rumble
      const rumbleOsc = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      rumbleOsc.type = 'sawtooth';
      rumbleOsc.frequency.setValueAtTime(55, now);
      rumbleOsc.frequency.linearRampToValueAtTime(85, now + 0.3);
      rumbleOsc.frequency.exponentialRampToValueAtTime(35, now + duration);

      rumbleGain.gain.setValueAtTime(0.01, now);
      rumbleGain.gain.linearRampToValueAtTime(0.25, now + 0.2);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(this.ctx.destination);

      rumbleOsc.start(now);
      rumbleOsc.stop(now + duration);
    } catch {
      // AudioContext fallback
    }
  }

  // Efek Suara Kertas Terbakar (Crisp crackle, popping embers, and paper fiber sizzle)
  public playBurningPaper() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const crackleCount = 22;

    // Series of micro-crackles and crisp ember pops
    for (let i = 0; i < crackleCount; i++) {
      const delay = Math.random() * 1.5;
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const clickTime = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // High frequency micro snap (1200Hz - 4200Hz)
        osc.type = Math.random() > 0.4 ? 'square' : 'triangle';
        const startFreq = 1400 + Math.random() * 2600;
        osc.frequency.setValueAtTime(startFreq, clickTime);
        osc.frequency.exponentialRampToValueAtTime(300, clickTime + 0.04);

        const popVolume = 0.08 + Math.random() * 0.16;
        gain.gain.setValueAtTime(popVolume, clickTime);
        gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.035);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(clickTime);
        osc.stop(clickTime + 0.04);
      }, delay * 1000);
    }

    // High sizzle layer (air/fiber burning)
    try {
      const sizzleBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 1.4), this.ctx.sampleRate);
      const sData = sizzleBuffer.getChannelData(0);
      for (let i = 0; i < sData.length; i++) {
        sData[i] = (Math.random() * 2 - 1) * 0.4;
      }
      const sSource = this.ctx.createBufferSource();
      sSource.buffer = sizzleBuffer;

      const sFilter = this.ctx.createBiquadFilter();
      sFilter.type = 'highpass';
      sFilter.frequency.setValueAtTime(2500, now);

      const sGain = this.ctx.createGain();
      sGain.gain.setValueAtTime(0.01, now);
      sGain.gain.linearRampToValueAtTime(0.12, now + 0.2);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      sSource.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(this.ctx.destination);

      sSource.start(now);
      sSource.stop(now + 1.4);
    } catch {
      // Fallback
    }
  }

  public playBurn() {
    this.playRoaringFire();
    this.playBurningPaper();
  }

  // Efek Suara Kartu Ditarik (Card Draw slide & friction)
  public playCardDraw() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // White noise buffer for card friction
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.15);
      filter.Q.setValueAtTime(2.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.18);
    } catch {
      // AudioContext fallback
    }
  }

  // Efek Suara Kartu Berputar & Reveal (3D Card Spin & Shimmer Chime)
  public playCardSpin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Modulated whoosh for the spinning motion
      const whooshOsc = this.ctx.createOscillator();
      const whooshGain = this.ctx.createGain();
      whooshOsc.type = 'sine';
      whooshOsc.frequency.setValueAtTime(280, now);
      whooshOsc.frequency.exponentialRampToValueAtTime(680, now + 0.14);
      whooshOsc.frequency.exponentialRampToValueAtTime(340, now + 0.32);

      whooshGain.gain.setValueAtTime(0.02, now);
      whooshGain.gain.linearRampToValueAtTime(0.18, now + 0.12);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

      whooshOsc.connect(whooshGain);
      whooshGain.connect(this.ctx.destination);

      whooshOsc.start(now);
      whooshOsc.stop(now + 0.34);

      // 2. High sparkle chime when the card settles
      const chimes = [1318.51, 1661.22, 1975.53, 2637.02]; // E6, G#6, B6, E7
      chimes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx || this.isMuted) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.28);
        }, 160 + idx * 45);
      });
    } catch {
      // AudioContext fallback
    }
  }

  public playCrash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Heavy falling whoosh then impact thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // --- Background Music Loop (Cheery Koplo / Dangdut Chiptune) ---

  public startBGM() {
    if (this.isMuted || this.isBgmPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.bgmStep = 0;

    // Pentatonic Indonesian playful melody notes
    // C major pentatonic / slendro-pelog inspired playful sequence:
    // C4(261.63), D4(293.66), E4(329.63), G4(392.00), A4(440.00), C5(523.25)
    const melody = [
      523.25, 0, 440, 392, 440, 523.25, 0, 659.25,
      523.25, 440, 392, 0, 440, 392, 329.63, 0,
      392, 440, 523.25, 0, 659.25, 523.25, 440, 0,
      523.25, 392, 440, 329.63, 261.63, 329.63, 392, 0
    ];

    const bass = [
      130.81, 0, 130.81, 164.81, 196.00, 0, 196.00, 130.81,
      130.81, 0, 130.81, 164.81, 196.00, 0, 196.00, 130.81,
      130.81, 0, 130.81, 164.81, 196.00, 0, 196.00, 130.81,
      130.81, 0, 130.81, 164.81, 196.00, 0, 196.00, 130.81
    ];

    const tick = () => {
      if (!this.isBgmPlaying || !this.ctx || this.isMuted) return;

      const now = this.ctx.currentTime;
      const melNote = melody[this.bgmStep % melody.length];
      const bassNote = bass[this.bgmStep % bass.length];

      // Play melody
      if (melNote > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(melNote, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      }

      // Play bouncy bass
      if (bassNote > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(bassNote, now);
        bGain.gain.setValueAtTime(0.06, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        bOsc.connect(bGain);
        bGain.connect(this.ctx.destination);
        bOsc.start(now);
        bOsc.stop(now + 0.18);
      }

      // Play soft comic kendang / rimshot on 2nd and 4th beats
      if (this.bgmStep % 4 === 2) {
        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.02, now);
        nGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.05);

        whiteNoise.connect(nGain);
        nGain.connect(this.ctx.destination);
        whiteNoise.start(now);
      }

      this.bgmStep++;
      this.bgmTimer = window.setTimeout(tick, 185); // Upbeat ~160 BPM
    };

    tick();
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer !== null) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const soundManager = new SoundManager();
