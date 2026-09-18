import type { GameDefinition } from "./engine/types";
import { FallingBlocks } from "./falling-blocks";
import { Snake } from "./snake";
import { BrickBreaker } from "./breaker";
import { Racing } from "./racing";
import { SpaceShooter } from "./shooter";
import { Maze } from "./maze";
import { Pong } from "./pong";
import { Dodger } from "./dodger";
import { Memory } from "./memory";
const move = [{ key: "← →", action: "Move" }],
  arrows = [{ key: "↑ ↓ ← →", action: "Move" }];
export const games: GameDefinition[] = [
  {
    id: "001",
    title: "Falling Blocks",
    shortDescription:
      "A familiar rhythm. An empty row. One more try. Stack, rotate, and make every block count.",
    category: "Puzzle",
    tags: ["brick", "classic", "stack", "tetris"],
    controls: [
      ...move,
      { key: "↑ / Z", action: "Rotate" },
      { key: "↓", action: "Soft drop" },
      { key: "X", action: "Hard drop" },
    ],
    version: "1.0.0",
    create: (s, d) => new FallingBlocks(s, d),
  },
  {
    id: "002",
    title: "Snake",
    shortDescription:
      "One little pixel with a big appetite. Find the food, grow your snake, and keep away from the walls—and yourself.",
    category: "Classic",
    tags: ["food", "grid", "retro"],
    controls: arrows,
    version: "1.0.0",
    create: (s, d) => new Snake(s, d),
  },
  {
    id: "003",
    title: "Brick Breaker",
    shortDescription:
      "A paddle, a ball, and a wall that needs taking down. Clear every brick. You have three chances.",
    category: "Arcade",
    tags: ["paddle", "ball", "breakout"],
    controls: [...move, { key: "Z / X", action: "Quick slide" }],
    version: "1.0.0",
    create: (s, d) => new BrickBreaker(s, false, d),
  },
  {
    id: "004",
    title: "Highway Racer",
    shortDescription:
      "Three lanes. No brakes. Weave through traffic as the highway gets faster. Keep your eyes on the road.",
    category: "Racing",
    tags: ["racing", "race", "car", "traffic", "dodge"],
    controls: [...move],
    version: "1.0.0",
    create: (s, d) => new Racing(s, d),
  },
  {
    id: "005",
    title: "Space Shooter",
    shortDescription:
      "The entire galaxy, in a handful of pixels. Clear the invaders before they reach you. Watch for return fire.",
    category: "Shooting",
    tags: ["space", "alien", "invaders", "shoot"],
    controls: [...move, { key: "Z / ↑", action: "Fire" }],
    version: "1.0.0",
    create: (s, d) => new SpaceShooter(s, d),
  },
  {
    id: "006",
    title: "Maze Runner",
    shortDescription:
      "A new maze every round. Find your way from the top corner to the flashing exit. Fewer steps means more points.",
    category: "Puzzle",
    tags: ["maze", "labyrinth", "path"],
    controls: arrows,
    version: "1.0.0",
    create: (s, d) => new Maze(s, d),
  },
  {
    id: "007",
    title: "Pocket Pong",
    shortDescription:
      "The oldest rivalry on a tiny screen. Send the ball past the other paddle. Three misses and the match is over.",
    category: "Sports",
    tags: ["pong", "paddle", "tennis", "ball"],
    controls: move,
    version: "1.0.0",
    create: (s, d) => new Pong(s, d),
  },
  {
    id: "008",
    title: "Pixel Dodger",
    shortDescription:
      "Everything is falling. You probably should move. Stay out of the way and see how long you can last.",
    category: "Arcade",
    tags: ["dodge", "survival", "avoid", "falling"],
    controls: [...move, { key: "Z / X", action: "Dash left / right" }],
    version: "1.0.0",
    create: (s, d) => new Dodger(s, d),
  },
  {
    id: "009",
    title: "Shifting Bricks",
    shortDescription:
      "Just when you line up your shot, the wall moves. A sideways twist on the paddle-and-ball classic.",
    category: "Arcade",
    tags: ["brick", "breakout", "paddle", "moving"],
    controls: [...move, { key: "Z / X", action: "Quick slide" }],
    version: "1.0.0",
    create: (s, d) => new BrickBreaker(s, true, d),
  },
  {
    id: "010",
    title: "Memory Loop",
    shortDescription:
      "Watch the four pads light up, then repeat the sequence with the arrow keys. One more flash every round.",
    category: "Puzzle",
    tags: ["memory", "pattern", "simon", "sequence"],
    controls: [{ key: "↑ ↓ ← →", action: "Repeat the pattern" }],
    version: "1.0.0",
    create: (s, d) => new Memory(s, d),
  },
];
export const getGame = (id: string) =>
  games.find((game) => game.id === id) ?? games[0];
