export const difficulties = ["easy", "normal", "hard"] as const;
export type Difficulty = (typeof difficulties)[number];
export const difficultyLabel: Record<Difficulty, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
};
export const isDifficulty = (value: unknown): value is Difficulty =>
  difficulties.includes(value as Difficulty);
// Mechanics are tuned independently. Player input cadence never changes with difficulty.
export const blockRules = {
  easy: { fall: 0.98, minFall: 0.14, acceleration: 0.035, linesPerLevel: 14 },
  normal: { fall: 0.72, minFall: 0.09, acceleration: 0.055, linesPerLevel: 10 },
  hard: { fall: 0.43, minFall: 0.065, acceleration: 0.055, linesPerLevel: 6 },
};
export const snakeRules = {
  easy: {
    interval: 0.31,
    minInterval: 0.12,
    acceleration: 0.01,
    foodPerLevel: 6,
  },
  normal: {
    interval: 0.24,
    minInterval: 0.075,
    acceleration: 0.014,
    foodPerLevel: 4,
  },
  hard: {
    interval: 0.17,
    minInterval: 0.065,
    acceleration: 0.017,
    foodPerLevel: 3,
  },
};
export const racingRules = {
  easy: {
    speed: 3.6,
    acceleration: 0.45,
    spawn: 2.15,
    minSpawn: 0.85,
    spawnProgress: 0.06,
    scorePerLevel: 700,
  },
  normal: {
    speed: 5,
    acceleration: 0.75,
    spawn: 1.6,
    minSpawn: 0.5,
    spawnProgress: 0.08,
    scorePerLevel: 500,
  },
  hard: {
    speed: 7,
    acceleration: 0.9,
    spawn: 1.12,
    minSpawn: 0.5,
    spawnProgress: 0.055,
    scorePerLevel: 350,
  },
};
export const shooterRules = {
  easy: {
    rows: 2,
    move: 0.82,
    minMove: 0.2,
    fire: 1.8,
    minFire: 0.65,
    bullet: 5,
    lives: 4,
  },
  normal: {
    rows: 3,
    move: 0.65,
    minMove: 0.12,
    fire: 1.2,
    minFire: 0.35,
    bullet: 8,
    lives: 3,
  },
  hard: {
    rows: 4,
    move: 0.44,
    minMove: 0.1,
    fire: 0.8,
    minFire: 0.25,
    bullet: 11,
    lives: 2,
  },
};
export const breakerRules = {
  easy: {
    ball: 5.2,
    paddle: 5,
    rows: 4,
    forgiveness: 0.85,
    shift: 4.2,
    lives: 4,
  },
  normal: { ball: 7, paddle: 4, rows: 5, forgiveness: 0.6, shift: 3, lives: 3 },
  hard: {
    ball: 9.4,
    paddle: 3,
    rows: 7,
    forgiveness: 0.25,
    shift: 1.8,
    lives: 2,
  },
};
export const mazeRules = {
  easy: { width: 11, height: 17 },
  normal: { width: 15, height: 25 },
  hard: { width: 19, height: 31 },
};
export const pongRules = {
  easy: { ball: 5.5, paddle: 5, aiInterval: 0.22, aiTolerance: 2.2, lives: 4 },
  normal: { ball: 7, paddle: 4, aiInterval: 0.12, aiTolerance: 1.5, lives: 3 },
  hard: { ball: 9, paddle: 3, aiInterval: 0.07, aiTolerance: 0.6, lives: 2 },
};
export const dodgerRules = {
  easy: { speed: 3.7, spawn: 1.05, minSpawn: 0.35, levelSeconds: 23 },
  normal: { speed: 5, spawn: 0.7, minSpawn: 0.13, levelSeconds: 15 },
  hard: { speed: 6.5, spawn: 0.47, minSpawn: 0.13, levelSeconds: 10 },
};
export const memoryRules = {
  easy: {
    initialLength: 1,
    flash: 0.64,
    gap: 0.26,
    lives: 4,
    responseLimit: 0,
  },
  normal: {
    initialLength: 1,
    flash: 0.48,
    gap: 0.22,
    lives: 3,
    responseLimit: 0,
  },
  hard: {
    initialLength: 3,
    flash: 0.28,
    gap: 0.18,
    lives: 2,
    responseLimit: 5,
  },
};
export const difficultyNotes: Record<string, Record<Difficulty, string>> = {
  "001": {
    easy: "Slower drops · 14 lines per level",
    normal: "Classic drops · 10 lines per level",
    hard: "Fast drops · 6 lines per level",
  },
  "002": {
    easy: "A steady pace · gradual growth in speed",
    normal: "Classic pace · faster every 4 foods",
    hard: "Quick turns · faster every 3 foods",
  },
  "003": {
    easy: "Wide paddle · slower ball · 4 lives",
    normal: "Classic paddle · 3 lives",
    hard: "Narrow paddle · faster ball · 2 lives",
  },
  "004": {
    easy: "Light traffic · more room to react",
    normal: "Three lanes · steady traffic",
    hard: "Fast traffic · shorter gaps",
  },
  "005": {
    easy: "2 enemy rows · gentler return fire",
    normal: "3 enemy rows · regular return fire",
    hard: "4 enemy rows · heavy return fire",
  },
  "006": {
    easy: "11 × 17 maze · fewer decisions",
    normal: "15 × 25 maze · classic challenge",
    hard: "19 × 31 maze · longer paths",
  },
  "007": {
    easy: "Wide paddle · forgiving opponent",
    normal: "Classic paddle · balanced opponent",
    hard: "Narrow paddle · sharp opponent",
  },
  "008": {
    easy: "Sparse obstacles · gradual progression",
    normal: "Steady obstacles · regular progression",
    hard: "Dense obstacles · rapid progression",
  },
  "009": {
    easy: "Wide paddle · wall shifts every 4.2s",
    normal: "Classic paddle · wall shifts every 3s",
    hard: "Narrow paddle · wall shifts every 1.8s",
  },
  "010": {
    easy: "Long flashes · 4 chances",
    normal: "Classic sequence · 3 chances",
    hard: "Starts with 3 · 5s per answer · 2 chances",
  },
};
