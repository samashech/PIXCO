import { BaseGame } from "./engine/base";
import type { GameFrame, Input, Pixel } from "./engine/types";
export class Maze extends BaseGame {
  maze: number[][] = [];
  player: Pixel = { x: 1, y: 1 };
  goal: Pixel = { x: 13, y: 23 };
  private steps = 0;
  init() {
    this.player = { x: 1, y: 1 };
    this.steps = 0;
    this.generate();
  }
  private generate() {
    this.maze = Array.from({ length: 25 }, () => Array(15).fill(1));
    const stack = [{ x: 1, y: 1 }];
    this.maze[1][1] = 0;
    while (stack.length) {
      const p = stack[stack.length - 1];
      const options = [
        { x: 2, y: 0 },
        { x: -2, y: 0 },
        { x: 0, y: 2 },
        { x: 0, y: -2 },
      ]
        .map((d) => ({ x: p.x + d.x, y: p.y + d.y }))
        .filter(
          (n) =>
            n.x > 0 && n.x < 14 && n.y > 0 && n.y < 24 && this.maze[n.y][n.x],
        );
      if (options.length) {
        const n = options[Math.floor(Math.random() * options.length)];
        this.maze[(p.y + n.y) / 2][(p.x + n.x) / 2] = 0;
        this.maze[n.y][n.x] = 0;
        stack.push(n);
      } else stack.pop();
    }
  }
  step(dt: number) {
    this.tick += dt;
  }
  input(input: Input) {
    const d: Partial<Record<Input, Pixel>> = {
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
    };
    if (!d[input]) return;
    const p = {
      x: this.player.x + d[input]!.x,
      y: this.player.y + d[input]!.y,
    };
    if (!this.maze[p.y]?.[p.x]) {
      this.player = p;
      this.steps++;
      this.sound("click");
      if (p.x === this.goal.x && p.y === this.goal.y) {
        this.score(Math.max(100, 1000 - this.steps * 2));
        this.state.level++;
        this.sound("level");
        this.init();
      }
    }
  }
  render(): GameFrame {
    const pixels: Pixel[] = [];
    this.maze.forEach((row, y) =>
      row.forEach((v, x) => {
        if (v) pixels.push({ x, y, shade: 0.55 });
      }),
    );
    pixels.push(this.player);
    pixels.push({
      ...this.goal,
      shade: Math.floor(this.tick * 3) % 2 ? 0.2 : 1,
    });
    return { width: 15, height: 25, pixels };
  }
}
