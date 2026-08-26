/**
 * Web Audio API Dual-Frequency Emergency Siren Synthesizer
 * Produces distinct high-urgency multi-tone pulses (880Hz / 1760Hz)
 * designed to pierce through background noise on emergency alert.
 */

class EmergencySirenSynthesizer {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.65;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public playAlarm(durationSeconds: number = 6) {
    try {
      this.initContext();
      if (!this.ctx) return;

      if (this.isPlaying) {
        this.stopAlarm();
      }

      this.isPlaying = true;
      const now = this.ctx.currentTime;

      // Master gain
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.01, now);
      this.gainNode.gain.exponentialRampToValueAtTime(this.volume, now + 0.1);
      this.gainNode.connect(this.ctx.destination);

      // Primary Siren Oscillator (High pitch 960Hz modulated)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sawtooth";
      this.osc1.frequency.setValueAtTime(880, now);

      // Secondary Harmonizing Oscillator (1760Hz for acute acoustic penetration)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "sine";
      this.osc2.frequency.setValueAtTime(1760, now);

      // LFO for sweeping frequency modulation (3.5Hz rapid wail)
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = "triangle";
      this.lfo.frequency.setValueAtTime(3.5, now);

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(350, now); // frequency deviation +- 350Hz

      this.lfo.connect(lfoGain);
      lfoGain.connect(this.osc1.frequency);

      // Connect oscillators to master gain
      this.osc1.connect(this.gainNode);
      this.osc2.connect(this.gainNode);

      this.lfo.start(now);
      this.osc1.start(now);
      this.osc2.start(now);

      // Auto-stop after specified duration
      if (durationSeconds > 0) {
        setTimeout(() => {
          if (this.isPlaying) {
            this.stopAlarm();
          }
        }, durationSeconds * 1000);
      }
    } catch (err) {
      console.warn("Audio Context playback prevented by browser policy:", err);
    }
  }

  public stopAlarm() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.gainNode) {
        this.gainNode.gain.linearRampToValueAtTime(0.001, now + 0.1);
      }
      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.lfo?.stop();
          this.osc1?.disconnect();
          this.osc2?.disconnect();
          this.lfo?.disconnect();
          this.gainNode?.disconnect();
        } catch (_) {}
        this.isPlaying = false;
        this.osc1 = null;
        this.osc2 = null;
        this.lfo = null;
        this.gainNode = null;
      }, 120);
    } catch (_) {
      this.isPlaying = false;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const sirenSynthesizer = new EmergencySirenSynthesizer();
