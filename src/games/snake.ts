import { snakeRules } from "./difficulty";
import { BaseGame } from "./engine/base";
import type { GameFrame, Input, Pixel } from "./engine/types";
export class Snake extends BaseGame {
  body: Pixel[] = [];
  food: Pixel = { x: 3, y: 3 };
  direction: Pixel = { x: 1, y: 0 };
  private turns: Pixel[] = [];
  init() {
    this.body = [
      { x: 6, y: 10 },
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 },
    ];
    this.direction = { x: 1, y: 0 };
    this.turns = [];
    this.food = { x: 9, y: 6 };
  }
  private feed() {
    const free: Pixel[] = [];
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 12; x++)
        if (!this.body.some((p) => p.x === x && p.y === y)) free.push({ x, y });
    if (!free.length) {
      this.score(1000);
      this.over();
      return;
    }
    this.food = free[Math.floor(Math.random() * free.length)];
  }
  step(dt: number) {
    this.tick += dt;
    const rules = snakeRules[this.difficulty];
    const interval = Math.max(
      rules.minInterval,
      rules.interval - this.state.level * rules.acceleration,
    );
    if (this.tick < interval) return;
    this.tick -= interval;
    this.direction = this.turns.shift() ?? this.direction;
    const head = {
      x: this.body[0].x + this.direction.x,
      y: this.body[0].y + this.direction.y,
    };
    const eat = head.x === this.food.x && head.y === this.food.y;
    const tail = eat ? this.body : this.body.slice(0, -1);
    if (
      head.x < 0 ||
      head.x >= 12 ||
      head.y < 0 ||
      head.y >= 20 ||
      tail.some((p) => p.x === head.x && p.y === head.y)
    ) {
      this.over();
      return;
    }
    this.body.unshift(head);
    if (eat) {
      this.score(100);
      this.state.level =
        1 +
        Math.floor(
          (this.body.length - 4) / snakeRules[this.difficulty].foodPerLevel,
        );
      this.feed();
    } else this.body.pop();
  }
  input(input: Input) {
    const directions: Partial<Record<Input, Pixel>> = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    const d = directions[input];
    const last = this.turns.at(-1) ?? this.direction;
    if (
      d &&
      this.turns.length < 2 &&
      (d.x !== last.x || d.y !== last.y) &&
      (d.x !== -last.x || d.y !== -last.y)
    )
      this.turns.push(d);
  }
  render(): GameFrame {
    return {
      width: 12,
      height: 20,
      pixels: [...this.body, { ...this.food, shade: 0.55 }],
    };
  }
}
