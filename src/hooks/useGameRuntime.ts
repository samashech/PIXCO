import { resolveLCD } from "../themes/catalog";
import { fitGrid } from "../lcd/sizing";
import type { Difficulty } from "../games/difficulty";
import { useEffect, useRef, useState } from "react";
import type {
  GameDefinition,
  GameFrame,
  Input,
  Snapshot,
} from "../games/engine/types";
import { GameClock } from "../games/engine/clock";
import { HeldInput, repeatProfile } from "../input/held-input";
import { gamepadInputs, keyboardInput } from "../input/controls";
import { renderLCD } from "../lcd/renderer";
import { previewFrame } from "../games/previews";
import { synth } from "../audio/synth";
import { store, type Settings } from "../storage/store";
export type GameCommand = (input: Input) => void;
type Hud = Snapshot & { label: string; fps: number };
const initialHud: Hud = {
  score: 0,
  level: 1,
  lives: 3,
  status: "ready",
  elapsed: 0,
  label: "",
  fps: 0,
};
interface RuntimeOptions {
  game: GameDefinition;
  difficulty: Difficulty;
  settings: Settings;
  commandRef: React.RefObject<GameCommand | null>;
  board: React.RefObject<HTMLCanvasElement | null>;
  next: React.RefObject<HTMLCanvasElement | null>;
  hardware: React.RefObject<HTMLDivElement | null>;
  onMenu: () => void;
  immersive: boolean;
  transitioning: () => boolean;
}
export function useGameRuntime(options: RuntimeOptions) {
  const { game, difficulty, commandRef, board, next, hardware } = options;
  const current = useRef(options);
  current.current = options;
  const [hud, setHud] = useState<Hud>(initialHud);
  const held = useRef<HeldInput | null>(null);
  useEffect(() => {
    const engine = game.create((name) => synth.play(name), difficulty);
    engine.init();
    const preview = game.id === "001" ? previewFrame(game) : engine.render(),
      clock = new GameClock();
    let session = "",
      raf = 0,
      last = 0,
      saveTime = 0,
      hudTime = 0,
      fpsTime = 0,
      frames = 0,
      measuredFps = 60;
    let lastHud: Hud | undefined,
      previousPad = new Set<Input>();
    const save = () => {
      if (session) store.record(game.id, engine.state, session, difficulty);
    };
    const paint = (): GameFrame => {
      const settings = current.current.settings,
        frame = engine.state.status === "ready" ? preview : engine.render();
      if (board.current) {
        const fullscreen = current.current.immersive;
        const bounds = fullscreen
          ? {
              width: Math.max(
                40,
                window.innerWidth - (window.innerWidth < 600 ? 114 : 210),
              ),
              height: Math.max(80, window.innerHeight - 140),
            }
          : { width: 80, height: 160 };
        const fitted = fitGrid(
          frame.width,
          frame.height,
          bounds.width,
          bounds.height,
          window.devicePixelRatio || 1,
          fullscreen || settings.screenScaling === "integer",
        );
        renderLCD(
          board.current,
          frame,
          resolveLCD(settings),
          settings.effect,
          Math.max(1, Math.round(fitted.unit * (window.devicePixelRatio || 1))),
          settings.pixelSize,
        );
        const width = `${fitted.width}px`,
          height = `${fitted.height}px`;
        if (board.current.style.width !== width)
          board.current.style.width = width;
        if (board.current.style.height !== height)
          board.current.style.height = height;
      }
      if (next.current)
        renderLCD(
          next.current,
          { width: 4, height: 4, pixels: frame.next ?? [] },
          resolveLCD(settings),
          settings.effect,
          7,
        );
      return frame;
    };
    const publish = (frame: GameFrame) => {
      const value: Hud = {
        ...engine.state,
        elapsed: Math.floor(engine.state.elapsed),
        label: frame.label ?? "",
        fps: current.current.settings.fps ? measuredFps : 0,
      };
      if (
        !lastHud ||
        Object.keys(value).some(
          (key) => value[key as keyof Hud] !== lastHud![key as keyof Hud],
        )
      ) {
        lastHud = value;
        setHud(value);
      }
    };
    const send: GameCommand = (input) => {
      if (
        input === "menu" ||
        (input === "b" && engine.state.status === "over")
      ) {
        engine.pause();
        save();
        current.current.onMenu();
        return;
      }
      const before = engine.state.status;
      if (
        input === "restart" ||
        (before === "over" && ["start", "a"].includes(input))
      ) {
        save();
        session = "";
        clock.reset();
      }
      engine.handleInput(input);
      if (engine.state.status === "playing" && !session) {
        session = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
        store.begin(game.id, difficulty);
      }
      if (before === "playing" && engine.state.status !== "playing") {
        held.current?.clear();
        save();
      }
      // Paint on the input event itself. React is only notified after the pixels change.
      publish(paint());
    };
    const controls = new HeldInput(
      repeatProfile(game.id),
      send,
      (input, down) => {
        hardware.current
          ?.querySelectorAll(`[data-input="${input}"]`)
          .forEach((button) => button.classList.toggle("depressed", down));
      },
    );
    held.current = controls;
    commandRef.current = send;
    const keydown = (event: KeyboardEvent) => {
      const input = keyboardInput(event, current.current.settings.mappings);
      if (!input) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("button,a") &&
        event.code === "Enter"
      )
        return;
      event.preventDefault();
      if (event.repeat) return;
      controls.press(`key:${event.code}`, input);
    };
    const keyup = (event: KeyboardEvent) =>
      controls.release(`key:${event.code}`);
    const blur = () => {
      controls.clear();
      if (current.current.transitioning() && !document.hidden) return;
      previousPad.clear();
      clock.reset();
      last = 0;
      if (current.current.settings.autoPause) {
        engine.pause();
        publish(paint());
        save();
      }
    };
    const visibility = () => {
      if (document.hidden) blur();
    };
    const unsubscribeNative = window.pixcoDesktop?.onPause(blur);
    const loop = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      try {
        const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean),
          inputs = new Set(
            pad ? gamepadInputs(pad, current.current.settings.swapButtons) : [],
          );
        for (const input of previousPad)
          if (!inputs.has(input)) controls.release(`pad:${input}`);
        for (const input of inputs)
          if (!previousPad.has(input)) controls.press(`pad:${input}`, input);
        previousPad = inputs;
      } catch {
        /* Controllers are optional. */
      }
      clock.advance(dt, (step) => {
        if (engine.state.status === "playing") controls.update(step);
        engine.update(step);
      });
      const frame = paint();
      hudTime += dt;
      saveTime += dt;
      fpsTime += dt;
      frames++;
      if (fpsTime >= 1) {
        measuredFps = Math.round(frames / fpsTime);
        fpsTime = 0;
        frames = 0;
      }
      if (hudTime >= 0.1 || engine.state.status !== lastHud?.status) {
        publish(frame);
        hudTime = 0;
      }
      if (saveTime >= 5) {
        save();
        saveTime = 0;
      }
      if (engine.state.status === "over" && session) {
        save();
        session = "";
        controls.clear();
      }
      raf = requestAnimationFrame(loop);
    };
    publish(paint());
    board.current?.focus({ preventScroll: true });
    raf = requestAnimationFrame(loop);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      save();
      controls.clear();
      cancelAnimationFrame(raf);
      unsubscribeNative?.();
      engine.destroy();
      commandRef.current = null;
      held.current = null;
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [game, difficulty, commandRef, board, next, hardware]);
  return {
    hud,
    press: (source: string, input: Input) => held.current?.press(source, input),
    release: (source: string) => held.current?.release(source),
  };
}
