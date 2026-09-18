import { memoryRules } from "./difficulty";
import { BaseGame } from "./engine/base";
import type { GameFrame, Input, Pixel } from "./engine/types";
export class Memory extends BaseGame {
  sequence: number[] = [];
  index = 0;
  showing = true;
  private flash = -1;
  private flashTime = 0;
  private responseTime = 0;
  get rules() {
    return memoryRules[this.difficulty];
  }
  init() {
    this.state.lives = this.rules.lives;
    this.sequence = Array.from({ length: this.rules.initialLength }, () =>
      Math.floor(Math.random() * 4),
    );
    this.responseTime = 0;
    this.flashTime = 0;
    this.index = 0;
    this.showing = true;
    this.flash = -1;
    this.tick = 0;
  }
  step(dt: number) {
    this.tick += dt;
    if (this.flashTime > 0) {
      this.flashTime -= dt;
      if (this.flashTime <= 0) this.flash = -1;
    }
    if (!this.showing && this.rules.responseLimit) {
      this.responseTime += dt;
      if (this.responseTime >= this.rules.responseLimit) {
        this.mistake();
        return;
      }
    }
    if (this.showing) {
      const period = this.rules.flash + this.rules.gap;
      const index = Math.floor(this.tick / period);
      if (index >= this.sequence.length) {
        this.showing = false;
        this.flash = -1;
        this.index = 0;
        this.responseTime = 0;
        this.tick = 0;
      } else
        this.flash =
          this.tick >= 0 && this.tick % period < this.rules.flash
            ? this.sequence[index]
            : -1;
    }
  }
  input(input: Input) {
    if (this.showing) return;
    const mapped: Partial<Record<Input, number>> = {
      up: 0,
      right: 1,
      down: 2,
      left: 3,
    };
    const key = mapped[input];
    if (key === undefined) return;
    this.flash = key;
    this.flashTime = 0.25;
    this.sound("click");
    if (key !== this.sequence[this.index]) {
      this.mistake();
      return;
    }
    this.responseTime = 0;
    this.index++;
    if (this.index === this.sequence.length) {
      this.score(this.sequence.length * 100);
      this.state.level++;
      this.sequence.push(Math.floor(Math.random() * 4));
      this.index = 0;
      this.showing = true;
      this.tick = -0.7;
    }
  }
  private mistake() {
    this.state.lives--;
    this.sound("lose");
    this.responseTime = 0;
    if (this.state.lives === 0) this.over();
    else {
      this.index = 0;
      this.showing = true;
      this.tick = -0.6;
    }
  }
  render(): GameFrame {
    const positions = [
        { x: 5, y: 3 },
        { x: 9, y: 8 },
        { x: 5, y: 13 },
        { x: 1, y: 8 },
      ],
      pixels: Pixel[] = [];
    positions.forEach((p, i) => {
      for (let dy = 0; dy < 4; dy++)
        for (let dx = 0; dx < 4; dx++)
          if (this.flash === i || dx === 0 || dy === 0 || dx === 3 || dy === 3)
            pixels.push({
              x: p.x + dx,
              y: p.y + dy,
              shade: this.flash === i ? 1 : 0.25,
            });
    });
    for (let i = 0; i < Math.min(12, this.sequence.length); i++)
      pixels.push({ x: i + 1, y: 20, shade: i < this.index ? 1 : 0.2 });
    return {
      width: 14,
      height: 23,
      pixels,
      label: this.showing
        ? "WATCH"
        : this.rules.responseLimit
          ? `REPEAT ${Math.ceil(this.rules.responseLimit - this.responseTime)}s`
          : "REPEAT",
    };
  }
}
