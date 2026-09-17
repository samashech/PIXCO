import { defaults, type Settings } from "./settings";
import type { Input } from "../games/engine/types";
export function parseSettings(text: string): Settings {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("Choose a valid Brickbox JSON settings file.");
  }
  if (
    !value ||
    typeof value !== "object" ||
    !("version" in value) ||
    value.version !== 1 ||
    !("settings" in value) ||
    !value.settings ||
    typeof value.settings !== "object"
  )
    throw new Error("This is not a supported Brickbox settings file.");
  const source = value.settings as Record<string, unknown>;
  const result: Settings = { ...defaults, mappings: { ...defaults.mappings } };
  const enums = {
    theme: ["green", "gray", "amber", "dark"],
    effect: ["off", "classic", "authentic"],
    density: ["comfortable", "compact"],
    screenScaling: ["integer", "fit"],
  } as const;
  for (const [key, options] of Object.entries(enums)) {
    if (source[key] !== undefined) {
      if (!options.includes(source[key] as never))
        throw new Error(`Invalid ${key} setting.`);
      Object.assign(result, { [key]: source[key] });
    }
  }
  for (const key of [
    "muted",
    "autoPause",
    "fps",
    "timer",
    "motion",
    "swapButtons",
  ] as const) {
    if (source[key] !== undefined) {
      if (typeof source[key] !== "boolean")
        throw new Error(`Invalid ${key} setting.`);
      result[key] = source[key];
    }
  }
  for (const key of ["master", "sfx", "uiScale", "pixelSize"] as const) {
    if (source[key] !== undefined) {
      const n = source[key];
      if (typeof n !== "number" || !Number.isFinite(n))
        throw new Error(`Invalid ${key} setting.`);
      if (
        ((key === "master" || key === "sfx") && (n < 0 || n > 1)) ||
        (key === "uiScale" && ![1, 1.1, 1.2].includes(n)) ||
        (key === "pixelSize" && ![6, 8, 10].includes(n))
      )
        throw new Error(`${key} is out of range.`);
      result[key] = n;
    }
  }
  if (source.mappings !== undefined) {
    if (!source.mappings || typeof source.mappings !== "object")
      throw new Error("Invalid keyboard mappings.");
    const mappings = source.mappings as Record<string, unknown>;
    for (const key of Object.keys(defaults.mappings) as Input[]) {
      const code = mappings[key];
      if (
        typeof code !== "string" ||
        !/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Enter|Escape|Space|Backspace|Tab|BracketLeft|BracketRight|Semicolon|Quote|Comma|Period|Slash|Backslash|Minus|Equal|F([1-9]|1[0-2]))$/.test(
          code,
        )
      )
        throw new Error(`Invalid key for ${key}.`);
      result.mappings[key] = code;
    }
    if (
      new Set(Object.values(result.mappings)).size !==
      Object.keys(result.mappings).length
    )
      throw new Error("Each action needs a different key.");
  }
  return result;
}
