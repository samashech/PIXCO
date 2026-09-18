import { describe, it, expect, vi } from "vitest";
import { fitGrid } from "../src/lcd/sizing";
import { renderLCD } from "../src/lcd/renderer";
function canvas() {
  const context = {
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    imageSmoothingEnabled: true,
    globalAlpha: 1,
    fillStyle: "",
  };
  return { width: 0, height: 0, getContext: () => context, context };
}
describe("LCD scaling and redraws", () => {
  it("preserves aspect and square physical pixels at varied viewport sizes and DPRs", () => {
    for (const [w, h] of [
      [10, 20],
      [12, 20],
      [19, 31],
    ])
      for (const [aw, ah] of [
        [80, 160],
        [1210, 760],
        [276, 704],
        [580, 235],
      ])
        for (const dpr of [1, 1.25, 2]) {
          const fit = fitGrid(w, h, aw, ah, dpr);
          expect(fit.width / fit.height).toBeCloseTo(w / h);
          expect(fit.unit * dpr).toBeCloseTo(Math.round(fit.unit * dpr));
          expect(fit.width).toBeLessThanOrEqual(aw);
          expect(fit.height).toBeLessThanOrEqual(ah);
        }
  });
  it("skips identical frames, redraws after palette or size changes, and disables interpolation", () => {
    vi.stubGlobal("document", { createElement: () => canvas() });
    const target = canvas();
    const frame = { width: 10, height: 20, pixels: [{ x: 3, y: 2 }] };
    renderLCD(target as unknown as HTMLCanvasElement, frame);
    expect(target.context.imageSmoothingEnabled).toBe(false);
    const count = target.context.drawImage.mock.calls.length;
    renderLCD(target as unknown as HTMLCanvasElement, frame);
    expect(target.context.drawImage).toHaveBeenCalledTimes(count);
    renderLCD(target as unknown as HTMLCanvasElement, frame, "gray");
    expect(target.context.drawImage).toHaveBeenCalledTimes(count + 1);
    renderLCD(
      target as unknown as HTMLCanvasElement,
      frame,
      "gray",
      "classic",
      24,
    );
    expect(target.width).toBe(240);
    expect(target.height).toBe(480);
    vi.unstubAllGlobals();
  });
});
