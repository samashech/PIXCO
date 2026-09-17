import type { GameFrame } from "../games/engine/types";
export type LCDTheme = "green" | "gray" | "amber" | "dark";
export type LCDEffect = "off" | "classic" | "authentic";
export const themes = {
  green: { background: "#a8b58d", foreground: "#303a2c" },
  gray: { background: "#b5b8af", foreground: "#343833" },
  amber: { background: "#c7b382", foreground: "#463b28" },
  dark: { background: "#343c34", foreground: "#becba6" },
};
export function renderLCD(
  canvas: HTMLCanvasElement,
  frame: GameFrame,
  theme: LCDTheme = "green",
  effect: LCDEffect = "classic",
  scale = 8,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = frame.width * scale,
    height = frame.height * scale;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const colors = themes[theme];
  ctx.imageSmoothingEnabled = false;
  if (effect === "authentic") {
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
  }
  const gap = effect === "off" ? 0 : 1;
  ctx.fillStyle = colors.foreground;
  if (effect !== "off") {
    ctx.globalAlpha = 0.065;
    for (let y = 0; y < frame.height; y++)
      for (let x = 0; x < frame.width; x++)
        ctx.fillRect(
          x * scale + gap,
          y * scale + gap,
          scale - gap * 2,
          scale - gap * 2,
        );
  }
  for (const pixel of frame.pixels) {
    ctx.globalAlpha = pixel.shade ?? 1;
    ctx.fillRect(
      pixel.x * scale + gap,
      pixel.y * scale + gap,
      scale - gap * 2,
      scale - gap * 2,
    );
    if (scale >= 8 && effect !== "off" && (pixel.shade ?? 1) > 0.5) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = colors.background;
      ctx.fillRect(
        pixel.x * scale + 3,
        pixel.y * scale + 3,
        scale - 6,
        scale - 6,
      );
      ctx.fillStyle = colors.foreground;
    }
  }
  ctx.globalAlpha = 1;
}
