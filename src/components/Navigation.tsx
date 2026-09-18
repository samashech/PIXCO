import { Brand, Icon, type IconName } from "./Icon";
import { games, getGame } from "../games/registry";
import { store, useStore } from "../storage/store";
import type { Page } from "../navigation";
type Props = { page: Page; navigate: (page: Page) => void };
const nav: { id: Page; label: string; icon: IconName }[] = [
  { id: "home", label: "Home", icon: "Home" },
  { id: "library", label: "All games", icon: "LayoutGrid" },
  { id: "categories", label: "Categories", icon: "Layers" },
  { id: "favorites", label: "Favorites", icon: "Heart" },
  { id: "recent", label: "Recently played", icon: "Clock" },
  { id: "statistics", label: "Statistics", icon: "AudioLines" },
];
export function Sidebar({ page, navigate }: Props) {
  const data = useStore();
  return (
    <aside className="sidebar">
      <a
        className="brand-link"
        href="#home"
        onClick={(e) => {
          e.preventDefault();
          navigate("home");
        }}
      >
        <Brand />
      </a>
      <div className="sidebar-caption">TINY GAMES. BIG NOSTALGIA.</div>
      <div className="nav-heading">PLAY</div>
      <nav aria-label="Main navigation">
        {nav.map((item) => (
          <button
            key={item.id}
            aria-label={item.label}
            aria-current={page === item.id ? "page" : undefined}
            className={`nav-item ${page === item.id || (page === "game" && item.id === "library") ? "active" : ""}`}
            onClick={() => navigate(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.id === "library" && (
              <span className="nav-count">
                {String(games.length).padStart(2, "0")}
              </span>
            )}
            {item.id === "favorites" && data.favorites.length > 0 && (
              <span className="nav-count">{data.favorites.length}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="offline-note">
          <div className="offline-icon">
            <Icon name="Gamepad2" size={24} />
          </div>
          <b>No Wi-Fi. No worries.</b>
          <p>
            Your arcade goes wherever
            <br />
            you do. Just like it used to.
          </p>
          <span>
            <i /> ALWAYS READY TO PLAY
          </span>
        </div>
        <button
          aria-label="Settings"
          className={`nav-item ${page === "settings" ? "active" : ""}`}
          onClick={() => navigate("settings")}
        >
          <Icon name="Settings2" />
          <span>Settings</span>
        </button>
        <div className="sidebar-version">
          <span>PIXCO V1.0</span>
          <span>MADE TO PLAY ↗</span>
        </div>
      </div>
    </aside>
  );
}
export function Topbar({ page, navigate }: Props) {
  const data = useStore();
  const game = getGame(data.selected);
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <Icon name="Grid2X2" size={16} />
        <span>YOUR LITTLE ARCADE</span>
        <span className="breadcrumb-slash">/</span>
        <b>
          {page === "game"
            ? `GAME ${game.id}`
            : page === "library"
              ? "ALL GAMES"
              : page.toUpperCase()}
        </b>
      </div>
      <div className="topbar-actions">
        <span className="local-badge">
          <i /> LOCAL & OFFLINE
        </span>
        <div className="topbar-divider" />
        <button
          className="icon-button"
          onClick={() => store.settings({ muted: !data.settings.muted })}
          aria-label={data.settings.muted ? "Unmute sound" : "Mute sound"}
        >
          <Icon name={data.settings.muted ? "VolumeX" : "Volume2"} size={19} />
        </button>
        <button
          className="icon-button"
          onClick={() => navigate("settings")}
          aria-label="Open settings"
        >
          <Icon name="SlidersHorizontal" size={19} />
        </button>
      </div>
    </header>
  );
}
