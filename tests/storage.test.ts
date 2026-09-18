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

describe("difficulty records", () => {
  it("remembers selections and isolates Easy, Normal, and Hard scores", () => {
    const run = {
      score: 100,
      level: 2,
      lives: 0,
      status: "over" as const,
      elapsed: 5,
    };
    store.difficulty("001", "hard");
    store.begin("001", "hard");
    store.record("001", run, "hard-run", "hard");
    store.begin("001", "easy");
    store.record("001", { ...run, score: 9999 }, "easy-run", "easy");
    expect(store.get().difficulties["001"]).toBe("hard");
    expect(store.get().records["001"].hard?.highScore).toBe(100);
    expect(store.get().records["001"].easy?.highScore).toBe(9999);
    expect(
      store.get().history.find((s) => s.id === "hard-run")?.difficulty,
    ).toBe("hard");
    store.reset("statistics");
    expect(store.get().records["001"].hard?.highScore).toBe(100);
    expect(store.get().records["001"].hard?.played).toBe(0);
    store.reset("scores");
    expect(store.get().records["001"].hard?.highScore).toBe(0);
  });
  it("migrates legacy scores and sessions to Normal once without losing favorites", async () => {
    backing.set(
      STORAGE_KEY,
      JSON.stringify({
        favorites: ["002"],
        settings: { theme: "amber" },
        stats: {
          "001": {
            highScore: 450,
            bestLevel: 3,
            played: 2,
            completed: 1,
            seconds: 20,
            lastPlayed: new Date().toISOString(),
          },
        },
        history: [
          {
            id: "old",
            gameId: "001",
            score: 450,
            level: 3,
            seconds: 20,
            completed: true,
            date: new Date().toISOString(),
          },
        ],
      }),
    );
    vi.resetModules();
    const first = await import("../src/storage/store");
    expect(first.store.get().records["001"].normal?.highScore).toBe(450);
    expect(first.store.get().records["001"].easy).toBeUndefined();
    expect(first.store.get().favorites).toEqual(["002"]);
    expect(first.store.get().history[0].difficulty).toBe("normal");
    expect(first.store.get().settings.theme).toBe("amber");
    first.store.settings({ appearance: "paper" });
    vi.resetModules();
    const again = await import("../src/storage/store");
    expect(again.store.get().records["001"].normal?.played).toBe(2);
    expect(again.store.get().settings.appearance).toBe("paper");
    expect(again.store.get().schemaVersion).toBe(2);
  });
});
