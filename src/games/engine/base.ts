import type { Difficulty } from "../difficulty";
import type { GameEngine, GameFrame, Input, Snapshot, Sound } from "./types";
export abstract class BaseGame implements GameEngine {
  state: Snapshot = {
    score: 0,
    level: 1,
    lives: 3,
    status: "ready",
    elapsed: 0,
  };
  protected tick = 0;
  constructor(
    protected sound: (name: Sound) => void = () => {},
    public readonly difficulty: Difficulty = "normal",
  ) {}
  abstract init(): void;
  abstract step(dt: number): void;
  abstract render(): GameFrame;
  abstract input(input: Input): void;
  update(dt: number) {
    if (this.state.status === "playing") {
      this.state.elapsed += dt;
      this.step(dt);
    }
  }
  handleInput(input: Input) {
    if (input === "restart") {
      this.reset();
      this.resume();
      return;
    }
    if (input === "start" || input === "pause") {
      if (this.state.status === "playing") this.pause();
      else if (this.state.status === "over") {
        this.reset();
        this.resume();
      } else this.resume();
      return;
    }
    if (this.state.status === "over" && input === "a") {
      this.reset();
      this.resume();
      return;
    }
    if (this.state.status === "playing") this.input(input);
  }
  pause() {
    if (this.state.status === "playing") this.state.status = "paused";
  }
  resume() {
    if (this.state.status !== "over") {
      this.state.status = "playing";
      this.sound("start");
    }
  }
  reset() {
    this.state = { score: 0, level: 1, lives: 3, status: "ready", elapsed: 0 };
    this.tick = 0;
    this.init();
  }
  destroy() {
    this.pause();
  }
  protected over() {
    this.state.status = "over";
    this.sound("lose");
  }
  protected score(points: number) {
    this.state.score += points;
    this.sound("score");
  }
}
