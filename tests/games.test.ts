import { describe, it, expect } from "vitest";
import { games } from "../src/games/registry";
import { Snake } from "../src/games/snake";
import { BrickBreaker } from "../src/games/breaker";
import { Racing } from "../src/games/racing";
import { SpaceShooter } from "../src/games/shooter";
import { Maze } from "../src/games/maze";
import { Pong } from "../src/games/pong";
import { Dodger } from "../src/games/dodger";
import { Memory } from "../src/games/memory";
import type { GameEngine, Input } from "../src/games/engine/types";
function play<T extends GameEngine>(g: T) {
  g.init();
  g.resume();
  return g;
}
describe("engine lifecycle", () => {
  for (const definition of games) {
    it(`${definition.title}: ready, play, pause, reset, and finite rendering`, () => {
      const g = definition.create();
      g.init();
      expect(g.state.status).toBe("ready");
      g.handleInput("start");
      expect(g.state.status).toBe("playing");
      g.update(0.05);
      expect(g.state.elapsed).toBeCloseTo(0.05);
      g.pause();
      g.update(1);
      expect(g.state.elapsed).toBeCloseTo(0.05);
      g.handleInput("restart");
      expect(g.state.elapsed).toBe(0);
      expect(g.state.score).toBe(0);
      expect(g.state.level).toBe(1);
      const inputs: Input[] = ["left", "right", "up", "down", "a", "b"];
      for (let i = 0; i < 1800; i++) {
        if (i % 17 === 0) g.handleInput(inputs[i % inputs.length]);
        g.update(1 / 60);
        const frame = g.render();
        expect(frame.width).toBeGreaterThan(0);
        for (const p of frame.pixels) {
          expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
        }
        if (g.state.status === "over") g.handleInput("restart");
      }
      g.destroy();
      expect(g.state.status).not.toBe("playing");
    });
  }
});
describe("Snake", () => {
  it("eats, grows, scores, and cannot immediately reverse", () => {
    const g = play(new Snake());
    g.food = { x: 7, y: 10 };
    g.handleInput("left");
    g.update(0.3);
    expect(g.body[0]).toEqual({ x: 7, y: 10 });
    expect(g.body.length).toBe(5);
    expect(g.state.score).toBe(100);
  });
  it("ends at a wall", () => {
    const g = play(new Snake());
    for (let i = 0; i < 10; i++) g.update(0.3);
    expect(g.state.status).toBe("over");
  });
});
describe("Brick Breaker", () => {
  it("removes hit bricks and scores", () => {
    const g = play(new BrickBreaker());
    g.bricks = [
      { x: 5, y: 5 },
      { x: 10, y: 5 },
    ];
    g.ball = { x: 5, y: 6 };
    g.velocity = { x: 0, y: -7 };
    g.update(0.1);
    expect(g.bricks).toHaveLength(1);
    expect(g.state.score).toBe(10);
  });
  it("loses lives, ends, and increases level after clearing", () => {
    const g = play(new BrickBreaker());
    g.ball.y = 25;
    g.state.lives = 1;
    g.update(0.01);
    expect(g.state.status).toBe("over");
    g.handleInput("restart");
    g.bricks = [];
    g.update(0.01);
    expect(g.state.level).toBe(2);
    expect(g.bricks.length).toBeGreaterThan(0);
  });
  it("shifts the wall in the alternate game", () => {
    const g = play(new BrickBreaker(undefined, true));
    g.bricks = [{ x: 2, y: 2 }];
    for (let i = 0; i < 181; i++) g.update(1 / 60);
    expect(g.bricks[0].x).toBe(3);
  });
});
describe("Racing", () => {
  it("collides with traffic and awards passed cars", () => {
    const g = play(new Racing());
    g.enemies = [{ lane: 1, y: 18 }];
    g.update(0.01);
    expect(g.state.status).toBe("over");
    g.handleInput("restart");
    g.enemies = [{ lane: 0, y: 24 }];
    g.update(0.01);
    expect(g.state.score).toBe(50);
  });
  it("stays within road lanes", () => {
    const g = play(new Racing());
    for (let i = 0; i < 10; i++) g.handleInput("right");
    expect(g.lane).toBe(2);
  });
});
describe("Space Shooter", () => {
  it("fires, hits invaders, and advances waves", () => {
    const g = play(new SpaceShooter());
    g.handleInput("a");
    expect(g.bullets).toHaveLength(1);
    g.enemies = [{ x: 5, y: 5 }];
    g.bullets = [{ x: 6, y: 7 }];
    g.update(0.01);
    expect(g.state.score).toBe(30);
    expect(g.state.level).toBe(2);
    expect(g.enemies).toHaveLength(9);
  });
  it("takes damage from hostile bullets", () => {
    const g = play(new SpaceShooter());
    g.state.lives = 1;
    g.enemyBullets = [{ x: 8, y: 21 }];
    g.update(0.01);
    expect(g.state.status).toBe("over");
  });
});
describe("Maze", () => {
  it("generates a reachable exit and rewards solving it", () => {
    const g = play(new Maze());
    const queue = [{ x: 1, y: 1, path: [] as Input[] }],
      seen = new Set(["1,1"]);
    let path: Input[] = [];
    while (queue.length) {
      const p = queue.shift()!;
      if (p.x === 13 && p.y === 23) {
        path = p.path;
        break;
      }
      for (const [dx, dy, key] of [
        [0, -1, "up"],
        [0, 1, "down"],
        [-1, 0, "left"],
        [1, 0, "right"],
      ] as const) {
        const x = p.x + dx,
          y = p.y + dy,
          k = `${x},${y}`;
        if (g.maze[y]?.[x] === 0 && !seen.has(k)) {
          seen.add(k);
          queue.push({ x, y, path: [...p.path, key] });
        }
      }
    }
    expect(path.length).toBeGreaterThan(0);
    for (const key of path) g.handleInput(key);
    expect(g.state.level).toBe(2);
    expect(g.state.score).toBeGreaterThanOrEqual(100);
  });
});
describe("Pong", () => {
  it("scores goals, bounces off paddles, and loses on three misses", () => {
    const g = play(new Pong());
    g.ball = { x: 0, y: -1 };
    g.velocity = { x: 0, y: -7 };
    g.update(0.01);
    expect(g.state.score).toBe(100);
    g.ball = { x: 7, y: 21.9 };
    g.velocity = { x: 0, y: 10 };
    g.update(0.02);
    expect(g.velocity.y).toBeLessThan(0);
    g.state.lives = 1;
    g.ball.y = 25;
    g.velocity.y = 7;
    g.update(0.01);
    expect(g.state.status).toBe("over");
  });
});
describe("Dodger", () => {
  it("awards survival and ends on collision", () => {
    const g = play(new Dodger());
    g.objects = [{ x: 0, y: 24 }];
    g.update(0.01);
    expect(g.state.score).toBe(20);
    g.objects = [{ x: 7, y: 21 }];
    g.update(0.01);
    expect(g.state.status).toBe("over");
  });
});
describe("Memory", () => {
  it("waits for the pattern, rewards correct input, and counts mistakes", () => {
    const g = play(new Memory());
    g.sequence = [0, 1];
    g.handleInput("up");
    expect(g.index).toBe(0);
    g.update(1.5);
    g.handleInput("up");
    g.handleInput("right");
    expect(g.state.score).toBe(200);
    expect(g.state.level).toBe(2);
    expect(g.sequence.length).toBe(3);
    g.update(4);
    g.state.lives = 1;
    g.handleInput("left");
    expect(g.state.status).toBe("over");
  });
});
