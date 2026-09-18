# PIXCO

**Tiny games. Big nostalgia.** Ten original, playable monochrome games in a functional virtual handheld. React + TypeScript + Vite, Canvas rendering, and Electron desktop packaging. No account, backend, ads, ROMs, external fonts, or sound samples.

## Run

Use Node 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. Select a game, press **Enter**, and play.

```sh
npm run build
npm run preview
npm run desktop
```

The browser build is `dist/`. Serve that directory from any static host. Relative asset paths also support a subdirectory. Core gameplay works offline after one successful production load; service workers require HTTPS or localhost. Development mode deliberately does not install an offline worker. The desktop app loads its bundled files and works offline immediately.

## Games

| ID  | Game            | Controls                                         |
| --- | --------------- | ------------------------------------------------ |
| 001 | Falling Blocks  | ← → move, ↑ / Z rotate, ↓ soft drop, X hard drop |
| 002 | Snake           | Arrow keys; no reversing into yourself           |
| 003 | Brick Breaker   | ← → move, Z / X quick slide                      |
| 004 | Highway Racer   | ← → change lanes                                 |
| 005 | Space Shooter   | ← → move, Z / ↑ fire                             |
| 006 | Maze Runner     | Arrow keys; reach the flashing exit              |
| 007 | Pocket Pong     | ← → move                                         |
| 008 | Pixel Dodger    | ← → move, Z / X dash                             |
| 009 | Shifting Bricks | ← → move, Z / X quick slide; the wall shifts     |
| 010 | Memory Loop     | Watch, then repeat the directional pad sequence  |

