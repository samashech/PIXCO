import type { GameFrame } from "../games/engine/types";
import { lcdOverrides } from "../themes/catalog";
export type LCDTheme = "green" | "gray" | "amber" | "dark";
export type LCDEffect = "off" | "classic" | "authentic";
export interface LCDPalette {
  background: string;
  foreground: string;
}
interface CachedDisplay {
  key: string;
  background: HTMLCanvasElement;
  signature: string;
  settle: number;
}
const displays = new WeakMap<HTMLCanvasElement, CachedDisplay>();
/** Static off-pixels are cached. Unchanged boards do no canvas work. */
export function renderLCD(
  canvas: HTMLCanvasElement,
  frame: GameFrame,
  theme: LCDTheme | LCDPalette = "green",
  effect: LCDEffect = "classic",
  scale = 8,
  detail = 8,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const colors = typeof theme === "string" ? lcdOverrides[theme] : theme;
  scale = Math.max(1, Math.round(scale));
  const width = frame.width * scale,
    height = frame.height * scale,
    key = `${width}:${height}:${colors.background}:${colors.foreground}:${effect}:${detail}`;
  let cached = displays.get(canvas);
  const gap = effect === "off" ? 0 : Math.max(1, Math.round(scale / detail));
  const size = Math.max(1, scale - gap * 2);
  if (!cached || cached.key !== key) {
    canvas.width = width;
    canvas.height = height;
    const background = document.createElement("canvas");
    background.width = width;
    background.height = height;
    const base = background.getContext("2d");
    if (!base) return;
    base.fillStyle = colors.background;
    base.fillRect(0, 0, width, height);
    if (effect !== "off") {
      base.fillStyle = colors.foreground;
      base.globalAlpha = 0.065;
      for (let y = 0; y < frame.height; y++)
        for (let x = 0; x < frame.width; x++)
          base.fillRect(x * scale + gap, y * scale + gap, size, size);
    }
    cached = { key, background, signature: "", settle: 0 };
    displays.set(canvas, cached);
  }
  const signature = frame.pixels
    .map((p) => `${p.x},${p.y},${p.shade ?? 1}`)
    .join(";");
  if (cached.signature === signature && cached.settle === 0) return;
  const changed = cached.signature !== signature;
  cached.signature = signature;
  if (effect === "authentic") {
    if (changed) cached.settle = 3;
    else cached.settle = Math.max(0, cached.settle - 1);
    ctx.globalAlpha = cached.settle > 0 ? 0.88 : 1;
  } else ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cached.background, 0, 0);
  ctx.globalAlpha = 1;
  for (const pixel of frame.pixels) {
    if (
      pixel.x < 0 ||
      pixel.x >= frame.width ||
      pixel.y < 0 ||
      pixel.y >= frame.height
    )
      continue;
    ctx.fillStyle = colors.foreground;
    ctx.globalAlpha = pixel.shade ?? 1;
    ctx.fillRect(pixel.x * scale + gap, pixel.y * scale + gap, size, size);
    if (
      detail >= 8 &&
      scale >= 6 &&
      effect !== "off" &&
      (pixel.shade ?? 1) > 0.5
    ) {
      const inset = Math.max(gap + 1, Math.round(scale * 0.375));
      if (scale > inset * 2) {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = colors.background;
        ctx.fillRect(
          pixel.x * scale + inset,
          pixel.y * scale + inset,
          scale - inset * 2,
          scale - inset * 2,
        );
      }
    }
  }
  ctx.globalAlpha = 1;
}
