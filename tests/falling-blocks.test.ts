import { describe, it, expect } from "vitest";
import { FallingBlocks } from "../src/games/falling-blocks";
function playing() {
  const game = new FallingBlocks();
  game.init();
  game.resume();
  return game;
}
describe("Falling Blocks", () => {
  it("moves, respects walls, rotates, and pauses time", () => {
    const g = playing();
    g.piece = [[1, 1, 1]];
    g.x = 3;
    g.handleInput("left");
    expect(g.x).toBe(2);
    g.handleInput("a");
    expect(g.piece).toEqual([[1], [1], [1]]);
    for (let i = 0; i < 20; i++) g.handleInput("left");
    expect(g.x).toBe(0);
    g.pause();
    const y = g.y;
    g.update(2);
    expect(g.y).toBe(y);
    expect(g.state.elapsed).toBe(0);
  });
  it("clears a completed row, scores, and progresses levels", () => {
    const g = playing();
    g.board[19] = Array(10).fill(1);
    g.board[19][0] = 0;
    g.piece = [[1]];
    g.x = 0;
    g.y = 18;
    g.lines = 9;
    g.handleInput("b");
    expect(g.lines).toBe(10);
    expect(g.state.score).toBe(102);
    expect(g.state.level).toBe(2);
    expect(g.board[19].every((x) => x === 0)).toBe(true);
  });
  it("ends on blocked spawn and restarts from a clean board", () => {
    const g = playing();
    g.board[0] = Array(10).fill(1);
    g.board[0][0] = 0;
    g.next = [[1, 1]];
    g.piece = [[1]];
    g.x = 0;
    g.y = 19;
    g.handleInput("b");
    expect(g.state.status).toBe("over");
    g.handleInput("restart");
    expect(g.state.status).toBe("playing");
    expect(g.state.score).toBe(0);
    expect(g.board.flat().every((x) => x === 0)).toBe(true);
  });
});
