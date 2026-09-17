import { BaseGame } from "./engine/base";
import type { GameFrame, Input, Pixel } from "./engine/types";
import { alien, ship, sprite } from "./engine/sprites";
export class SpaceShooter extends BaseGame {
  x = 7;
  enemies: Pixel[] = [];
  bullets: Pixel[] = [];
  enemyBullets: Pixel[] = [];
  private direction = 1;
  private fireTime = 0;
  private cooldown = 0;
  init() {
    this.x = 7;
    this.bullets = [];
    this.enemyBullets = [];
    this.direction = 1;
    this.fireTime = 0;
    this.cooldown = 0;
    this.wave();
  }
  private wave() {
    this.enemies = [];
    for (let y = 1; y < 10; y += 4)
      for (let x = 1; x < 14; x += 5) this.enemies.push({ x, y });
  }
  step(dt: number) {
    this.tick += dt;
    this.fireTime += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.tick > Math.max(0.12, 0.65 - this.state.level * 0.05)) {
      this.tick = 0;
      const edge = this.enemies.some(
        (e) => e.x + this.direction < 0 || e.x + this.direction > 13,
      );
      if (edge) this.direction *= -1;
      for (const e of this.enemies) {
        e.x += this.direction;
        if (edge) e.y++;
      }
    }
    for (const b of this.bullets) b.y -= dt * 22;
    for (const b of this.enemyBullets) b.y += dt * (8 + this.state.level);
    this.bullets = this.bullets.filter((b) => {
      const i = this.enemies.findIndex(
        (e) => b.x >= e.x && b.x <= e.x + 2 && b.y >= e.y && b.y <= e.y + 3,
      );
      if (i >= 0) {
        this.enemies.splice(i, 1);
        this.score(30);
        return false;
      }
      return b.y >= 0;
    });
    this.enemyBullets = this.enemyBullets.filter((b) => {
      if (b.y >= 20 && b.y <= 23 && b.x >= this.x && b.x <= this.x + 2) {
        this.state.lives--;
        this.sound("lose");
        return false;
      }
      return b.y < 24;
    });
    if (
      this.fireTime > Math.max(0.35, 1.2 - this.state.level * 0.06) &&
      this.enemies.length
    ) {
      this.fireTime = 0;
      const e = this.enemies[Math.floor(Math.random() * this.enemies.length)];
      this.enemyBullets.push({ x: e.x + 1, y: e.y + 3 });
    }
    if (this.state.lives <= 0 || this.enemies.some((e) => e.y >= 18)) {
      this.over();
      return;
    }
    if (!this.enemies.length) {
      this.state.level++;
      this.sound("level");
      this.wave();
      this.enemyBullets = [];
    }
  }
  input(input: Input) {
    if (input === "left") this.x = Math.max(0, this.x - 1);
    if (input === "right") this.x = Math.min(13, this.x + 1);
    if ((input === "a" || input === "up") && this.cooldown === 0) {
      this.bullets.push({ x: this.x + 1, y: 19 });
      this.cooldown = 0.15;
      this.sound("click");
    }
  }
  render(): GameFrame {
    return {
      width: 16,
      height: 24,
      pixels: [
        ...sprite(ship, this.x, 20),
        ...this.enemies.flatMap((e) => sprite(alien, e.x, e.y)),
        ...this.bullets.map((b) => ({ x: b.x, y: Math.round(b.y) })),
        ...this.enemyBullets.map((b) => ({
          x: b.x,
          y: Math.round(b.y),
          shade: 0.6,
        })),
      ],
    };
  }
}
