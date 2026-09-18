export const FIXED_STEP = 1 / 60;
/** Limits catch-up after suspension; input repeats and simulation share this clock. */
export class GameClock {
  private accumulator = 0;
  advance(delta: number, step: (dt: number) => void) {
    this.accumulator += Math.max(0, Math.min(delta, 0.1));
    while (this.accumulator + 1e-9 >= FIXED_STEP) {
      step(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
    }
  }
  reset() {
    this.accumulator = 0;
  }
}
