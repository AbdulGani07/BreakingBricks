import { AudioSettings } from '../types';

const STORAGE_KEY = 'breaking_bricks_audio_settings';

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.85,
  musicVolume: 0.45,
  isMuted: false,
  musicEnabled: true,
};

type AudioSettingsListener = (settings: AudioSettings) => void;

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private settings: AudioSettings = { ...DEFAULT_SETTINGS };
  private listeners: Set<AudioSettingsListener> = new Set();

  // Noise buffers for explosions, hi-hats, and crunch impacts
  private whiteNoiseBuffer: AudioBuffer | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;

  // Background synth music engine
  private isMusicPlaying: boolean = false;
  private musicSchedulerTimer: number | null = null;
  private current16thNote: number = 0;
  private nextNoteTime: number = 0;
  private readonly tempoBpm: number = 126;
  private readonly lookaheadMs: number = 25;
  private readonly scheduleAheadTimeSec: number = 0.12;

  constructor() {
    this.loadSettings();
  }

  // Lazy initialize AudioContext & Nodes on first user action
  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;

      try {
        this.ctx = new AudioContextClass();

        // 1. Master Output Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(
          this.settings.isMuted ? 0 : this.settings.masterVolume,
          this.ctx.currentTime
        );
        this.masterGain.connect(this.ctx.destination);

        // 2. SFX Bus
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // 3. Music Bus
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(
          this.settings.musicEnabled ? this.settings.musicVolume : 0,
          this.ctx.currentTime
        );
        this.musicGain.connect(this.masterGain);

        // 4. Generate reusable noise buffers
        this.generateNoiseBuffers(this.ctx);
      } catch {
        return null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  private generateNoiseBuffers(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate; // 1 second buffer
    this.whiteNoiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    this.pinkNoiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);

    const whiteData = this.whiteNoiseBuffer.getChannelData(0);
    const pinkData = this.pinkNoiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      whiteData[i] = white;

      // Paul Kellet's filtered pink noise generator
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }

  // Settings & Volumes
  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public subscribe(listener: AudioSettingsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.getSettings()));
  }

  private loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage errors
    }
    this.notify();
  }

  public setMasterVolume(vol: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      const effective = this.settings.isMuted ? 0 : this.settings.masterVolume;
      this.masterGain.gain.setValueAtTime(effective, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public setSfxVolume(vol: number) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public setMusicVolume(vol: number) {
    this.settings.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      const effective = this.settings.musicEnabled ? this.settings.musicVolume : 0;
      this.musicGain.gain.setValueAtTime(effective, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public setMuted(muted: boolean) {
    this.settings.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const targetGain = muted ? 0 : this.settings.masterVolume;
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.settings.isMuted);
    return this.settings.isMuted;
  }

  public setMusicEnabled(enabled: boolean) {
    this.settings.musicEnabled = enabled;
    if (this.musicGain && this.ctx) {
      const targetGain = enabled ? this.settings.musicVolume : 0;
      this.musicGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    if (enabled && !this.isMusicPlaying) {
      this.startMusic();
    } else if (!enabled && this.isMusicPlaying) {
      this.stopMusic();
    }
    this.saveSettings();
  }

  public getMuted(): boolean {
    return this.settings.isMuted;
  }

  // =========================================================================
  // ARCADE SOUND EFFECTS
  // =========================================================================

  /**
   * 1. PADDLE HIT:
   * Punchy retro bounce with a crisp transient click and resonant body drop.
   * Modulates slightly by hit angle offset.
   */
  public playPaddleHit(offsetRatio: number = 0) {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      const baseFreq = 260 + Math.abs(offsetRatio) * 60;

      // Layer A: Transient Click / Pop (0.02s)
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(750, now);
      clickOsc.frequency.exponentialRampToValueAtTime(220, now + 0.025);
      clickGain.gain.setValueAtTime(0.3, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      clickOsc.connect(clickGain);
      clickGain.connect(this.sfxGain);
      clickOsc.start(now);
      clickOsc.stop(now + 0.03);

      // Layer B: Resonant Thud (0.1s)
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(baseFreq, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(120, now + 0.09);
      bodyGain.gain.setValueAtTime(0.4, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(this.sfxGain);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  /**
   * 2. BRICK HIT (Durability / Armor hit):
   * Solid, metallic impact for bricks that take damage but don't shatter yet.
   */
  public playBrickHit(pitchMultiplier: number = 1) {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      const freq = 620 * Math.max(0.6, Math.min(2.0, pitchMultiplier));

      // Metallic FM ring modulator
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const bandpass = ctx.createBiquadFilter();

      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(freq, now);
      bandpass.Q.setValueAtTime(4.0, now);

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, now);
      osc1.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.07);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.48, now); // Harmonic metallic interval

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      osc1.connect(bandpass);
      osc2.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.08);
      osc2.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  /**
   * 3. BRICK DESTROY:
   * Highly satisfying arcade pop & crackle crunch.
   * Scales musical pitch as combo streak increases.
   */
  public playBrickDestroy(combo: number = 1) {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      // Musical pentatonic scale stepping based on combo
      const pentatonic = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
      const semitones = pentatonic[Math.min(combo - 1, pentatonic.length - 1)] || 0;
      const baseFreq = 440 * Math.pow(2, semitones / 12);

      // Layer A: Crisp square-wave pop
      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'square';
      popOsc.frequency.setValueAtTime(baseFreq * 1.25, now);
      popOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.08);

      popGain.gain.setValueAtTime(0.24, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      popOsc.connect(popGain);
      popGain.connect(this.sfxGain);
      popOsc.start(now);
      popOsc.stop(now + 0.09);

      // Layer B: Glass / Debris Crunch (Pink noise burst)
      if (this.pinkNoiseBuffer) {
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = this.pinkNoiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1800, now);
        noiseFilter.Q.setValueAtTime(2.5, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noiseNode.start(now);
        noiseNode.stop(now + 0.07);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * 4. POWER-UP COLLECT:
   * Shimmering 4-note ascending arcade crystal chime (C5 -> E5 -> G5 -> C6).
   */
  public playPowerUp() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const noteDuration = 0.06;

      notes.forEach((freq, idx) => {
        const startTime = now + idx * noteDuration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.26, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(startTime);
        osc.stop(startTime + 0.13);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * 5. EXPLOSION:
   * Volatile blast with deep sub-bass punch and low-pass swept noise roar.
   */
  public playExplosion() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const now = ctx.currentTime;

      // Layer A: Low-pass noise burst sweep (simulates blast wave)
      if (this.whiteNoiseBuffer) {
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = this.whiteNoiseBuffer;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(1100, now);
        lowpass.frequency.exponentialRampToValueAtTime(60, now + 0.45);
        lowpass.Q.setValueAtTime(3.2, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.45, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

        noiseNode.connect(lowpass);
        lowpass.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noiseNode.start(now);
        noiseNode.stop(now + 0.5);
      }

      // Layer B: Sub-Bass Boom (95Hz -> 28Hz)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(95, now);
      subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.42);

      subGain.gain.setValueAtTime(0.4, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(now);
      subOsc.stop(now + 0.46);
    } catch {
      // Ignore
    }
  }

  /**
   * 6. LEVEL COMPLETION:
   * Triumphant retro arcade victory fanfare with rising arpeggios and major chord finish.
   */
  public playLevelClear() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      // Fanfare sequence: G4, C5, E5, G5, followed by sustained C-Major triad (C5 + E5 + G5 + C6)
      const arpeggio = [392.0, 523.25, 659.25, 783.99];
      const step = 0.085;

      arpeggio.forEach((freq, idx) => {
        const time = now + idx * step;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(time);
        osc.stop(time + 0.13);
      });

      // Final sustained chord
      const chordTime = now + arpeggio.length * step + 0.03;
      const chordNotes = [523.25, 659.25, 783.99, 1046.5];
      chordNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, chordTime);

        // Lowpass to warm up the chord
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, chordTime);

        gain.gain.setValueAtTime(0.18, chordTime);
        gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.55);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(chordTime);
        osc.stop(chordTime + 0.58);
      });
    } catch {
      // Ignore
    }
  }

  // =========================================================================
  // AUXILIARY ARCADE SOUNDS
  // =========================================================================

  public playWallBounce() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(210, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.05);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore
    }
  }

  public playLaserShoot() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(940, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  public playShieldBounce() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Ignore
    }
  }

  public playMagnetAttach() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore
    }
  }

  public playLifeLost() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.38);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.42);
    } catch {
      // Ignore
    }
  }

  public playCountdown(finalBeep: boolean = false) {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const freq = finalBeep ? 880 : 440;
      osc.frequency.setValueAtTime(freq, now);

      const dur = finalBeep ? 0.22 : 0.1;
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + dur + 0.01);
    } catch {
      // Ignore
    }
  }

  public playButtonClick() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.025);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Ignore
    }
  }

  // =========================================================================
  // BACKGROUND SYNTH MUSIC ENGINE (Web Audio Procedural Synthesizer)
  // =========================================================================

  public startMusic() {
    if (!this.settings.musicEnabled || this.isMusicPlaying) return;
    const ctx = this.initContext();
    if (!ctx) return;

    this.isMusicPlaying = true;
    this.current16thNote = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;

    this.scheduleMusicLoop();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicSchedulerTimer !== null) {
      window.clearInterval(this.musicSchedulerTimer);
      this.musicSchedulerTimer = null;
    }
  }

  public pauseMusic() {
    this.stopMusic();
  }

  public resumeMusic() {
    if (this.settings.musicEnabled && !this.isMusicPlaying) {
      this.startMusic();
    }
  }

  public isPlayingMusic(): boolean {
    return this.isMusicPlaying;
  }

  private scheduleMusicLoop() {
    if (this.musicSchedulerTimer !== null) {
      window.clearInterval(this.musicSchedulerTimer);
    }

    this.musicSchedulerTimer = window.setInterval(() => {
      if (!this.ctx || !this.isMusicPlaying) return;

      while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTimeSec) {
        this.schedule16thNote(this.current16thNote, this.nextNoteTime);
        this.advance16thNote();
      }
    }, this.lookaheadMs);
  }

  private advance16thNote() {
    const secondsPerBeat = 60.0 / this.tempoBpm;
    this.nextNoteTime += 0.25 * secondsPerBeat; // 16th note length
    this.current16thNote = (this.current16thNote + 1) % 32; // 32-step (2-measure) loop
  }

  /**
   * Synthesize musical stems on each 16th note tick:
   * - Driving arcade bassline (sawtooth + resonant low-pass envelope)
   * - Arpeggiator lead (triangle + bright envelope)
   * - Electronic kick & hi-hat groove
   */
  private schedule16thNote(noteStep: number, time: number) {
    if (!this.ctx || !this.musicGain || !this.settings.musicEnabled || this.settings.isMuted) return;

    const secondsPer16th = (60.0 / this.tempoBpm) * 0.25;

    // --- STEM 1: SYNTH BASS (Arcade 16th-note driving groove in A-minor / D-minor) ---
    // 32-step sequence:
    // Bar 1 (0-15): A minor (A1, A1, C2, E2, A1, A1, G1, A1...)
    // Bar 2 (16-31): F - G - Am (F1, F1, A1, C2, G1, G1, B1, D2...)
    const bassFrequencies: (number | null)[] = [
      55.0, 55.0, 65.41, 82.41, 55.0, 55.0, 49.0, 55.0, // Steps 0-7 (Am groove)
      55.0, 55.0, 65.41, 82.41, 73.42, 65.41, 49.0, 55.0, // Steps 8-15
      43.65, 43.65, 55.0, 65.41, 43.65, 43.65, 55.0, 65.41, // Steps 16-23 (F major)
      49.0, 49.0, 61.74, 73.42, 49.0, 61.74, 55.0, null,   // Steps 24-31 (G major -> turnaround)
    ];

    const bassFreq = bassFrequencies[noteStep];
    if (bassFreq !== null && bassFreq !== undefined) {
      try {
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, time);

        // Resonant Moog-style lowpass envelope
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(580, time);
        bassFilter.frequency.exponentialRampToValueAtTime(140, time + secondsPer16th * 0.9);
        bassFilter.Q.setValueAtTime(3.5, time);

        bassGain.gain.setValueAtTime(0.24, time);
        bassGain.gain.exponentialRampToValueAtTime(0.001, time + secondsPer16th * 0.92);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(time);
        bassOsc.stop(time + secondsPer16th);
      } catch {
        // Ignore scheduling errors
      }
    }

    // --- STEM 2: SYNTH ARPEGGIO LEAD (Glittering retro melody on alternating beats) ---
    const arpNotes: (number | null)[] = [
      null, 440.0, null, 523.25, null, 659.25, null, 783.99, // Am Arp
      null, 880.0, null, 783.99, null, 659.25, null, 523.25,
      null, 349.23, null, 440.0, null, 523.25, null, 698.46, // F Arp
      null, 392.0, null, 493.88, null, 587.33, null, 783.99, // G Arp
    ];

    const arpFreq = arpNotes[noteStep];
    if (arpFreq !== null && arpFreq !== undefined) {
      try {
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        arpOsc.type = 'triangle';
        arpOsc.frequency.setValueAtTime(arpFreq, time);

        arpGain.gain.setValueAtTime(0.13, time);
        arpGain.gain.exponentialRampToValueAtTime(0.001, time + secondsPer16th * 0.85);

        arpOsc.connect(arpGain);
        arpGain.connect(this.musicGain);

        arpOsc.start(time);
        arpOsc.stop(time + secondsPer16th * 0.9);
      } catch {
        // Ignore
      }
    }

    // --- STEM 3: RETRO PERCUSSION (Kick on beats 1, 5, 9, 13... Hi-hat on offbeats) ---
    // Electronic Kick
    if (noteStep % 4 === 0) {
      try {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(130, time);
        kickOsc.frequency.exponentialRampToValueAtTime(32, time + 0.08);

        kickGain.gain.setValueAtTime(0.35, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);

        kickOsc.start(time);
        kickOsc.stop(time + 0.1);
      } catch {
        // Ignore
      }
    }

    // Electronic Hi-Hat (Crisp 16th-note ticks on off-beats)
    if (noteStep % 2 === 1 && this.whiteNoiseBuffer) {
      try {
        const hatNode = this.ctx.createBufferSource();
        hatNode.buffer = this.whiteNoiseBuffer;

        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7500, time);

        const hatGain = this.ctx.createGain();
        const isAccent = noteStep % 4 === 2;
        hatGain.gain.setValueAtTime(isAccent ? 0.08 : 0.04, time);
        hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

        hatNode.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.musicGain);

        hatNode.start(time);
        hatNode.stop(time + 0.04);
      } catch {
        // Ignore
      }
    }
  }
}

// Global audio singleton
export const audioSystem = new AudioSystem();
