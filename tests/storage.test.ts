import { beforeEach, describe, it, expect, vi } from "vitest";
const backing = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => backing.get(k) ?? null,
  setItem: (k: string, v: string) => backing.set(k, v),
});
const { store, defaults, STORAGE_KEY } = await import("../src/storage/store");
const { parseSettings } = await import("../src/storage/validation");
beforeEach(() => {
  store.reset("statistics");
  store.reset("scores");
  store.reset("favorites");
  store.settings(defaults);
});
describe("persistence", () => {
  it("persists favorites, settings, and selected game", () => {
    store.favorite("002");
    store.settings({ theme: "amber", muted: true });
    store.select("002");
    const saved = JSON.parse(backing.get(STORAGE_KEY)!);
    expect(saved.favorites).toContain("002");
    expect(saved.settings.theme).toBe("amber");
    expect(saved.settings.muted).toBe(true);
    expect(saved.selected).toBe("002");
    store.favorite("002");
    expect(store.get().favorites).toEqual([]);
  });
  it("records scores and time without double-counting checkpoints", () => {
    store.begin("001");
    const state = {
      score: 120,
      level: 2,
      lives: 3,
      status: "playing" as const,
      elapsed: 10,
    };
    store.record("001", state, "session1");
    store.record("001", { ...state, elapsed: 15 }, "session1");
    store.record("001", { ...state, elapsed: 15, status: "over" }, "session1");
    store.record("001", { ...state, elapsed: 15, status: "over" }, "session1");
    expect(store.get().stats["001"]).toMatchObject({
      highScore: 120,
      seconds: 15,
      played: 1,
      completed: 1,
      bestLevel: 2,
    });
    store.begin("001");
    store.record("001", { ...state, score: 10, elapsed: 5 }, "session2");
    expect(store.get().stats["001"].highScore).toBe(120);
    expect(store.get().stats["001"].seconds).toBe(20);
    expect(store.get().history).toHaveLength(2);
  });
  it("round-trips valid settings and rejects unsafe or invalid values", () => {
    expect(
      parseSettings(JSON.stringify({ version: 1, settings: defaults })),
    ).toEqual(defaults);
    for (const settings of [
      { master: -10 },
      { theme: "neon" },
      { uiScale: 1000 },
      { mappings: { a: "<script>" } },
    ])
      expect(() =>
        parseSettings(JSON.stringify({ version: 1, settings })),
      ).toThrow();
    expect(() => parseSettings("{")).toThrow();
    expect(() => parseSettings("{}")).toThrow();
  });
  it("recovers settings and scores when the module reloads", async () => {
    store.favorite("003");
    store.begin("003");
    store.record(
      "003",
      { score: 300, level: 2, lives: 0, status: "over", elapsed: 22 },
      "reload",
    );
    vi.resetModules();
    const reloaded = await import("../src/storage/store");
    expect(reloaded.store.get().favorites).toContain("003");
    expect(reloaded.store.get().stats["003"].highScore).toBe(300);
  });
});
