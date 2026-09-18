import type { Input } from "../games/engine/types";
export interface RepeatTiming {
  delay: number;
  interval: number;
}
export type RepeatProfile = Partial<Record<Input, RepeatTiming>>;
const move = { delay: 0.1, interval: 0.05 };
/** Repeat cadence belongs to controls, never to gameplay difficulty. */
export function repeatProfile(gameId: string): RepeatProfile {
  if (gameId === "002" || gameId === "010") return {};
  if (gameId === "001")
    return {
      left: { delay: 0.12, interval: 0.045 },
      right: { delay: 0.12, interval: 0.045 },
      down: { delay: 0.04, interval: 0.04 },
    };
  if (gameId === "004")
    return {
      left: { delay: 0.16, interval: 0.14 },
      right: { delay: 0.16, interval: 0.14 },
    };
  if (gameId === "005")
    return {
      left: move,
      right: move,
      a: { delay: 0.16, interval: 0.16 },
      up: { delay: 0.16, interval: 0.16 },
    };
  if (gameId === "006")
    return { left: move, right: move, up: move, down: move };
  return { left: move, right: move };
}
export class HeldInput {
  private sources = new Map<string, Input>();
  private held = new Map<Input, { next: number; order: number }>();
  private order = 0;
  private time = 0;
  constructor(
    private profile: RepeatProfile,
    private fire: (input: Input) => void,
    private visual: (input: Input, down: boolean) => void = () => {},
  ) {}
  press(source: string, input: Input) {
    if (this.sources.has(source)) return;
    this.sources.set(source, input);
    if (this.held.has(input)) return;
    this.held.set(input, {
      next: this.time + (this.profile[input]?.delay ?? Infinity),
      order: ++this.order,
    });
    this.visual(input, true);
    this.fire(input);
  }
  release(source: string) {
    const input = this.sources.get(source);
    if (!input) return;
    this.sources.delete(source);
    if ([...this.sources.values()].includes(input)) return;
    this.held.delete(input);
    this.visual(input, false);
  }
  update(dt: number) {
    this.time += dt;
    const opposite: Partial<Record<Input, Input>> = {
      left: "right",
      right: "left",
      up: "down",
      down: "up",
    };
    for (const [input, entry] of this.held) {
      const other = opposite[input] && this.held.get(opposite[input]!);
      if (other && other.order > entry.order) continue;
      const timing = this.profile[input];
      if (!timing) continue;
      if (entry.next <= this.time + 1e-9) {
        this.fire(input);
        entry.next = this.time + timing.interval;
      }
    }
  }
  clear() {
    for (const input of this.held.keys()) this.visual(input, false);
    this.held.clear();
    this.sources.clear();
  }
}
