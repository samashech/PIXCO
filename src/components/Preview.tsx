import { useEffect, useRef } from "react";
import { previewFrame } from "../games/previews";
import type { GameDefinition } from "../games/engine/types";
import { renderLCD } from "../lcd/renderer";
import { useStore } from "../storage/store";
export function Preview({ game }: { game: GameDefinition }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    { settings } = useStore();
  useEffect(() => {
    if (canvas.current)
      renderLCD(
        canvas.current,
        previewFrame(game),
        settings.theme,
        settings.effect,
        8,
      );
  }, [game, settings.theme, settings.effect]);
  return (
    <div className="game-preview" data-theme={settings.theme}>
      <div className="preview-lcd">
        <canvas ref={canvas} aria-label={`${game.title} LCD preview`} />
        <div className="preview-readout">
          <span>SCORE</span>
          <b>00000</b>
          <span>LEVEL</span>
          <b>01</b>
          <span className="preview-battery">▰▰▰</span>
        </div>
      </div>
      <span className="preview-corner">LCD · {game.id}</span>
    </div>
  );
}
