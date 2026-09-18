import { useLCDFullscreen } from "../hooks/useLCDFullscreen";
import { difficulties, difficultyLabel } from "../games/difficulty";
import { useEffect, useRef, useState } from "react";
import type { GameDefinition, Input } from "../games/engine/types";
import { resolveLCD } from "../themes/catalog";
import {
  useStore,
  selectedDifficulty,
  gameStats,
  store,
} from "../storage/store";
import { Icon, type IconName } from "./Icon";
import { useGameRuntime, type GameCommand } from "../hooks/useGameRuntime";
export type { GameCommand } from "../hooks/useGameRuntime";
export function Handheld({
  game,
  commandRef,
  onMenu,
}: {
  game: GameDefinition;
  commandRef: React.RefObject<GameCommand | null>;
  onMenu: () => void;
}) {
  const data = useStore();
  const { settings } = data;
  const difficulty = selectedDifficulty(data, game.id);
  const board = useRef<HTMLCanvasElement>(null),
    next = useRef<HTMLCanvasElement>(null),
    hardware = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const { immersive, toggle, transitioning } = useLCDFullscreen(stage);
  const {
    hud: snapshot,
    press,
    release,
  } = useGameRuntime({
    game,
    difficulty,
    settings,
    commandRef,
    board,
    next,
    hardware,
    onMenu,
    immersive,
    transitioning,
  });
  const { fps, label } = snapshot;
  const [powered, setPowered] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setPowered(true), 350);
    return () => clearTimeout(timer);
  }, []);
  const send = (input: Input) => commandRef.current?.(input);
  const key = (input: Input) =>
    settings.mappings[input].replace("Key", "").replace("Arrow", "");
  const button = (input: Input, label: string, icon?: IconName) => (
    <button
      className={`hardware-button ${input}`}
      data-input={input}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        press(`pointer:${event.pointerId}`, input);
      }}
      onPointerUp={(event) => release(`pointer:${event.pointerId}`)}
      onPointerCancel={(event) => release(`pointer:${event.pointerId}`)}
      onLostPointerCapture={(event) => release(`pointer:${event.pointerId}`)}
      onClick={(event) => {
        if (event.detail === 0) send(input);
      }}
      aria-label={`${label} (${key(input)})`}
      title={`${label} · ${key(input)}`}
    >
      {icon ? <Icon name={icon} size={17} /> : label}
    </button>
  );
  const palette = resolveLCD(settings);
  return (
    <div className="console-scene" ref={hardware}>
      <div
        className={`device ${snapshot.status !== "ready" ? "device-playing" : ""}`}
        aria-label="Pixco virtual handheld"
      >
        <span className="screw screw-tl" />
        <span className="screw screw-tr" />
        <div className="device-heading">
          <span>PIXCO</span>
          <span className="device-model">POCKET ARCADE · 01</span>
        </div>
        <div className="screen-bezel">
          <div
            ref={stage}
            className={`lcd-stage ${immersive ? "immersive" : ""}`}
            role={immersive ? "dialog" : undefined}
            aria-modal={immersive || undefined}
            aria-label={
              immersive ? `${game.title} fullscreen gameplay` : undefined
            }
          >
            <div className="immersive-toolbar">
              <span>
                GAME {game.id} / {game.title.toUpperCase()}
              </span>
              <button
                onClick={() => void toggle()}
                aria-label="Exit game fullscreen"
              >
                <Icon name="X" size={16} /> EXIT <kbd>ESC</kbd>
              </button>
            </div>
            <div
              className={`lcd-screen ${powered ? "powered" : ""} effect-${settings.effect}`}
              data-theme={settings.theme}
              style={
                {
                  "--lcd-background": palette.background,
                  "--lcd-pixel": palette.foreground,
                } as React.CSSProperties
              }
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
                      {snapshot.status === "ready" && (
                        <div className="lcd-difficulty-picker">
                          <button
                            aria-label="Previous difficulty"
                            onClick={() =>
                              store.difficulty(
                                game.id,
                                difficulties[
                                  (difficulties.indexOf(difficulty) + 2) % 3
                                ],
                              )
                            }
                          >
                            ‹
                          </button>
                          <span>
                            {difficultyLabel[difficulty].toUpperCase()}
                          </span>
                          <button
                            aria-label="Next difficulty"
                            onClick={() =>
                              store.difficulty(
                                game.id,
                                difficulties[
                                  (difficulties.indexOf(difficulty) + 1) % 3
                                ],
                              )
                            }
                          >
                            ›
                          </button>
                        </div>
                      )}
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
                        Math.max(
                          gameStats(data, game.id, difficulty).highScore,
                          snapshot.score,
                        ),
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
                  <div className="lcd-difficulty-label">
                    {difficulty.toUpperCase()}
                  </div>
                  <div className="lcd-status-label">{label}</div>
                  <div className="lcd-bottom">
                    {settings.timer
                      ? `${Math.floor(snapshot.elapsed / 60)
                          .toString()
                          .padStart(2, "0")}:${Math.floor(snapshot.elapsed % 60)
                          .toString()
                          .padStart(2, "0")}`
                      : "PIXCO"}
                    <span>{settings.fps ? `${fps} FPS` : "♪"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="immersive-footer">
              <button onClick={() => send("pause")}>
                {snapshot.status === "playing" ? "PAUSE" : "RESUME"}
              </button>
              <span>
                {difficulty.toUpperCase()} ·{" "}
                {game.controls
                  .map((control) => `${control.key} ${control.action}`)
                  .join(" / ")}
              </span>
              <button onClick={() => send("restart")}>RESTART</button>
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
