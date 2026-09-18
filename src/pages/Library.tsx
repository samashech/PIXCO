import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { GameCard } from "../components/GameCard";
import { games } from "../games/registry";
import { useStore, gameStats } from "../storage/store";
import type { Page } from "../navigation";
export function Library({
  page,
  select,
  navigate,
}: {
  page: Page;
  select: (id: string) => void;
  navigate: (page: Page) => void;
}) {
  const data = useStore();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("All games"),
    [sort, setSort] = useState("number");
  const showConsole = page === "home" || page === "game";
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (
        event.code === "Slash" &&
        !(event.target as HTMLElement)?.closest("input,textarea,select") &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        document.querySelector<HTMLInputElement>(".search-box input")?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  let filtered = games.filter(
    (g) =>
      (category === "All games" || g.category === category) &&
      `${g.id} ${g.title} ${g.category} ${g.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (page === "favorites")
    filtered = filtered.filter((g) => data.favorites.includes(g.id));
  if (page === "recent")
    filtered = filtered
      .filter((g) => data.recent.includes(g.id))
      .sort((a, b) => data.recent.indexOf(a.id) - data.recent.indexOf(b.id));
  if (sort === "title") filtered.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "score")
    filtered.sort(
      (a, b) =>
        gameStats(data, b.id).highScore - gameStats(data, a.id).highScore,
    );
  const categories = ["All games", ...new Set(games.map((g) => g.category))];
  return (
    <section className="library-section">
      <div className="section-heading">
        <div>
          <h2>
            {page === "home"
              ? "Pick up & play"
              : page === "game"
                ? "There’s always another game"
                : page === "favorites"
                  ? "Your favorites"
                  : page === "recent"
                    ? "Recently played"
                    : "All games"}{" "}
            <span>{filtered.length.toString().padStart(2, "0")}</span>
          </h2>
          <p>
            {page === "home"
              ? "Simple rules. Familiar favorites. Surprisingly hard to put down."
              : page === "recent"
                ? "Fresh starts. Familiar games. Your last played games, in order."
                : "A whole arcade. No spare change needed."}
          </p>
        </div>
        {showConsole && (
          <button className="text-button" onClick={() => navigate("library")}>
            View all games <Icon name="ArrowRight" size={15} />
          </button>
        )}
      </div>
      <div className="library-toolbar">
        <div className="category-tabs" aria-label="Game categories">
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              onClick={() => setCategory(c)}
            >
              {c === "All games" && <Icon name="Grid2X2" size={13} />} {c}
            </button>
          ))}
        </div>
        <label className="search-box">
          <Icon name="Search" size={16} />
          <input
            placeholder="Search games…"
            aria-label="Search games"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd>/</kbd>
        </label>
        {!showConsole && (
          <select
            aria-label="Sort games"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="number">Game number</option>
            <option value="title">Name A–Z</option>
            <option value="score">High score</option>
          </select>
        )}
      </div>
      <div className="game-grid">
        {filtered.map((g) => (
          <GameCard key={g.id} game={g} onSelect={select} />
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <Icon name={page === "favorites" ? "Heart" : "Search"} size={28} />
          <b>
            {page === "favorites"
              ? "NO FAVORITES YET"
              : page === "recent"
                ? "READY FOR YOUR FIRST ROUND?"
                : "NO GAMES FOUND"}
          </b>
          <p>
            {page === "favorites"
              ? "Tap a heart to keep a game close."
              : page === "recent"
                ? "Your recently played games will appear here."
                : "Try a game number, name, or category."}
          </p>
          <button
            className="secondary-button"
            onClick={() => navigate("library")}
          >
            Browse all games
          </button>
        </div>
      )}
    </section>
  );
}
