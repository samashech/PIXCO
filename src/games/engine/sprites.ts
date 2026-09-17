import type { Pixel } from "./types";
export function sprite(pattern: string[], x: number, y: number): Pixel[] {
  return pattern.flatMap((row, dy) =>
    [...row].flatMap((v, dx) => (v === "1" ? [{ x: x + dx, y: y + dy }] : [])),
  );
}
export const car = ["010", "111", "010", "111"];
export const ship = ["010", "111", "111"];
export const alien = ["101", "111", "010"];
