import { blockRules } from "./difficulty";
import { BaseGame } from "./engine/base";
import type { GameFrame, Input, Pixel } from "./engine/types";
export const SHAPES = [
  [[1, 1, 1, 1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
];
export class FallingBlocks extends BaseGame {
  board: number[][] = [];
  piece: number[][] = [];
  next: number[][] = [];
  x = 3;
  y = 0;
  lines = 0;
  private bag: number[] = [];
  init() {
    this.board = Array.from({ length: 20 }, () => Array(10).fill(0));
    this.bag = [];
    this.lines = 0;
    this.next = this.pick();
    this.spawn();
  }
  private pick() {
    if (!this.bag.length) {
      this.bag = [0, 1, 2, 3, 4, 5, 6];
      for (let i = 6; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return SHAPES[this.bag.pop()!].map((row) => [...row]);
  }
  private spawn() {
    this.piece = this.next;
    this.next = this.pick();
    this.x = Math.floor((10 - this.piece[0].length) / 2);
    this.y = 0;
    if (!this.fits(this.piece, this.x, this.y)) this.over();
  }
  fits(shape: number[][], x: number, y: number) {
    return shape.every((row, dy) =>
      row.every(
        (v, dx) =>
          !v ||
          (x + dx >= 0 &&
            x + dx < 10 &&
            y + dy < 20 &&
            y + dy >= 0 &&
            !this.board[y + dy][x + dx]),
      ),
    );
  }
  private drop() {
    if (this.fits(this.piece, this.x, this.y + 1)) this.y++;
    else this.lock();
  }
  private lock() {
    this.piece.forEach((row, dy) =>
      row.forEach((v, dx) => {
        if (v) this.board[this.y + dy][this.x + dx] = 1;
      }),
    );
    const kept = this.board.filter((row) => row.some((v) => !v));
    const cleared = 20 - kept.length;
    while (kept.length < 20) kept.unshift(Array(10).fill(0));
    this.board = kept;
    if (cleared) {
      this.score([0, 100, 300, 500, 800][cleared] * this.state.level);
      this.lines += cleared;
      const level =
        1 + Math.floor(this.lines / blockRules[this.difficulty].linesPerLevel);
      if (level > this.state.level) this.sound("level");
      this.state.level = level;
    }
    this.spawn();
    this.tick = 0;
  }
  step(dt: number) {
    this.tick += dt;
    const rules = blockRules[this.difficulty];
    const speed = Math.max(
      rules.minFall,
      rules.fall - (this.state.level - 1) * rules.acceleration,
    );
    if (this.tick >= speed) {
      this.tick -= speed;
      this.drop();
    }
  }
  input(input: Input) {
    if (input === "left" && this.fits(this.piece, this.x - 1, this.y)) this.x--;
    if (input === "right" && this.fits(this.piece, this.x + 1, this.y))
      this.x++;
    if (input === "down") {
      if (this.fits(this.piece, this.x, this.y + 1)) this.state.score++;
      this.drop();
      this.tick = 0;
    }
    if (input === "a" || input === "up") {
      const rotated = this.piece[0].map((_, i) =>
        this.piece.map((row) => row[i]).reverse(),
      );
      for (const offset of [0, -1, 1, -2, 2])
        if (this.fits(rotated, this.x + offset, this.y)) {
          this.piece = rotated;
          this.x += offset;
          break;
        }
    }
    if (input === "b") {
      while (this.fits(this.piece, this.x, this.y + 1)) {
        this.y++;
        this.state.score += 2;
      }
      this.lock();
    }
  }
  render(): GameFrame {
    const pixels: Pixel[] = [];
    this.board.forEach((row, y) =>
      row.forEach((v, x) => {
        if (v) pixels.push({ x, y });
      }),
    );
    let ghost = this.y;
    while (this.fits(this.piece, this.x, ghost + 1)) ghost++;
    this.piece.forEach((row, dy) =>
      row.forEach((v, dx) => {
        if (v) {
          pixels.push({ x: this.x + dx, y: ghost + dy, shade: 0.2 });
          pixels.push({ x: this.x + dx, y: this.y + dy });
        }
      }),
    );
    const next: Pixel[] = [];
    this.next.forEach((row, y) =>
      row.forEach((v, x) => {
        if (v) next.push({ x, y });
      }),
    );
    return {
      width: 10,
      height: 20,
      pixels,
      next,
      label: `${this.lines} LINES`,
    };
  }
}
