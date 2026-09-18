import { isDifficulty, type Difficulty } from "../games/difficulty";
import { useSyncExternalStore } from "react";
import { defaultMappings } from "../input/controls";
import type { Snapshot } from "../games/engine/types";
import { defaults, type Settings } from "./settings";
import { parseSettings } from "./validation";
export { defaults } from "./settings";
export type { Settings } from "./settings";
export interface Stats {
  highScore: number;
  bestLevel: number;
  played: number;
  completed: number;
  seconds: number;
  lastPlayed: string;
}
export interface Session {
  id: string;
  gameId: string;
  difficulty: Difficulty;
  score: number;
  level: number;
  seconds: number;
  date: string;
  completed: boolean;
}
export interface Data {
  schemaVersion: 2;
  difficulties: Record<string, Difficulty>;
  records: Record<string, Partial<Record<Difficulty, Stats>>>;
  settings: Settings;
  favorites: string[];
  recent: string[];
  stats: Record<string, Stats>;
  history: Session[];
  selected: string;
}
const emptyData = (): Data => ({
  schemaVersion: 2,
  difficulties: {},
  records: {},
  settings: { ...defaults, mappings: { ...defaultMappings } },
  favorites: [],
  recent: [],
  stats: {},
  history: [],
  selected: "001",
});
export const emptyStats: Stats = {
  highScore: 0,
  bestLevel: 1,
  played: 0,
  completed: 0,
  seconds: 0,
  lastPlayed: "",
};
function sanitizeStats(value: unknown): Stats {
  const stats = { ...emptyStats };
  if (!value || typeof value !== "object") return stats;
  const source = value as Record<string, unknown>;
  for (const key of [
    "highScore",
    "bestLevel",
    "played",
    "completed",
    "seconds",
  ] as const)
    if (
      typeof source[key] === "number" &&
      Number.isFinite(source[key]) &&
      source[key] >= 0
    )
      stats[key] = source[key];
  if (
    typeof source.lastPlayed === "string" &&
    !Number.isNaN(Date.parse(source.lastPlayed))
  )
    stats.lastPlayed = source.lastPlayed;
  return stats;
}
export const selectedDifficulty = (data: Data, id: string): Difficulty =>
  data.difficulties[id] ?? "normal";
