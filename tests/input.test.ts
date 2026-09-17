import { describe, it, expect } from "vitest";
import {
  defaultMappings,
  gamepadInputs,
  keyboardInput,
} from "../src/input/controls";
describe("input", () => {
  it("maps keyboard defaults and remapped actions", () => {
    const event = { code: "KeyZ", target: null } as KeyboardEvent;
    expect(keyboardInput(event, defaultMappings)).toBe("a");
    expect(
      keyboardInput({ ...event, code: "KeyQ" } as KeyboardEvent, {
        ...defaultMappings,
        a: "KeyQ",
      }),
    ).toBe("a");
  });
  it("leaves typing and system shortcuts alone", () => {
    const event = {
      code: "KeyZ",
      target: { closest: () => true },
    } as unknown as KeyboardEvent;
    expect(keyboardInput(event, defaultMappings)).toBeUndefined();
    expect(
      keyboardInput(
        { code: "KeyZ", ctrlKey: true } as KeyboardEvent,
        defaultMappings,
      ),
    ).toBeUndefined();
  });
  it("maps controller buttons, axes, and swapped actions", () => {
    const pad = {
      buttons: Array.from({ length: 16 }, (_, i) => ({
        pressed: i === 0 || i === 9,
      })),
      axes: [-1, 0],
    } as Gamepad;
    expect(gamepadInputs(pad)).toEqual(["a", "start", "left"]);
    expect(gamepadInputs(pad, true)).toContain("b");
  });
});
