import { useEffect, useRef, useState } from "react";
import type {
  GameDefinition,
  GameEngine,
  Input,
  Snapshot,
} from "../games/engine/types";
import { renderLCD, themes } from "../lcd/renderer";
import { previewFrame } from "../games/previews";
import { synth } from "../audio/synth";
import { gamepadInputs, keyboardInput } from "../input/controls";
import { store, useStore } from "../storage/store";
import { Icon, type IconName } from "./Icon";
export type GameCommand = (input: Input) => void;
export function Handheld({
  game,
  commandRef,
  onMenu,
}: {
  game: GameDefinition;
  commandRef: React.RefObject<GameCommand | null>;
  onMenu: () => void;
}) {
  const { settings, stats } = useStore();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const board = useRef<HTMLCanvasElement>(null),
    next = useRef<HTMLCanvasElement>(null),
    engineRef = useRef<GameEngine | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>({
    score: 0,
    level: 1,
    lives: 3,
    status: "ready",
    elapsed: 0,
  });
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = null;
  };
  useEffect(() => clearHold, []);
  const [pressed, setPressed] = useState<Input | null>(null);
  const [fps, setFps] = useState(60);
  const [label, setLabel] = useState("");
  const [powered, setPowered] = useState(false);
  const menuRef = useRef(onMenu);
  menuRef.current = onMenu;
  useEffect(() => {
    const power = setTimeout(() => setPowered(true), 350);
    const engine = game.create((name) => synth.play(name));
    engine.init();
    engineRef.current = engine;
    board.current?.focus({ preventScroll: true });
    const preview = previewFrame(game);
    let session = "",
      raf = 0,
      last = 0,
      accumulator = 0,
      uiTime = 0,
      saveTime = 0,
      frames = 0;
    let previousPad = new Set<Input>();
    let padRepeat = 0;
    let pressTimer: ReturnType<typeof setTimeout>;
    const save = () => {
      if (session) store.record(game.id, engine.state, session);
    };
    const send: GameCommand = (input) => {
      synth.play("click");
      setPressed(input);
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => setPressed(null), 140);
      if (
        input === "menu" ||
        (input === "b" && engine.state.status === "over")
      ) {
        engine.pause();
        menuRef.current();
        return;
      }
      const before = engine.state.status;
      const restarting =
        input === "restart" ||
        (before === "over" && ["start", "a"].includes(input));
      if (restarting) {
        save();
        session = "";
      }
      engine.handleInput(input);
      if (engine.state.status === "playing" && !session) {
        session =
          crypto.randomUUID?.() ??
          `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        store.begin(game.id);
      }
      if (before === "playing" && engine.state.status === "paused") save();
      setSnapshot({ ...engine.state });
    };
    commandRef.current = send;
    const keydown = (event: KeyboardEvent) => {
      const input = keyboardInput(event, settingsRef.current.mappings);
      if (!input) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("button,a") &&
        (input === "start" || input === "a")
      )
        return;
      event.preventDefault();
      if (event.repeat && !["left", "right", "down", "up"].includes(input))
        return;
      send(input);
    };
    const blur = () => {
      clearHold();
      if (settingsRef.current.autoPause) {
        engine.pause();
        setSnapshot({ ...engine.state });
        save();
      }
    };
    const unsubscribeNative = window.brickboxDesktop?.onPause(blur);
    const visibility = () => {
      if (document.hidden) blur();
    };
    const loop = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      accumulator += dt;
      uiTime += dt;
      saveTime += dt;
      frames++;
      while (accumulator >= 1 / 60) {
        engine.update(1 / 60);
        accumulator -= 1 / 60;
      }
      try {
        const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
        const inputs = new Set(
          pad ? gamepadInputs(pad, settingsRef.current.swapButtons) : [],
        );
        padRepeat += dt;
        for (const input of inputs)
          if (
            !previousPad.has(input) ||
            (padRepeat > 0.15 &&
              ["left", "right", "up", "down"].includes(input))
          )
            send(input);
        if (padRepeat > 0.15) padRepeat = 0;
        previousPad = inputs;
      } catch {
        /* Optional controller support. */
      }
      const current = settingsRef.current;
      const frame = engine.state.status === "ready" ? preview : engine.render();
      if (board.current) {
        renderLCD(
          board.current,
          frame,
          current.theme,
          current.effect,
          current.pixelSize,
        );
        const pixelScale = Math.max(
          1,
          Math.floor(Math.min(80 / frame.width, 160 / frame.height)),
        );
        board.current.style.width =
          current.screenScaling === "integer"
            ? `${frame.width * pixelScale}px`
            : "80px";
        board.current.style.height =
          current.screenScaling === "integer"
            ? `${frame.height * pixelScale}px`
            : "auto";
      }
      if (next.current)
        renderLCD(
          next.current,
          { width: 4, height: 4, pixels: frame.next ?? [] },
          current.theme,
          current.effect,
          7,
        );
      if (uiTime >= 0.12) {
        setSnapshot({ ...engine.state });
        setLabel(frame.label ?? "");
        setFps(Math.round(frames / uiTime));
        uiTime = 0;
        frames = 0;
      }
      if (saveTime >= 5) {
        save();
        saveTime = 0;
      }
      if (engine.state.status === "over" && session) {
        save();
        session = "";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("keydown", keydown);
    window.addEventListener("blur", blur);
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      save();
      cancelAnimationFrame(raf);
      clearTimeout(power);
      clearTimeout(pressTimer);
      unsubscribeNative?.();
      engine.destroy();
      commandRef.current = null;
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("blur", blur);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [game, commandRef]);
  const send = (input: Input) => commandRef.current?.(input);
  const key = (input: Input) =>
    settings.mappings[input].replace("Key", "").replace("Arrow", "");
  const button = (input: Input, label: string, icon?: IconName) => (
    <button
      className={`hardware-button ${input} ${pressed === input ? "depressed" : ""}`}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        clearHold();
        send(input);
        if (["up", "down", "left", "right"].includes(input))
          holdTimer.current = setInterval(() => send(input), 110);
      }}
      onPointerUp={clearHold}
      onPointerCancel={clearHold}
      onLostPointerCapture={clearHold}
      onClick={(event) => {
        if (event.detail === 0) send(input);
      }}
      aria-label={`${label} (${key(input)})`}
      title={`${label} · ${key(input)}`}
    >
      {icon ? <Icon name={icon} size={17} /> : label}
    </button>
  );
  const foreground = themes[settings.theme].foreground;
  return (
    <div className="console-scene">
      <div
        className={`device ${snapshot.status !== "ready" ? "device-playing" : ""}`}
        aria-label="Brickbox virtual handheld"
      >
        <span className="screw screw-tl" />
        <span className="screw screw-tr" />
        <div className="device-heading">
          <span>BRICKBOX</span>
          <span className="device-model">POCKET ARCADE · 01</span>
        </div>
        <div className="screen-bezel">
          <div
            className={`lcd-screen ${powered ? "powered" : ""} effect-${settings.effect}`}
            data-theme={settings.theme}
            style={{ color: foreground }}
          >
            <div className="lcd-top">
              <span>GAME {game.id}</span>
              <span className="battery">
                ▰▰▰
                <i />
              </span>
            </div>
            <div className={`lcd-content scaling-${settings.screenScaling}`}>
              <div className="board-wrap">
                <canvas
                  ref={board}
                  tabIndex={-1}
                  className="game-canvas"
                  aria-label={`${game.title} game board`}
                />
                {snapshot.status !== "playing" && (
                  <div className={`lcd-overlay ${snapshot.status}`}>
                    <b>
                      {!powered
                        ? "8888"
                        : snapshot.status === "ready"
                          ? "READY?"
                          : snapshot.status === "paused"
                            ? "PAUSED"
                            : "GAME OVER"}
                    </b>
                    {snapshot.status === "over" && (
                      <span>SCORE {snapshot.score}</span>
                    )}
                    <button onClick={() => send("start")}>
                      {snapshot.status === "ready"
                        ? "PRESS START"
                        : snapshot.status === "paused"
                          ? "RESUME"
                          : "TRY AGAIN"}{" "}
                      <span>↵</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="lcd-stats">
                <div>
                  <span>SCORE</span>
                  <b data-testid="lcd-score">
                    {String(snapshot.score).padStart(6, "0")}
                  </b>
                </div>
                <div>
                  <span>HI-SCORE</span>
                  <b>
                    {String(
                      Math.max(stats[game.id]?.highScore ?? 0, snapshot.score),
                    ).padStart(6, "0")}
                  </b>
                </div>
                <div className="lcd-level">
                  <div>
                    <span>LEVEL</span>
                    <b>{String(snapshot.level).padStart(2, "0")}</b>
                  </div>
                  <div>
                    <span>LIVES</span>
                    <b>{snapshot.lives}</b>
                  </div>
                </div>
                <div>
                  <span>{game.id === "001" ? "NEXT" : "GAME"}</span>
                  {game.id === "001" ? (
                    <canvas ref={next} />
                  ) : (
                    <b className="lcd-game-id">{game.id}</b>
                  )}
                </div>
                <div className="lcd-status-label">{label}</div>
                <div className="lcd-bottom">
                  {settings.timer
                    ? `${Math.floor(snapshot.elapsed / 60)
                        .toString()
                        .padStart(2, "0")}:${Math.floor(snapshot.elapsed % 60)
                        .toString()
                        .padStart(2, "0")}`
                    : "BRICKBOX"}
                  <span>{settings.fps ? `${fps} FPS` : "♪"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="device-subtitle">
          <span>10 GAMES. INFINITE RETRIES.</span>
          <span>DOT MATRIX</span>
        </div>
        <div className="utility-controls">
          <div>
            {button("menu", "MENU")}
            <span>SELECT</span>
          </div>
          <div>
            {button("start", snapshot.status === "playing" ? "PAUSE" : "START")}
            <span>START / PAUSE</span>
          </div>
          <div>
            {button("restart", "RESET")}
            <span>RESET</span>
          </div>
        </div>
        <div className="main-controls">
          <div className="dpad">
            <div className="dpad-base" />
            {button("up", "Up", "ArrowUp")}
            {button("left", "Left", "ArrowLeft")}
            <span className="dpad-center" />
            {button("right", "Right", "ArrowRight")}
            {button("down", "Down", "ArrowDown")}
          </div>
          <div className="action-buttons">
            <div>
              {button("b", "B")}
              <span>{key("b")}</span>
            </div>
            <div>
              {button("a", "A")}
              <span>{key("a")}</span>
            </div>
          </div>
        </div>
        <div className="device-footer">
          <div>
            <span className="power-led" /> POWER{" "}
            <span className="battery-spec">2 × AA · EST. 2012</span>
          </div>
          <div className="speaker">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <span className="screw screw-bl" />
        <span className="screw screw-br" />
      </div>
      <div className="console-shadow" />
    </div>
  );
}
