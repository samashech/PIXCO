import type { Sound } from "../games/engine/types";
class Synth {
  private context: AudioContext | null = null;
  master = 0.35;
  sfx = 0.7;
  muted = false;
  play(name: Sound) {
    if (this.muted || this.master === 0 || this.sfx === 0) return;
    try {
      this.context ??= new AudioContext();
      const context = this.context;
      if (context.state === "suspended") void context.resume().catch(() => {});
      const notes: Record<Sound, number[]> = {
        click: [220],
        start: [440, 660, 880],
        score: [660, 880],
        lose: [330, 220, 110],
        level: [440, 550, 660, 880],
      };
      notes[name].forEach((frequency, index) => {
        const oscillator = context.createOscillator(),
          gain = context.createGain(),
          t = context.currentTime + index * 0.065;
        oscillator.type = "square";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(this.master * this.sfx * 0.055, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(t);
        oscillator.stop(t + 0.07);
      });
    } catch {
      /* Sound is optional on browsers without Web Audio. */
    }
  }
}
export const synth = new Synth();
