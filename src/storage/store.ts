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
  score: number;
  level: number;
  seconds: number;
  date: string;
  completed: boolean;
}
export interface Data {
  settings: Settings;
  favorites: string[];
  recent: string[];
  stats: Record<string, Stats>;
  history: Session[];
  selected: string;
}
const emptyData = (): Data => ({
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
export const STORAGE_KEY = "brickbox.v1";
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
        if (!/^\d{3}$/.test(id) || !value || typeof value !== "object")
          continue;
        const source = value as Record<string, unknown>,
          stats = { ...emptyStats };
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
        clean.stats[id] = stats;
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
  select: (id: string) => write({ ...data, selected: id }),
  favorite: (id: string) =>
    write({
      ...data,
      favorites: data.favorites.includes(id)
        ? data.favorites.filter((x) => x !== id)
        : [...data.favorites, id],
    }),
  begin: (id: string) => {
    const stats = data.stats[id] ?? emptyStats;
    write({
      ...data,
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
  record: (id: string, snapshot: Snapshot, sessionId: string) => {
    const old = data.stats[id] ?? emptyStats,
      previous = data.history.find((s) => s.id === sessionId),
      completed = snapshot.status === "over";
    const session: Session = {
      id: sessionId,
      gameId: id,
      score: snapshot.score,
      level: snapshot.level,
      seconds: snapshot.elapsed,
      date: new Date().toISOString(),
      completed,
    };
    write({
      ...data,
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
