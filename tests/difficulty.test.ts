import { describe, it, expect } from "vitest";
import { games } from "../src/games/registry";
import { difficulties } from "../src/games/difficulty";
import { FallingBlocks } from "../src/games/falling-blocks";
import { Snake } from "../src/games/snake";
import { BrickBreaker } from "../src/games/breaker";
import { Racing } from "../src/games/racing";
import { SpaceShooter } from "../src/games/shooter";
import { Maze } from "../src/games/maze";
import { Pong } from "../src/games/pong";
import { Dodger } from "../src/games/dodger";
import { Memory } from "../src/games/memory";
import type { GameEngine, Input } from "../src/games/engine/types";
function play<T extends GameEngine>(game: T) {
  game.init();
  game.resume();
  return game;
}
function advance(game: GameEngine, seconds: number) {
  for (let i = 0; i < Math.round(seconds * 60); i++) game.update(1 / 60);
}
describe("all difficulty lifecycles", () => {
  for (const game of games)
    for (const difficulty of difficulties)
      it(`${game.title} / ${difficulty}: play, pause, reset`, () => {
        const engine = play(game.create(undefined, difficulty));
        expect(engine.difficulty).toBe(difficulty);
        advance(engine, 0.5);
        expect(engine.state.elapsed).toBeCloseTo(0.5);
        engine.pause();
        advance(engine, 0.5);
        expect(engine.state.elapsed).toBeCloseTo(0.5);
        engine.handleInput("restart");
        expect(engine.difficulty).toBe(difficulty);
        expect(engine.state.score).toBe(0);
        expect(engine.state.elapsed).toBe(0);
        expect(engine.state.level).toBe(1);
        const frame = engine.render();
        expect(
          frame.pixels.every(
            (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
          ),
        ).toBe(true);
        engine.destroy();
      });
});
describe("difficulty affects mechanics, not control latency", () => {
  it("blocks change fall cadence and level thresholds without changing movement", () => {
    const easy = play(new FallingBlocks(undefined, "easy")),
      hard = play(new FallingBlocks(undefined, "hard"));
    for (const game of [easy, hard]) {
      game.piece = [[1]];
      game.x = 3;
      game.y = 0;
      game.handleInput("left");
      expect(game.x).toBe(2);
      advance(game, 0.5);
    }
    expect(easy.y).toBe(0);
    expect(hard.y).toBe(1);
    for (const game of [easy, hard]) {
      game.board[19] = Array(10).fill(1);
      game.board[19][0] = 0;
      game.piece = [[1]];
      game.x = 0;
      game.y = 18;
      game.lines = 5;
      game.handleInput("b");
    }
    expect(easy.state.level).toBe(1);
    expect(hard.state.level).toBe(2);
  });
  it("snake has distinct movement cadence and buffers rapid legal turns", () => {
    const easy = play(new Snake(undefined, "easy")),
      hard = play(new Snake(undefined, "hard"));
    advance(easy, 0.2);
    advance(hard, 0.2);
    expect(easy.body[0].x).toBe(6);
    expect(hard.body[0].x).toBe(7);
    const snake = play(new Snake());
    snake.handleInput("up");
    snake.handleInput("left");
    advance(snake, 0.24);
    expect(snake.body[0]).toEqual({ x: 6, y: 9 });
    advance(snake, 0.24);
    expect(snake.body[0]).toEqual({ x: 5, y: 9 });
  });
  it("racing changes traffic velocity and density", () => {
    const easy = play(new Racing(undefined, "easy")),
      hard = play(new Racing(undefined, "hard"));
    for (const game of [easy, hard]) {
      game.enemies = [{ lane: 0, y: 0 }];
      advance(game, 1.2);
    }
    expect(hard.enemies[0].y).toBeGreaterThan(easy.enemies[0].y);
    expect(hard.enemies.length).toBeGreaterThan(easy.enemies.length);
  });
  it("shooter changes formations and projectile pressure", () => {
    const easy = play(new SpaceShooter(undefined, "easy")),
      hard = play(new SpaceShooter(undefined, "hard"));
    expect(easy.enemies.length).toBe(6);
    expect(hard.enemies.length).toBe(12);
    advance(easy, 0.9);
    advance(hard, 0.9);
    expect(easy.enemyBullets).toHaveLength(0);
    expect(hard.enemyBullets.length).toBeGreaterThan(0);
  });
  for (const moving of [false, true])
    it(`breaker ${moving ? "variant" : "classic"} changes paddle forgiveness, ball speed, and brick patterns`, () => {
      const easy = play(new BrickBreaker(undefined, moving, "easy")),
        hard = play(new BrickBreaker(undefined, moving, "hard"));
      const paddle = (game: BrickBreaker) =>
        game.render().pixels.filter((p) => p.y === 22).length;
      expect(paddle(easy)).toBe(5);
      expect(paddle(hard)).toBe(3);
      expect(Math.abs(hard.velocity.y)).toBeGreaterThan(
        Math.abs(easy.velocity.y),
      );
      expect(hard.bricks.length).toBeGreaterThan(easy.bricks.length);
      for (const game of [easy, hard]) {
        game.ball = { x: game.paddle - 0.5, y: 21.95 };
        game.velocity = { x: 0, y: 7 };
        advance(game, 1 / 60);
      }
      expect(easy.velocity.y).toBeLessThan(0);
      expect(hard.velocity.y).toBeGreaterThan(0);
    });
  it("maze scales complexity and every level remains solvable", () => {
    for (const difficulty of difficulties) {
      const game = play(new Maze(undefined, difficulty));
      const frame = game.render();
      expect(frame.width).toBe(
        difficulty === "easy" ? 11 : difficulty === "hard" ? 19 : 15,
      );
      const queue = [{ ...game.player, path: [] as Input[] }],
        seen = new Set(["1,1"]);
      let solution: Input[] | undefined;
      while (queue.length) {
        const p = queue.shift()!;
        if (p.x === game.goal.x && p.y === game.goal.y) {
          solution = p.path;
          break;
        }
        for (const [dx, dy, input] of [
          [0, -1, "up"],
          [0, 1, "down"],
          [-1, 0, "left"],
          [1, 0, "right"],
        ] as const) {
          const x = p.x + dx,
            y = p.y + dy,
            key = `${x},${y}`;
          if (game.maze[y]?.[x] === 0 && !seen.has(key)) {
            seen.add(key);
            queue.push({ x, y, path: [...p.path, input] });
          }
        }
      }
      expect(solution).toBeDefined();
      solution!.forEach((input) => game.handleInput(input));
      expect(game.state.level).toBe(2);
    }
  });
  it("pong changes opponent reaction time and paddle width", () => {
    const easy = play(new Pong(undefined, "easy")),
      hard = play(new Pong(undefined, "hard"));
    for (const game of [easy, hard]) {
      game.opponent = 0;
      game.ball = { x: 12, y: 8 };
      advance(game, 0.1);
    }
    expect(easy.opponent).toBe(0);
    expect(hard.opponent).toBeGreaterThan(0);
    expect(easy.render().pixels.filter((p) => p.y === 22).length).toBe(5);
    expect(hard.render().pixels.filter((p) => p.y === 22).length).toBe(3);
  });
  it("dodger changes density while directional input remains identical", () => {
    const easy = play(new Dodger(undefined, "easy")),
      hard = play(new Dodger(undefined, "hard"));
    for (const game of [easy, hard]) {
      game.objects = [];
      game.handleInput("left");
      expect(game.x).toBe(6);
      advance(game, 0.6);
    }
    expect(easy.objects).toHaveLength(0);
    expect(hard.objects.length).toBeGreaterThan(0);
  });
  it("memory changes sequence length, presentation timing, and hard response limits", () => {
    const easy = play(new Memory(undefined, "easy")),
      hard = play(new Memory(undefined, "hard"));
    expect(easy.sequence).toHaveLength(1);
    expect(hard.sequence).toHaveLength(3);
    advance(easy, 0.6);
    expect(easy.showing).toBe(true);
    advance(hard, 1.5);
    expect(hard.showing).toBe(false);
    const lives = hard.state.lives;
    advance(hard, 5.1);
    expect(hard.state.lives).toBe(lives - 1);
    advance(easy, 8);
    expect(easy.state.lives).toBe(4);
  });
});
