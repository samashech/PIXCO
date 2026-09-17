import { defaultMappings } from "../input/controls";
import type { Input } from "../games/engine/types";
import type { LCDEffect, LCDTheme } from "../lcd/renderer";
export interface Settings {
  theme: LCDTheme;
  effect: LCDEffect;
  master: number;
  sfx: number;
  muted: boolean;
  autoPause: boolean;
  fps: boolean;
  timer: boolean;
  motion: boolean;
  density: "comfortable" | "compact";
  uiScale: number;
  pixelSize: number;
  screenScaling: "integer" | "fit";
  swapButtons: boolean;
  mappings: Record<Input, string>;
}
export const defaults: Settings = {
  theme: "green",
  effect: "classic",
  master: 0.35,
  sfx: 0.7,
  muted: false,
  autoPause: true,
  fps: false,
  timer: true,
  motion: true,
  density: "comfortable",
  uiScale: 1,
  pixelSize: 8,
  screenScaling: "integer",
  swapButtons: false,
  mappings: defaultMappings,
};
