import type { Input } from "../games/engine/types";
export const defaultMappings: Record<Input, string> = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  a: "KeyZ",
  b: "KeyX",
  start: "Enter",
  menu: "Escape",
  pause: "KeyP",
  restart: "KeyR",
};
export function keyboardInput(
  event: KeyboardEvent,
  mappings: Record<Input, string>,
): Input | undefined {
  const target = event.target as HTMLElement | null;
  if (
    target?.closest('input,textarea,select,[contenteditable="true"]') ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  )
    return;
  return Object.entries(mappings).find(
    ([, code]) => event.code === code,
  )?.[0] as Input | undefined;
}
export function gamepadInputs(pad: Gamepad, swap = false): Input[] {
  const inputs: Input[] = [];
  const map: Record<number, Input> = {
    0: swap ? "b" : "a",
    1: swap ? "a" : "b",
    8: "menu",
    9: "start",
    12: "up",
    13: "down",
    14: "left",
    15: "right",
  };
  for (const [index, input] of Object.entries(map))
    if (pad.buttons[Number(index)]?.pressed) inputs.push(input);
  if (pad.axes[0] < -0.5) inputs.push("left");
  if (pad.axes[0] > 0.5) inputs.push("right");
  if (pad.axes[1] < -0.5) inputs.push("up");
  if (pad.axes[1] > 0.5) inputs.push("down");
  return [...new Set(inputs)];
}
