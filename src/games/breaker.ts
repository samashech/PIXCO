import { BaseGame } from "./engine/base";
import type { GameFrame, Input, Pixel } from "./engine/types";
export class BrickBreaker extends BaseGame {
  paddle = 6;
  ball = { x: 8, y: 19 };
  velocity = { x: 3.7, y: -7 };
  bricks: Pixel[] = [];
  private shifts = 0;
  constructor(
    sound?: ConstructorParameters<typeof BaseGame>[0],
    private moving = false,
  ) {
    super(sound);
  }
  init() {
    this.paddle = 6;
    this.ball = { x: 8, y: 19 };
    this.velocity = { x: 3.7, y: -7 };
    this.shifts = 0;
    this.fill();
  }
  private fill() {
    this.bricks = [];
    for (let y = 2; y < 7; y++)
      for (let x = 1; x < 15; x++)
        if (!this.moving || (x + y) % 4 !== 0) this.bricks.push({ x, y });
  }
  private resetBall() {
    this.ball = { x: this.paddle + 1.5, y: 20 };
    this.velocity = { x: 3.7, y: -(7 + this.state.level) };
  }
  step(dt: number) {
    this.tick += dt;
    this.shifts += dt;
    const old = { ...this.ball };
    this.ball.x += this.velocity.x * dt;
    this.ball.y += this.velocity.y * dt;
    if (this.ball.x < 0 || this.ball.x > 15) {
      this.ball.x = Math.max(0, Math.min(15, this.ball.x));
      this.velocity.x *= -1;
    }
    if (this.ball.y < 0) {
      this.ball.y = 0;
      this.velocity.y = Math.abs(this.velocity.y);
    }
    if (
      this.velocity.y > 0 &&
      old.y < 22 &&
      this.ball.y >= 22 &&
      this.ball.x >= this.paddle - 0.6 &&
      this.ball.x <= this.paddle + 3.6
    ) {
      this.ball.y = 21.9;
      this.velocity.y = -Math.abs(this.velocity.y);
      this.velocity.x = (this.ball.x - (this.paddle + 1.5)) * 3.6;
      if (Math.abs(this.velocity.x) < 1) this.velocity.x = 1;
      this.sound("click");
    }
    if (this.ball.y > 24) {
      this.state.lives--;
      this.sound("lose");
      if (this.state.lives === 0) this.over();
      else this.resetBall();
      return;
    }
    const hit = this.bricks.findIndex(
      (b) =>
        Math.abs(b.x - this.ball.x) < 0.8 && Math.abs(b.y - this.ball.y) < 0.8,
    );
    if (hit >= 0) {
      const brick = this.bricks[hit];
      this.bricks.splice(hit, 1);
      if (Math.floor(old.y) !== brick.y) this.velocity.y *= -1;
      else this.velocity.x *= -1;
      this.score(this.moving ? 20 : 10);
    }
    if (!this.bricks.length) {
      this.state.level++;
      this.sound("level");
      this.fill();
      this.resetBall();
    }
    if (this.moving && this.shifts > 3) {
      this.shifts = 0;
      this.bricks = this.bricks.map((b) => ({ ...b, x: (b.x + 1) % 16 }));
    }
  }
  input(input: Input) {
    if (input === "left") this.paddle = Math.max(0, this.paddle - 1);
    if (input === "right") this.paddle = Math.min(12, this.paddle + 1);
    if (input === "a") this.paddle = Math.max(0, this.paddle - 2);
    if (input === "b") this.paddle = Math.min(12, this.paddle + 2);
  }
  render(): GameFrame {
    return {
      width: 16,
      height: 24,
      pixels: [
        ...this.bricks,
        ...Array.from({ length: 4 }, (_, i) => ({ x: this.paddle + i, y: 22 })),
        { x: Math.round(this.ball.x), y: Math.round(this.ball.y) },
      ],
    };
  }
}
