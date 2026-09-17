import { BaseGame } from "./engine/base";
import type { GameFrame, Input, Pixel } from "./engine/types";
export class Pong extends BaseGame {
  paddle = 6;
  opponent = 6;
  ball = { x: 8, y: 12 };
  velocity = { x: 3.1, y: 7 };
  private aiTick = 0;
  init() {
    this.paddle = 6;
    this.opponent = 6;
    this.ball = { x: 8, y: 12 };
    this.velocity = { x: 3.1, y: 7 };
    this.aiTick = 0;
  }
  step(dt: number) {
    this.tick += dt;
    this.aiTick += dt;
    const oldY = this.ball.y;
    this.ball.x += this.velocity.x * dt;
    this.ball.y += this.velocity.y * dt;
    if (this.aiTick > 0.12) {
      this.aiTick = 0;
      const target = this.ball.x - 1.5;
      if (Math.abs(target - this.opponent) > 1.5)
        this.opponent = Math.max(
          0,
          Math.min(12, this.opponent + Math.sign(target - this.opponent)),
        );
    }
    if (this.ball.x <= 0 || this.ball.x >= 15) {
      this.ball.x = Math.max(0, Math.min(15, this.ball.x));
      this.velocity.x *= -1;
    }
    if (
      this.velocity.y > 0 &&
      oldY < 22 &&
      this.ball.y >= 22 &&
      this.ball.x >= this.paddle - 0.5 &&
      this.ball.x <= this.paddle + 3.5
    ) {
      this.ball.y = 21.9;
      this.velocity.y = -(8 + this.state.level);
      this.velocity.x = (this.ball.x - this.paddle - 1.5) * 4;
      this.sound("click");
    }
    if (
      this.velocity.y < 0 &&
      oldY > 1 &&
      this.ball.y <= 1 &&
      this.ball.x >= this.opponent - 0.5 &&
      this.ball.x <= this.opponent + 3.5
    ) {
      this.ball.y = 1.1;
      this.velocity.y = Math.abs(this.velocity.y);
      this.velocity.x += (Math.random() - 0.5) * 3;
    }
    if (this.ball.y < 0) {
      this.score(100);
      this.state.level = 1 + Math.floor(this.state.score / 300);
      this.ball = { x: 8, y: 12 };
      this.velocity = { x: 3.1, y: 7 + this.state.level };
    }
    if (this.ball.y > 24) {
      this.state.lives--;
      if (!this.state.lives) this.over();
      else {
        this.sound("lose");
        this.ball = { x: 8, y: 12 };
        this.velocity = { x: 3.1, y: 7 };
      }
    }
  }
  input(input: Input) {
    if (input === "left") this.paddle = Math.max(0, this.paddle - 1);
    if (input === "right") this.paddle = Math.min(12, this.paddle + 1);
  }
  render(): GameFrame {
    const pixels: Pixel[] = Array.from({ length: 8 }, (_, i) => ({
      x: i * 2,
      y: 12,
      shade: 0.15,
    }));
    for (let i = 0; i < 4; i++)
      pixels.push(
        { x: this.paddle + i, y: 22 },
        { x: this.opponent + i, y: 1 },
      );
    pixels.push({ x: Math.round(this.ball.x), y: Math.round(this.ball.y) });
    return { width: 16, height: 24, pixels };
  }
}
