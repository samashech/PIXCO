import type { LCDPalette, LCDTheme } from "../lcd/renderer";
export const appearanceIds = [
  "classic",
  "electronic",
  "toy-store",
  "industrial",
  "paper",
  "terminal",
] as const;
export type Appearance = (typeof appearanceIds)[number];
export interface AppearanceTheme {
  id: Appearance;
  name: string;
  description: string;
  tokens: Record<string, string>;
  lcd: LCDPalette;
}
const mono = "'Courier New', ui-monospace, monospace";
const classicTokens = {
  background: "#262823",
  surface: "#30332d",
  "surface-secondary": "#3b3f36",
  "sidebar-bg": "#22251f",
  text: "#e9e9de",
  "text-muted": "#b3b8a9",
  "text-dim": "#929b88",
  accent: "#bbc99f",
  "accent-ink": "#283020",
  border: "#555c4b",
  "button-face": "#575e50",
  "button-shadow": "#30372a",
  "button-ink": "#e1e5d7",
  "device-body": "#b6b5a8",
  "device-edge": "#cfcec0",
  "device-shadow": "#777c6b",
  "device-print": "#3c4636",
  bezel: "#464e40",
  "action-a": "#747d5f",
  "action-b": "#626c55",
  "action-ink": "#f1f1df",
  "font-ui": "'Segoe UI', Arial, sans-serif",
  "font-display": "'Segoe UI', Arial, sans-serif",
  "font-mono": mono,
  "panel-radius": "4px",
  "device-radius": "21px 21px 31px 31px",
  "material-line": "#ffffff08",
  easy: "#a5bb86",
  normal: "#c3af7c",
  hard: "#cb9c84",
  shadow: "#00000035",
  highlight: "#ffffff25",
};
function theme(
  id: Appearance,
  name: string,
  description: string,
  tokens: Partial<typeof classicTokens>,
  lcd: LCDPalette,
): AppearanceTheme {
  return {
    id,
    name,
    description,
    tokens: { ...classicTokens, ...tokens },
    lcd,
  };
}
export const appearances: Record<Appearance, AppearanceTheme> = {
  classic: theme(
    "classic",
    "Classic LCD",
    "Warm plastic. Familiar green. Nothing extra.",
    {},
    { background: "#a8b58d", foreground: "#303a2c" },
  ),
  electronic: theme(
    "electronic",
    "90s Electronic",
    "Molded panels, amber labels, a yellowed display.",
    {
      background: "#20211f",
      surface: "#2b2d29",
      "surface-secondary": "#373a34",
      "sidebar-bg": "#191c18",
      text: "#dfdfca",
      "text-muted": "#b6b79d",
      "text-dim": "#9b9e84",
      accent: "#c9ad6e",
      "accent-ink": "#30291b",
      border: "#60604c",
      "device-body": "#555a50",
      "device-edge": "#757a67",
      "device-shadow": "#2d3527",
      "device-print": "#d1caa5",
      "button-face": "#292f25",
      "button-shadow": "#11190e",
      "button-ink": "#b7bda7",
      "action-a": "#c3ad70",
      "action-b": "#a9a384",
      "action-ink": "#303626",
      "panel-radius": "1px",
      "device-radius": "14px 14px 22px 22px",
      "font-display": mono,
    },
    { background: "#babc8c", foreground: "#3e442a" },
  ),
  "toy-store": theme(
    "toy-store",
    "Toy Store",
    "Small splashes of color. Proper plastic buttons.",
    {
      background: "#e7e3da",
      surface: "#f3eee5",
      "surface-secondary": "#dcd5c5",
      "sidebar-bg": "#d9d4c8",
      text: "#303a40",
      "text-muted": "#566264",
      "text-dim": "#627076",
      accent: "#416479",
      "accent-ink": "#fffaf0",
      border: "#b1b0a0",
      "device-body": "#d7c789",
      "device-edge": "#ede0ad",
      "device-shadow": "#998b58",
      "device-print": "#384d56",
      bezel: "#4a5350",
      "button-face": "#56748a",
      "button-shadow": "#344757",
      "button-ink": "#f4f0df",
      "action-a": "#bc6354",
      "action-b": "#537692",
      "action-ink": "#fff8e7",
      "panel-radius": "8px",
      "device-radius": "25px 25px 36px 36px",
      easy: "#536e48",
      normal: "#8a6e26",
      hard: "#a9493c",
    },
    { background: "#b4bc91", foreground: "#36432e" },
  ),
  industrial: theme(
    "industrial",
    "Industrial",
    "Graphite. Machined edges. No decoration.",
    {
      background: "#191c1e",
      surface: "#24282a",
      "surface-secondary": "#303638",
      "sidebar-bg": "#141719",
      text: "#e0e5e3",
      "text-muted": "#acb8b7",
      "text-dim": "#91a1a1",
      accent: "#b7c6c3",
      "accent-ink": "#25312e",
      border: "#526062",
      "device-body": "#4b5356",
      "device-edge": "#778183",
      "device-shadow": "#272e31",
      "device-print": "#d2ddda",
      bezel: "#22292a",
      "button-face": "#30383a",
      "button-shadow": "#131a1b",
      "button-ink": "#c3d0ca",
      "action-a": "#abb7ad",
      "action-b": "#7b8b83",
      "action-ink": "#28332d",
      "panel-radius": "0px",
      "device-radius": "8px 8px 14px 14px",
    },
    { background: "#b5b8af", foreground: "#343833" },
  ),
  paper: theme(
    "paper",
    "Paper / Manual",
    "Ink, diagrams, and the fold-out instructions.",
    {
      background: "#ece7d9",
      surface: "#f5f0e3",
      "surface-secondary": "#e1dacb",
      "sidebar-bg": "#e3ddcc",
      text: "#35352b",
      "text-muted": "#636353",
      "text-dim": "#77765f",
      accent: "#586447",
      "accent-ink": "#f5f0df",
      border: "#b0ac97",
      "device-body": "#d8d1bd",
      "device-edge": "#eee7d3",
      "device-shadow": "#a29d84",
      "device-print": "#555844",
      bezel: "#686b55",
      "button-face": "#777c63",
      "button-shadow": "#494f3d",
      "button-ink": "#f4eedd",
      "action-a": "#777d5f",
      "action-b": "#999d7f",
      "action-ink": "#f8f1dc",
      "panel-radius": "1px",
      "device-radius": "18px 18px 27px 27px",
      "font-display": "Georgia, 'Times New Roman', serif",
      easy: "#506343",
      normal: "#8b723b",
      hard: "#915447",
    },
    { background: "#b9be9d", foreground: "#40482e" },
  ),
  terminal: theme(
    "terminal",
    "Terminal",
    "Quiet phosphor tones. Text does the talking.",
    {
      background: "#171d19",
      surface: "#202a22",
      "surface-secondary": "#2b362b",
      "sidebar-bg": "#121914",
      text: "#b8c8ac",
      "text-muted": "#9bad91",
      "text-dim": "#859b7c",
      accent: "#a8bb97",
      "accent-ink": "#22301d",
      border: "#506448",
      "device-body": "#354330",
      "device-edge": "#5a6c4d",
      "device-shadow": "#192615",
      "device-print": "#b2c1a0",
      bezel: "#1b2918",
      "button-face": "#2c3b24",
      "button-shadow": "#15200f",
      "button-ink": "#a6bb94",
      "action-a": "#8a9e75",
      "action-b": "#617c51",
      "action-ink": "#14200f",
      "font-ui": mono,
      "font-display": mono,
      "panel-radius": "0px",
      "device-radius": "12px 12px 18px 18px",
    },
    { background: "#9cae87", foreground: "#2e3b26" },
  ),
};
export function applyAppearance(id: Appearance) {
  const value = appearances[id];
  const root = document.documentElement;
  root.dataset.appearance = id;
  for (const [key, token] of Object.entries(value.tokens))
    root.style.setProperty(`--${key}`, token);
  root.style.setProperty("--muted", value.tokens["text-muted"]);
  root.style.setProperty("--subtle", value.tokens["text-dim"]);
  root.style.setProperty("--line", value.tokens.border);
}
export function resolveLCD(settings: {
  appearance: Appearance;
  theme: LCDTheme | "auto";
}): LCDPalette {
  return settings.theme === "auto"
    ? appearances[settings.appearance].lcd
    : lcdOverrides[settings.theme];
}
export const lcdOverrides: Record<LCDTheme, LCDPalette> = {
  green: { background: "#a8b58d", foreground: "#303a2c" },
  gray: { background: "#b5b8af", foreground: "#343833" },
  amber: { background: "#c7b382", foreground: "#463b28" },
  dark: { background: "#343c34", foreground: "#becba6" },
};
