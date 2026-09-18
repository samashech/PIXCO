import { difficulties, difficultyLabel } from "../games/difficulty";
import { Icon } from "../components/Icon";
import { games, getGame } from "../games/registry";
import { useStore, formatScore, formatTime, gameStats } from "../storage/store";
export function Statistics({ select }: { select: (id: string) => void }) {
  const data = useStore();
  const totalSeconds = Object.values(data.stats).reduce(
    (sum, s) => sum + s.seconds,
    0,
  );
  return (
    <section className="statistics">
      <div className="stat-grid">
        {[
          [
            "Games played",
            Object.values(data.stats).reduce((s, x) => s + x.played, 0),
          ],
          ["Total play time", formatTime(totalSeconds)],
          [
            "Games finished",
            Object.values(data.stats).reduce((s, x) => s + x.completed, 0),
          ],
          ["Favorites", data.favorites.length],
        ].map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <h2>Personal records</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>GAME</th>
              {difficulties.map((d) => (
                <th key={d}>{difficultyLabel[d].toUpperCase()} BEST</th>
              ))}
              <th>BEST LEVEL</th>
              <th>PLAYS</th>
              <th>TIME</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.id}>
                <td>
                  <button onClick={() => select(g.id)}>
                    {g.id} <b>{g.title}</b>
                  </button>
                </td>
                {difficulties.map((d) => (
                  <td key={d}>
                    {formatScore(gameStats(data, g.id, d).highScore)}
                  </td>
                ))}
                <td>{data.stats[g.id]?.bestLevel ?? "—"}</td>
                <td>{data.stats[g.id]?.played ?? 0}</td>
                <td>{formatTime(data.stats[g.id]?.seconds ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Game history</h2>
      {data.history.length ? (
        <div className="history-list">
          {data.history.slice(0, 30).map((s) => (
            <div key={s.id}>
              <b>{getGame(s.gameId).title}</b>
              <span>{difficultyLabel[s.difficulty]}</span>
              <span>{new Date(s.date).toLocaleString()}</span>
              <span>{formatTime(s.seconds)}</span>
              <strong>{formatScore(s.score)} PTS</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="Clock" />
          <b>YOUR STORY STARTS WITH PLAY</b>
          <p>Finish your first round to start your history.</p>
        </div>
      )}
    </section>
  );
}
