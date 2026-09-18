import { describe, it, expect } from "vitest";
import { HeldInput, repeatProfile } from "../src/input/held-input";
import { GameClock } from "../src/games/engine/clock";
import type { Input } from "../src/games/engine/types";
describe("responsive input", () => {
  it("fires synchronously then repeats without OS repeat, and stops on release", () => {
    const fired: Input[] = [];
    const held = new HeldInput(repeatProfile("001"), (input) =>
      fired.push(input),
    );
    held.press("key:left", "left");
    expect(fired).toEqual(["left"]);
    held.press("key:left", "left");
    expect(fired).toHaveLength(1);
    for (let i = 0; i < 18; i++) held.update(1 / 60);
    expect(fired.length).toBeGreaterThanOrEqual(4);
    held.release("key:left");
    const count = fired.length;
    held.update(1);
    expect(fired).toHaveLength(count);
  });
  it("keeps simultaneous sources independent and clears on focus loss", () => {
    let count = 0;
    const held = new HeldInput(repeatProfile("003"), () => count++);
    held.press("keyboard", "left");
    held.press("pointer", "left");
    expect(count).toBe(1);
    held.release("keyboard");
    held.update(0.15);
    expect(count).toBe(2);
    held.clear();
    held.update(1);
    expect(count).toBe(2);
  });
  it("does not repeat discrete snake turns, memory responses, or hard drops", () => {
    for (const [id, input] of [
      ["002", "up"],
      ["010", "left"],
      ["001", "b"],
    ] as const) {
      let count = 0;
      const held = new HeldInput(repeatProfile(id), () => count++);
      held.press("key", input);
      held.update(10);
      expect(count).toBe(1);
    }
  });
});
describe("fixed simulation clock", () => {
  it("advances the same simulation at 30, 60, 120, and 144Hz", () => {
    for (const hz of [30, 60, 120, 144]) {
      let ticks = 0,
        elapsed = 0;
      const clock = new GameClock();
      for (let i = 0; i < hz * 2; i++)
        clock.advance(1 / hz, (dt) => {
          ticks++;
          elapsed += dt;
        });
      expect(ticks).toBe(120);
      expect(elapsed).toBeCloseTo(2);
    }
  });
  it("limits catch-up after a suspended tab", () => {
    let count = 0;
    new GameClock().advance(10, () => count++);
    expect(count).toBe(6);
  });
});
