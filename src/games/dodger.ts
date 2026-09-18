import { dodgerRules } from "./difficulty";
import { BaseGame } from "./engine/base";
import type { GameFrame, Input, Pixel } from "./engine/types";
export class Dodger extends BaseGame {
  x = 7;
  objects: Pixel[] = [];
  private seconds = 0;
  init() {
    this.x = 7;
    this.objects = [
      { x: 2, y: 2 },
      { x: 11, y: 8 },
      { x: 6, y: 5 },
    ];
    this.seconds = 0;
  }
  step(dt: number) {
    const rules = dodgerRules[this.difficulty];
    this.tick += dt;
    this.seconds += dt;
    for (const p of this.objects)
      p.y += dt * (rules.speed + this.state.level * 0.7);
    if (
      this.tick >
      Math.max(rules.minSpawn, rules.spawn - this.state.level * 0.03)
    ) {
      this.tick = 0;
      this.objects.push({ x: Math.floor(Math.random() * 14), y: -2 });
    }
    if (
      this.objects.some(
        (p) =>
          p.y + 1 >= 21 && p.y <= 23 && p.x + 1 >= this.x && p.x <= this.x + 1,
      )
    ) {
      this.over();
      return;
    }
    this.objects = this.objects.filter((p) => {
      if (p.y > 24) {
        this.score(20);
        return false;
      }
      return true;
    });
    this.state.level = 1 + Math.floor(this.seconds / rules.levelSeconds);
  }
  input(input: Input) {
    if (input === "left") this.x = Math.max(0, this.x - 1);
    if (input === "right") this.x = Math.min(14, this.x + 1);
    if (input === "a") this.x = Math.max(0, this.x - 3);
    if (input === "b") this.x = Math.min(14, this.x + 3);
  }
  render(): GameFrame {
    return {
      width: 16,
      height: 24,
      pixels: [
        { x: this.x, y: 21 },
        { x: this.x + 1, y: 21 },
        { x: this.x, y: 22 },
        { x: this.x + 1, y: 22 },
        ...this.objects
          .flatMap((p) => [
            { x: p.x, y: Math.floor(p.y) },
            { x: p.x + 1, y: Math.floor(p.y) },
            { x: p.x, y: Math.floor(p.y) + 1 },
            { x: p.x + 1, y: Math.floor(p.y) + 1 },
          ])
          .filter((p) => p.y >= 0 && p.y < 24),
      ],
    };
  }
}
