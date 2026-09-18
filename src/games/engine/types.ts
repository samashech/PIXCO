import type { Difficulty } from "../difficulty";
export type Input =
  | "up"
  | "down"
  | "left"
  | "right"
  | "a"
  | "b"
  | "start"
  | "menu"
  | "pause"
  | "restart";
export type Sound = "click" | "start" | "score" | "lose" | "level";
export type Status = "ready" | "playing" | "paused" | "over";
export interface Pixel {
  x: number;
  y: number;
  shade?: number;
}
export interface GameFrame {
  width: number;
  height: number;
  pixels: Pixel[];
  next?: Pixel[];
  label?: string;
}
export interface Snapshot {
  score: number;
  level: number;
  lives: number;
  status: Status;
  elapsed: number;
}
export interface GameEngine {
  state: Snapshot;
  readonly difficulty: Difficulty;
  init(): void;
  update(dt: number): void;
  render(): GameFrame;
  handleInput(input: Input): void;
  pause(): void;
  resume(): void;
  reset(): void;
  destroy(): void;
}
export interface GameDefinition {
  id: string;
  title: string;
  shortDescription: string;
  category: string;
  tags: string[];
  controls: { key: string; action: string }[];
  version: string;
  create: (
    sound?: (name: Sound) => void,
    difficulty?: Difficulty,
  ) => GameEngine;
}
