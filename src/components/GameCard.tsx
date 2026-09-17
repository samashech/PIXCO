import type { GameDefinition } from "../games/engine/types";
import { store, useStore, formatScore } from "../storage/store";
import { Icon } from "./Icon";
import { Preview } from "./Preview";
export function GameCard({
  game,
  onSelect,
}: {
  game: GameDefinition;
  onSelect: (id: string) => void;
}) {
  const { favorites, stats } = useStore();
  return (
    <article className="game-card">
      <button
        className="card-art"
        onClick={() => onSelect(game.id)}
        aria-label={`Play ${game.title}`}
      >
        <Preview game={game} />
        <span className="card-play">
          <Icon name="Play" size={19} />
        </span>
      </button>
      <button
        className={`favorite-button ${favorites.includes(game.id) ? "is-favorite" : ""}`}
        onClick={() => store.favorite(game.id)}
        aria-label={`${favorites.includes(game.id) ? "Unfavorite" : "Favorite"} ${game.title}`}
        aria-pressed={favorites.includes(game.id)}
      >
        <Icon name="Heart" size={16} />
      </button>
      <div className="card-details">
        <div className="card-category">
          <span>GAME {game.id}</span>
          <span>{game.category}</span>
        </div>
        <button className="card-title" onClick={() => onSelect(game.id)}>
          {game.title}
        </button>
        <div className="card-meta">
          <span>
            <i className={`difficulty ${game.difficulty.toLowerCase()}`} />
            {game.difficulty}
          </span>
          <span title="High score">
            <Icon name="Trophy" size={12} />
            {formatScore(stats[game.id]?.highScore ?? 0)}
          </span>
        </div>
        {stats[game.id]?.lastPlayed && (
          <div className="last-played">
            PLAYED{" "}
            {new Date(stats[game.id].lastPlayed).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}
          </div>
        )}
      </div>
    </article>
  );
}
