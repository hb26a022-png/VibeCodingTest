// Retro 8-bit Sound Generator using Web Audio API

class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;
  private currentBgmOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private bgmTimeoutId: any = null;
  private isBgmPlaying: boolean = false;

  constructor() {
    // Lazy initialize to bypass browser autoplay policies
  }

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Set mute state
  public setMute(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopBGM();
    } else {
      if (this.isBgmPlaying) {
        this.startBGM();
      }
    }
  }

  // Play a simple retro tone
  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = "square",
    volume: number = 0.1,
    glide: boolean = true
  ) {
    this.init();
    if (this.muted || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
      
      if (glide && freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio play error", e);
    }
  }

  // Jump sound: Sweeps up quickly
  public playJump() {
    this.playTone(150, 600, 0.16, "square", 0.08, true);
  }

  // Coin / Bug collect: High-pitched double beep (ping!)
  public playBugCollect() {
    this.init();
    if (this.muted || !this.ctx) return;

    const now = this.ctx.currentTime;
    this.playTone(987.77, 987.77, 0.08, "sine", 0.1, false);
    
    // Schedule second higher tone
    setTimeout(() => {
      this.playTone(1318.51, 1318.51, 0.2, "sine", 0.1, false);
    }, 80);
  }

  // Enemy squash: Cute tiny squeak, dropping frequency
  public playStomp() {
    this.playTone(200, 50, 0.1, "triangle", 0.25, true);
  }

  // Block bump: Quick low "pop"
  public playBump() {
    this.playTone(120, 80, 0.1, "triangle", 0.3, true);
  }

  // Block shatter: Noise-like short crackle
  public playBreak() {
    this.playTone(80, 10, 0.15, "sawtooth", 0.2, true);
  }

  // Bubble shoot: Wet synth pop
  public playShoot() {
    this.playTone(400, 800, 0.08, "triangle", 0.12, true);
  }

  // Power Up chime: Arpeggio rising (C4 -> E4 -> G4 -> C5)
  public playPowerUp() {
    this.init();
    if (this.muted || !this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, freq, 0.12, "square", 0.08, false);
      }, index * 80);
    });
  }

  // Power Down chime: Rapid falling tones
  public playPowerDown() {
    this.init();
    if (this.muted || !this.ctx) return;

    const notes = [1046.50, 783.99, 659.25, 523.25];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, freq, 0.12, "sawtooth", 0.08, false);
      }, index * 80);
    });
  }

  // Player gets hurt
  public playHurt() {
    this.playTone(180, 40, 0.25, "sawtooth", 0.2, true);
  }

  // Game over ditty
  public playGameOver() {
    this.init();
    this.stopBGM();
    if (this.muted || !this.ctx) return;

    const notes = [392, 349.23, 311.13, 261.63]; // G4, F4, D#4, C4
    const durations = [0.25, 0.25, 0.25, 0.6];
    let totalDelay = 0;

    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, freq - 10, durations[index], "sawtooth", 0.12, true);
      }, totalDelay);
      totalDelay += durations[index] * 1000;
    });
  }

  // Stage clear fanfar
  public playClear() {
    this.init();
    this.stopBGM();
    if (this.muted || !this.ctx) return;

    // C4 - E4 - G4 - C5 - E5 - G5 - C6 (Joyful rising chord)
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, freq, index === notes.length - 1 ? 0.8 : 0.12, "sine", 0.08, false);
      }, index * 90);
    });
  }

  // 8-bit Background Music Loop (Simple happy loop)
  public startBGM() {
    this.isBgmPlaying = true;
    if (this.muted) return;
    this.init();

    if (!this.ctx) return;
    this.stopBGM();

    // Simple melody loop
    // [Note freq, duration index]
    const notes = [
      // Phrase 1 (Froggy jumpy melody)
      261.63, 329.63, 392.00, 329.63, 440.00, 392.00, 329.63, 0,
      349.23, 440.00, 523.25, 440.00, 493.88, 392.00, 329.63, 0,
      // Phrase 2
      392.00, 392.00, 440.00, 392.00, 349.23, 329.63, 293.66, 0,
      293.66, 329.63, 349.23, 293.66, 329.63, 392.00, 523.25, 0
    ];

    const step = 0.2; // 200ms per note
    let currentStep = 0;

    const playNextBgmNote = () => {
      this.init();
      if (this.muted || !this.ctx || !this.isBgmPlaying) return;

      const f = notes[currentStep];
      if (f > 0) {
        // Play very quiet subtle square/triangle backing
        this.playTone(f, f, step * 0.9, "triangle", 0.03, false);
        
        // Add a simple bass line octave lower sometimes
        if (currentStep % 4 === 0) {
          this.playTone(f / 2, f / 2, step * 1.5, "triangle", 0.04, false);
        }
      }

      currentStep = (currentStep + 1) % notes.length;
      this.bgmTimeoutId = setTimeout(playNextBgmNote, step * 1000);
    };

    playNextBgmNote();
  }

  public stopBGM() {
    if (this.bgmTimeoutId) {
      clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }
    this.currentBgmOscillators.forEach(({ osc }) => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.currentBgmOscillators = [];
  }
}

export const sound = new SoundEngine();
