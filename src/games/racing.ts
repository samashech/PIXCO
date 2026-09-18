import { racingRules } from "./difficulty";
import { BaseGame } from "./engine/base";
import type { GameFrame, Input, Pixel } from "./engine/types";
import { car, sprite } from "./engine/sprites";
export class Racing extends BaseGame {
  lane = 1;
  enemies: { lane: number; y: number }[] = [];
  private road = 0;
  private distance = 0;
  init() {
    this.lane = 1;
    this.enemies = [
      { lane: 0, y: 2 },
      { lane: 2, y: 9 },
    ];
    this.road = 0;
    this.distance = 0;
  }
  step(dt: number) {
    const rules = racingRules[this.difficulty];
    const speed = rules.speed + this.state.level * rules.acceleration;
    this.road = (this.road + dt * speed) % 5;
    this.tick += dt;
    this.distance += dt * speed;
    for (const e of this.enemies) e.y += dt * speed;
    if (
      this.tick >
      Math.max(
        rules.minSpawn,
        rules.spawn - this.state.level * rules.spawnProgress,
      )
    ) {
      this.tick = 0;
      this.enemies.push({ lane: Math.floor(Math.random() * 3), y: -4 });
    }
    if (
      this.enemies.some(
        (e) => e.lane === this.lane && e.y + 3 >= 19 && e.y <= 22,
      )
    ) {
      this.over();
      return;
    }
    this.enemies = this.enemies.filter((e) => {
      if (e.y > 24) {
        this.score(50);
        return false;
      }
      return true;
    });
    this.state.level = 1 + Math.floor(this.state.score / rules.scorePerLevel);
  }
  input(input: Input) {
    if (input === "left") this.lane = Math.max(0, this.lane - 1);
    if (input === "right") this.lane = Math.min(2, this.lane + 1);
  }
  render(): GameFrame {
    const pixels: Pixel[] = [];
    for (let y = 0; y < 24; y++)
      if ((y + Math.floor(this.road)) % 5 < 3) {
        pixels.push({ x: 0, y }, { x: 14, y });
      }
    for (const e of this.enemies)
      pixels.push(...sprite(car, 2 + e.lane * 4, Math.floor(e.y)));
    pixels.push(...sprite(car, 2 + this.lane * 4, 19));
    return {
      width: 15,
      height: 24,
      pixels: pixels.filter((p) => p.y >= 0 && p.y < 24),
    };
  }
}