export const gameStats = (
  data: Data,
  id: string,
  difficulty: Difficulty = selectedDifficulty(data, id),
): Stats => data.records[id]?.[difficulty] ?? emptyStats;
export const STORAGE_KEY = "pixco.v1";
let storageAvailable = true;
function read(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyData();
    const clean = emptyData();
    const ids = (value: unknown) =>
      Array.isArray(value)
        ? [
            ...new Set(
              value.filter(
                (id): id is string =>
                  typeof id === "string" && /^\d{3}$/.test(id),
              ),
            ),
          ]
        : [];
    clean.favorites = ids(parsed.favorites);
    clean.recent = ids(parsed.recent).slice(0, 20);
    if (typeof parsed.selected === "string" && /^\d{3}$/.test(parsed.selected))
      clean.selected = parsed.selected;
    try {
      clean.settings = parseSettings(
        JSON.stringify({ version: 1, settings: parsed.settings ?? {} }),
      );
    } catch {
      /* Recover display defaults without discarding scores. */
    }
    if (parsed.stats && typeof parsed.stats === "object")
      for (const [id, value] of Object.entries(parsed.stats)) {
        if (/^\d{3}$/.test(id)) clean.stats[id] = sanitizeStats(value);
      }
    if (parsed.difficulties && typeof parsed.difficulties === "object")
      for (const [id, value] of Object.entries(parsed.difficulties)) {
        if (/^\d{3}$/.test(id) && isDifficulty(value))
          clean.difficulties[id] = value;
      }
    if (parsed.schemaVersion === 2) {
      if (parsed.records && typeof parsed.records === "object")
        for (const [id, value] of Object.entries(parsed.records)) {
          if (!/^\d{3}$/.test(id) || !value || typeof value !== "object")
            continue;
          clean.records[id] = {};
          for (const [difficulty, stats] of Object.entries(value))
            if (isDifficulty(difficulty))
              clean.records[id][difficulty] = sanitizeStats(stats);
        }
    } else {
      // Legacy runs used the original rules, now called Normal. Never copy them to Easy or Hard.
      clean.records = Object.fromEntries(
        Object.entries(clean.stats).map(([id, stats]) => [
          id,
          { normal: { ...stats } },
        ]),
      );
    }
    if (Array.isArray(parsed.history))
      clean.history = parsed.history
        .filter((entry: unknown): entry is Session => {
          if (!entry || typeof entry !== "object") return false;
          const e = entry as Record<string, unknown>;
          return (
            typeof e.id === "string" &&
            typeof e.gameId === "string" &&
            /^\d{3}$/.test(e.gameId) &&
            typeof e.date === "string" &&
            !Number.isNaN(Date.parse(e.date)) &&
            typeof e.completed === "boolean" &&
            ["score", "level", "seconds"].every(
              (key) =>
                typeof e[key] === "number" &&
                Number.isFinite(e[key]) &&
                e[key] >= 0,
            )
          );
        })
        .map((entry: Session) => ({
          ...entry,
          difficulty: isDifficulty(entry.difficulty)
            ? entry.difficulty
            : ("normal" as const),
        }))
        .slice(0, 200);
    return clean;
  } catch {
    storageAvailable = false;
    return emptyData();
  }
}
let data = read();
const listeners = new Set<() => void>();
function write(next: Data) {
  data = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  listeners.forEach((listener) => listener());
}
export const store = {
  get: () => data,
  available: () => storageAvailable,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  settings: (settings: Partial<Settings>) =>
    write({ ...data, settings: { ...data.settings, ...settings } }),
  difficulty: (id: string, difficulty: Difficulty) =>
    write({
      ...data,
      difficulties: { ...data.difficulties, [id]: difficulty },
    }),
  select: (id: string) => write({ ...data, selected: id }),
  favorite: (id: string) =>
    write({
      ...data,
      favorites: data.favorites.includes(id)
        ? data.favorites.filter((x) => x !== id)
        : [...data.favorites, id],
    }),
  begin: (id: string, difficulty: Difficulty = "normal") => {
    const record = gameStats(data, id, difficulty);
    const stats = data.stats[id] ?? emptyStats;
    write({
      ...data,
      records: {
        ...data.records,
        [id]: {
          ...data.records[id],
          [difficulty]: {
            ...record,
            played: record.played + 1,
            lastPlayed: new Date().toISOString(),
          },
        },
      },
      recent: [id, ...data.recent.filter((x) => x !== id)].slice(0, 20),
      stats: {
        ...data.stats,
        [id]: {
          ...stats,
          played: stats.played + 1,
          lastPlayed: new Date().toISOString(),
        },
      },
    });
  },
  record: (
    id: string,
    snapshot: Snapshot,
    sessionId: string,
    difficulty: Difficulty = "normal",
  ) => {
    const record = gameStats(data, id, difficulty);
    const old = data.stats[id] ?? emptyStats,
      previous = data.history.find((s) => s.id === sessionId),
      completed = snapshot.status === "over";
    const session: Session = {
      id: sessionId,
      gameId: id,
      difficulty,
      score: snapshot.score,
      level: snapshot.level,
      seconds: snapshot.elapsed,
      date: new Date().toISOString(),
      completed,
    };
    write({
      ...data,
      records: {
        ...data.records,
        [id]: {
          ...data.records[id],
          [difficulty]: {
            ...record,
            highScore: Math.max(record.highScore, snapshot.score),
            bestLevel: Math.max(record.bestLevel, snapshot.level),
            seconds:
              record.seconds +
              Math.max(0, snapshot.elapsed - (previous?.seconds ?? 0)),
            completed:
              record.completed + (completed && !previous?.completed ? 1 : 0),
          },
        },
      },
      stats: {
        ...data.stats,
        [id]: {
          ...old,
          highScore: Math.max(old.highScore, snapshot.score),
          bestLevel: Math.max(old.bestLevel, snapshot.level),
          seconds:
            old.seconds +
            Math.max(0, snapshot.elapsed - (previous?.seconds ?? 0)),
          completed:
            old.completed + (completed && !previous?.completed ? 1 : 0),
        },
      },
      history: [
        session,
        ...data.history.filter((s) => s.id !== sessionId),
      ].slice(0, 200),
    });
  },
  reset: (kind: "scores" | "favorites" | "statistics") => {
    if (kind === "favorites") write({ ...data, favorites: [] });
    if (kind === "scores")
      write({
        ...data,
        records: Object.fromEntries(
          Object.entries(data.records).map(([id, records]) => [
            id,
            Object.fromEntries(
              Object.entries(records).map(([difficulty, s]) => [
                difficulty,
                { ...s, highScore: 0, bestLevel: 1 },
              ]),
            ),
          ]),
        ),
        stats: Object.fromEntries(
          Object.entries(data.stats).map(([id, s]) => [
            id,
            { ...s, highScore: 0, bestLevel: 1 },
          ]),
        ),
      });
    if (kind === "statistics")
      write({
        ...data,
        history: [],
        recent: [],
        records: Object.fromEntries(
          Object.entries(data.records).map(([id, records]) => [
            id,
            Object.fromEntries(
              Object.entries(records).map(([difficulty, s]) => [
                difficulty,
                {
                  ...emptyStats,
                  highScore: s.highScore,
                  bestLevel: s.bestLevel,
                },
              ]),
            ),
          ]),
        ),
        stats: Object.fromEntries(
          Object.entries(data.stats).map(([id, s]) => [
            id,
            { ...emptyStats, highScore: s.highScore, bestLevel: s.bestLevel },
          ]),
        ),
      });
  },
};
export function useStore() {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
export const formatScore = (n: number) => n.toLocaleString("en-IN");
export const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
