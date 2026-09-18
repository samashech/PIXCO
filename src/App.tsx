import { applyAppearance } from "./themes/catalog";
import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "./components/Icon";
import { type GameCommand } from "./components/Handheld";
import { GameCard } from "./components/GameCard";
import { games, getGame } from "./games/registry";
import { store, useStore } from "./storage/store";
import { synth } from "./audio/synth";
import { Settings } from "./pages/Settings";
import { Sidebar, Topbar } from "./components/Navigation";
import { PlayArea } from "./components/PlayArea";
import { Library } from "./pages/Library";
import { Statistics } from "./pages/Statistics";
import type { Page } from "./navigation";
import "./styles/app.css";
import "./themes/materials.css";
export default function App() {
  const [page, setPage] = useState<Page>("home");
  const data = useStore();
  const game = getGame(data.selected);
  const command = useRef<GameCommand | null>(null);
  useLayoutEffect(() => {
    applyAppearance(data.settings.appearance);
    synth.master = data.settings.master;
    synth.sfx = data.settings.sfx;
    synth.muted = data.settings.muted;
    document.documentElement.dataset.motion = String(data.settings.motion);
    document.documentElement.dataset.density = data.settings.density;
    document.documentElement.style.setProperty(
      "--ui-scale",
      String(data.settings.uiScale),
    );
  }, [data.settings]);
  const navigate = (next: Page) => {
    setPage(next);
    window.scrollTo({ top: 0 });
  };
  const select = (id: string) => {
    store.select(id);
    setPage("game");
    window.scrollTo({ top: 0, behavior: "smooth" });
    synth.play("click");
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLCanvasElement>(".game-canvas")
        ?.focus({ preventScroll: true }),
    );
  };
  const showConsole = page === "home" || page === "game";
  const title =
    page === "home"
      ? "Your pocket-sized escape."
      : page === "game"
        ? game.title
        : page === "library"
          ? "The game shelf."
          : page === "categories"
            ? "Find your kind of fun."
            : page === "favorites"
              ? "The keepers."
              : page === "recent"
                ? "Back for another round."
                : page === "statistics"
                  ? "Every little victory."
                  : "Make it yours.";
  return (
    <div className="app-shell">
      <Sidebar page={page} navigate={navigate} />
      <div className="main-shell">
        <Topbar page={page} navigate={navigate} />
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span />
                {page === "home"
                  ? "GOOD OLD GAMES. BRAND NEW HOME."
                  : page === "game"
                    ? `NOW SELECTED / GAME ${game.id}`
                    : "THE PIXCO COLLECTION"}
              </div>
              <h1>{title}</h1>
            </div>
            <span className="edition-label">
              THE CLASSICS COLLECTION<span>VOL. 01 — EST. 2012</span>
            </span>
          </div>
          {showConsole && (
            <PlayArea
              page={page}
              game={game}
              command={command}
              navigate={navigate}
            />
          )}
          {page === "statistics" ? (
            <Statistics select={select} />
          ) : page === "settings" ? (
            <Settings />
          ) : (
            <Library
              key={page}
              page={page}
              select={select}
              navigate={navigate}
            />
          )}
          {page === "home" && data.favorites.length > 0 && (
            <section className="library-section">
              <div className="section-heading">
                <div>
                  <h2>
                    Close to heart <Icon name="Heart" size={17} />
                  </h2>
                  <p>Your very own classics collection.</p>
                </div>
              </div>
              <div className="game-grid">
                {games
                  .filter((g) => data.favorites.includes(g.id))
                  .map((g) => (
                    <GameCard key={g.id} game={g} onSelect={select} />
                  ))}
              </div>
            </section>
          )}
          {page === "home" && data.recent.length > 0 && (
            <section className="library-section">
              <div className="section-heading">
                <div>
                  <h2>One more round?</h2>
                  <p>Pick up a recently played favorite.</p>
                </div>
              </div>
              <div className="game-grid">
                {data.recent.slice(0, 5).map((id) => (
                  <GameCard key={id} game={getGame(id)} onSelect={select} />
                ))}
              </div>
            </section>
          )}
          {!store.available() && (
            <p role="status" className="storage-notice">
              Storage is unavailable. You can play, but this session’s progress
              won’t survive closing the app.
            </p>
          )}
          <footer className="page-footer">
            <span>
              <span className="footer-block">▦</span> LITTLE SCREEN. GOOD TIMES.
            </span>
            <span>
              Built for the kid in all of us.
              <span className="footer-heart">♡</span>
            </span>
            <span>NO ADS. NO ACCOUNTS. JUST PLAY.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
