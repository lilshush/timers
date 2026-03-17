# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (hot-reload: Vite on :5173 proxying API to Express on :3001)
npm run dev

# Production build + serve (Express serves built client from client/dist/)
npm run build
npm start
```

## Architecture

This is a full-stack npm workspaces monorepo with two packages: `server/` and `client/`.

### Data Flow

1. **Session creation**: On first load, `useSession` POSTs to `/api/sessions`, gets a UUID, writes it to `?session=<uuid>` in the URL via `history.replaceState`. Subsequent visitors with the same URL reuse the existing session — this is the sharing mechanism.
2. **Timer state**: Timers have `status: 'READY' | 'ACTIVE'` and a `started_at` Unix timestamp (ms). Elapsed time is always computed client-side as `Date.now() + clockOffset - started_at`. The server injects `server_time` into every GET response so the client can calibrate `clockOffset = serverTime - Date.now()`.
3. **Polling**: `useTimers` polls `GET /api/sessions/:id/timers` every 5 seconds. All viewers of a shared URL see the same state.
4. **Alerts**: Each timer has multiple `alerts` rows with an `elapsed_ms` mark. `useAlerts` ticks every second, checks each active timer against `alertLogic.js`, and drives a `BuzzController` (Web Audio API oscillator) with crescendo volume from 0→1 over 30s starting 60s before the alert mark.

### Server (`server/`)

- **`db.js`**: In-memory JS object store backed by `server/data/db.json`. No native dependencies — reads on startup, writes synchronously on every mutation via `persist()`. Collections: `sessions`, `timers`, `alerts` (all keyed by UUID).
- **`routes/sessions.js`**: `POST /api/sessions`, `GET /api/sessions/:id`
- **`routes/timers.js`**: Full CRUD mounted at `/api`. Key endpoints: `GET /sessions/:id/timers` (includes `server_time`), `POST /timers/:id/start`, `POST /timers/:id/stop`
- **`index.js`**: Mounts routes, serves `client/dist` as static in production.

### Client (`client/src/`)

- **Hooks**: `useSession` → `useTimers` → `useAlerts` are the three layers of state. `TimerBoard` consumes all three and passes data down to `TimerCard` components.
- **Alert logic** (`utils/alertLogic.js`): `getAlertState(elapsedMs, alertElapsedMs)` returns `{ buzzing, volume }`. Buzz window = `[alertElapsedMs - 60_000, alertElapsedMs + 60_000)`. Volume ramps 0→1 during the first 30s of that window.
- **Audio** (`utils/audio.js`): `BuzzController` class — `start()`, `setVolume(0–1)`, `stop()`. Called by `useAlerts` every second tick.
- **Two-step confirm**: `ConfirmDialog` tracks `step` (1 or 2) internally. Reset to step 1 whenever `open` changes.
- **Styling**: TailwindCSS with custom CSS variables in `index.css` (`--indigo`, `--red`, `--glass-border`, etc.). Glass morphism via `.glass-card` utility class. Fonts: Syne (display/UI) + JetBrains Mono (timer digits, class `timer-digit font-mono`).

### Key Conventions

- All times stored and transmitted as Unix milliseconds.
- Alert `elapsed_ms` = milliseconds after timer start when the alert should ring (not a wall-clock time).
- `server/data/db.json` is gitignored — it's the live data file, not committed.
- ES modules throughout (`"type": "module"` in both packages).