**Enter / P:** start or pause. **R:** restart. **Escape:** library. **Z / Enter at game over:** retry. **X at game over:** library. **/** focuses library search. **F11:** desktop fullscreen; the browser also has a fullscreen button beside the controls. Click or hold the handheld buttons. Remap keys in Settings; typing in a form never controls a game.

Controllers use the D-pad / left stick, south/east action buttons, Start, and Select. Settings includes a live connection indicator and A/B swap. A physical controller was not attached during development; mapping and edge handling were tested with synthetic input.

## Features and storage

- Instant number/name/category/tag search; category filters and sorting.
- Persistent favorites, recent games, high scores, best level, play counts, completed rounds, play time, and a bounded 200-session history.
- Four LCD palettes; clean, grid, and subtle persistence effects; integer scaling; adjustable pixel detail.
- Original Web Audio square-wave sounds with master/effects levels and mute. Audio starts after user interaction, as required by browsers.
- Keyboard remapping, controller button swap, auto-pause, FPS/timer, display scaling, density, and reduced motion.
- Validated settings import/export and independent score/favorite/statistics resets.
- Responsive sidebar, compact navigation, and mobile bottom navigation. Games move above the introductory copy on small screens.

Browser data is in `localStorage['pixco.v1']`. Scores and time are checkpointed every five seconds and when pausing, switching games, hiding, or closing. A sudden process kill can lose the last five seconds. Recent games launch a fresh round; there is no suspended-board restoration. “Games finished” counts rounds that reach game over. Maze is an endless series of completed mazes, recorded through score and level.

Desktop data lives in Electron's platform-specific user-data directory, independently of browser data. Window geometry is saved in `window-state.json`. Settings export contains preferences and mappings, not score history. Optional API failures fall back to playable, in-memory operation; unavailable storage is shown in the UI.

## Desktop builds

```sh
npm run package:linux          # Linux AppImage
npm run package:win            # Windows portable ZIP
npm run package:win:installer  # Windows NSIS installer
npm run package:mac            # macOS DMG and ZIP, on macOS
```

Artifacts are written to `release/`. Extract the Windows ZIP and run **Pixco.exe**. On Linux, mark the AppImage executable if necessary and run it. Electron/Chromium must retain its sandbox in normal use; the automated runner supplies `--no-sandbox` only for its test process.

The app includes an original icon, a native application menu, fullscreen shortcuts, single-instance behavior, saved window size, and explicit native hide/minimize/blur pause signals. The renderer has context isolation, no Node integration, a minimal preload bridge, denied permissions, and blocked external navigation/network requests. Production HTML also sets a Content Security Policy.

**Verified locally:** Linux AppImage generation; Windows portable ZIP generation; native Linux startup, gameplay, persistence after relaunch, auto-pause on hide, and geometry restoration. The Linux compositor does not implement normal minimize behavior, so hide was used for the automated native lifecycle check; minimize is wired to the same pause bridge.

**Not verified locally:** Windows runtime and macOS builds/runtime. The NSIS cross-build reached installer generation but failed because Wine is not installed; the failed intermediates are isolated in `release/incomplete-installer/`. Run the installer command on Windows or in a Linux build environment with Wine. `.github/workflows/build.yml` builds each desktop platform on its native runner, including NSIS on Windows. The workflow is provided but has not been run here. Builds are unsigned; signing/notarization needs the publisher's certificates.

## Verification

```sh
npm test                     # 33 logic, persistence, and input tests
npm run build                # strict TypeScript + production build
npm run format:check
npm run test:browser          # start npm run dev first
npm run test:offline          # start npm run preview -- --port 4173 first
npm run test:desktop          # build first; briefly opens a native window
node scripts/check-desktop.mjs --packaged # after Linux packaging
```

Browser checks use `/usr/bin/brave` when present. Else install Playwright Chromium with `npx playwright install chromium`, or set `PIXCO_BROWSER` to another Chromium executable. `PIXCO_URL` overrides the test URL. Screenshots are saved under `/tmp/pixco-*.png`. Desktop test storage is isolated under `/tmp/pixco-native-check`.

The browser suite covers all ten games, keyboard input, pause/restart, persisted scores/favorites, search and categories, history, theme/mute settings, remapping, settings export and rejected imports, form-input isolation, desktop/tablet/mobile overflow, production offline reload, and missing optional APIs. Rendering was visually inspected at 1440, 768, and 390 pixels wide.

## Architecture

```text
src/
  components/     Handheld, LCD preview, cards, navigation, play area
  pages/          Library, Statistics, Settings
  games/
    engine/       GameEngine contract, lifecycle, sprite helpers
    registry.ts   Metadata and engine factories
    *.ts          Independent original game implementations
  lcd/            Canvas renderer and monochrome palettes
  audio/          Procedural square-wave synthesizer
  input/          Keyboard/controller translation
  storage/        Observable local store, defaults, validated imports
  styles/         Custom responsive industrial/LCD design
  App.tsx         Page composition and navigation

desktop/          Isolated Electron main process and minimal pause bridge
public/           Original icon, install manifest, offline worker
```

Games implement `init`, `update`, `render`, `handleInput`, `pause`, `resume`, `reset`, and `destroy`. The shared loop advances at a fixed 1/60-second step, clamps elapsed time after suspension, and draws canvas outside React. React receives slower score/status snapshots. Renderers receive logical pixels, not UI elements; game logic has no React or DOM dependency. A ready-state preview is computed once per game, rather than regenerating random games each frame.

To add a game:

1. Implement `GameEngine` (or extend `BaseGame`) in `src/games/`.
2. Return a logical-grid `GameFrame` from `render()`.
3. Add metadata and a factory to `src/games/registry.ts`.
4. Add movement, collision, scoring, and lifecycle tests.

The library, preview, input loop, settings, audio, and persistence use the registry automatically. Shifting Bricks demonstrates a variant sharing an engine without duplicating its implementation. Only ten games are advertised and shipped.

Implementation references: [Vite](https://vite.dev/guide/), [Electron context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation), and [Electron Builder multiplatform builds](https://www.electron.build/docs/features/multi-platform-build/).
