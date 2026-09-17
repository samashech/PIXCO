import { Icon } from "./Icon";
import { Handheld, type GameCommand } from "./Handheld";
import { games } from "../games/registry";
import { store, useStore, formatScore } from "../storage/store";
import type { GameDefinition } from "../games/engine/types";
import type { Page } from "../navigation";
export function PlayArea({
  page,
  game,
  command,
  navigate,
}: {
  page: Page;
  game: GameDefinition;
  command: React.RefObject<GameCommand | null>;
  navigate: (page: Page) => void;
}) {
  const data = useStore();
  const showConsole = true;
  return (
    <>
      {" "}
      {showConsole && (
        <section className={`hero ${page === "game" ? "game-hero" : ""}`}>
          <div className="hero-copy">
            <div className="hero-label">
              <span className="tiny-block">▦</span>{" "}
              {page === "home"
                ? "LESS PIXELS. MORE PLAY."
                : `GAME ${game.id} · ${game.category.toUpperCase()}`}
            </div>
            <h2>
              {page === "home" ? (
                <>
                  Small screen.
                  <br />
                  Endless <em>possibilities.</em>
                </>
              ) : (
                game.title
              )}
            </h2>
            <p>
              {page === "home" ? (
                <>
                  Remember when all you needed was two AA batteries and one more
                  try?
                  <br />
                  <br />
                  Your favorite pocket-sized pastime.
                  <br />
                  Rebuilt for the way you play today.
                </>
              ) : (
                game.shortDescription
              )}
            </p>
            <div className="hero-buttons">
              <button
                className="primary-button"
                onClick={() => command.current?.("start")}
              >
                <Icon name="Play" size={16} />
                {page === "home" ? "Let’s play" : "Start / pause"}
                <kbd>↵</kbd>
              </button>
              <button
                className="text-button"
                onClick={() => navigate("library")}
              >
                Explore games <Icon name="ArrowUpRight" size={16} />
              </button>
            </div>
            <div className="hero-features">
              <span>
                <Icon name="Gamepad2" size={14} />
                {games.length} original games
              </span>
              <i />
              <span>No coins required</span>
            </div>
            <div className="featured-game">
              <span>ON THE SCREEN</span>
              <div>
                <span className="game-number">{game.id}</span>
                <b>{game.title}</b>
                <span className="feature-classic">{game.category}</span>
                <button
                  className="icon-button"
                  aria-label="Next game"
                  onClick={() =>
                    store.select(
                      games[
                        (games.findIndex((g) => g.id === game.id) + 1) %
                          games.length
                      ].id,
                    )
                  }
                >
                  <Icon name="ArrowRight" size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="hero-console">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="device-annotation annotation-top">
              A LITTLE FAMILIAR.
              <br />A LOT MORE POSSIBLE.
              <i />
            </span>
            <Handheld
              game={game}
              commandRef={command}
              onMenu={() => navigate("library")}
            />
            <span className="device-annotation annotation-bottom">
              100% POCKET-SIZED SPIRIT
              <i />
            </span>
          </div>
          <div className="hero-bottom">
            <span>
              <i /> SYSTEM READY
            </span>
            <span>BUILT FOR ONE MORE TRY.</span>
            <span>BB—001</span>
          </div>
        </section>
      )}
      {showConsole && (
        <div className="controls-strip">
          <div>
            <Icon name="Keyboard" size={18} />
            <b>OLD-SCHOOL FEEL. NEW-SCHOOL CONTROLS.</b>
          </div>
          <div className="control-keys">
            <span>
              <kbd>←</kbd>
              <kbd>↑</kbd>
              <kbd>↓</kbd>
              <kbd>→</kbd> Move
            </span>
            <span>
              <kbd>{data.settings.mappings.a.replace("Key", "")}</kbd> Action
            </span>
            <span>
              <kbd>↵</kbd> Start / pause
            </span>
            <button
              className="fullscreen-button"
              onClick={() => {
                const hero = document.querySelector(".hero");
                if (document.fullscreenElement) void document.exitFullscreen();
                else if (hero?.requestFullscreen)
                  void hero.requestFullscreen().catch(() => {});
              }}
              aria-label="Fullscreen game"
            >
              <Icon name="Expand" size={13} />
            </button>
            <button onClick={() => navigate("settings")}>
              All controls <Icon name="ChevronRight" size={13} />
            </button>
          </div>
        </div>
      )}
      {page === "game" && (
        <section className="game-detail-bar">
          <div>
            <span className="eyebrow">HOW TO PLAY</span>
            <p>{game.shortDescription}</p>
            <div className="detail-controls">
              {game.controls.map((control) => (
                <span key={control.action}>
                  <kbd>{control.key}</kbd> {control.action}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="eyebrow">PERSONAL BEST</span>
            <b className="large-score">
              {formatScore(data.stats[game.id]?.highScore ?? 0)}
            </b>
            <button
              className="secondary-button"
              onClick={() => store.favorite(game.id)}
            >
              <Icon name="Heart" size={15} />
              {data.favorites.includes(game.id) ? "Favorited" : "Add favorite"}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
