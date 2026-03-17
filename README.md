# Timer

A shared, persistent count-up timer web app. Create named timers, schedule recurring alerts, and share a single link so everyone on your team sees the same live timers — no account required.

## Features

- **Multiple count-up timers** on one screen, responsive for iPhone, iPad, and desktop
- **READY → ACTIVE lifecycle** — configure timers in advance, start them when ready
- **Scheduled alerts** — set one or more HH:MM alert marks per timer (e.g. ring at 01:00, 02:00, 03:30). Alerts can be duplicated.
- **Crescendo buzz** — buzzing begins 1 minute before each alert mark, starting silent and rising to full volume over 30 seconds via the Web Audio API
- **Dismiss button** — buzz continues until manually dismissed
- **Next alert display** — each timer card shows the next scheduled ring time as an elapsed mark (e.g. "Next alert at 01:20")
- **Tap to expand** — click any timer card to see all configured alert times and their status
- **Double confirmation** — stopping or deleting a timer requires two separate confirmations
- **Shareable sessions** — every session has a unique URL (`?session=<uuid>`). Share it on WhatsApp or any messaging app; all viewers see the same timers in real time.

## Getting Started

### Prerequisites

- Node.js 18+

### Install

```bash
git clone <repo-url>
cd Timer
npm install
```

### Run (development)

```bash
npm run dev
```

Opens two servers:
- **Vite** (frontend) → `http://localhost:5173`
- **Express** (API) → `http://localhost:3001`

Open `http://localhost:5173` in your browser. The URL will automatically update to include a session ID (e.g. `?session=abc123`). Share that URL to let others view and interact with the same timers.

### Run (production)

```bash
npm run build   # builds React app into client/dist/
npm start       # Express serves API + static files on port 3001
```

Open `http://localhost:3001`.

## How to Use

1. **Create a timer** — tap **New**, enter a name, optionally add one or more HH:MM alert times, then tap **Create Timer**. The timer starts in READY state.
2. **Start a timer** — tap the **Start** button on any READY timer. The count-up begins immediately.
3. **Alerts** — when elapsed time reaches 1 minute before a scheduled alert mark, the app begins buzzing (crescendo). Tap **Dismiss** to silence it.
4. **Expand** — tap anywhere on a timer card (not a button) to see all scheduled alert times.
5. **Stop/Delete** — requires two confirmations to prevent accidental taps.
6. **Share** — tap **Copy Link** or **Share** (WhatsApp) in the top bar. Anyone with the link sees the same session.

## Project Structure

```
Timer/
├── server/          # Express API + JSON file database
│   ├── db.js        # In-memory store, persisted to server/data/db.json
│   ├── index.js     # Entry point
│   └── routes/
│       ├── sessions.js
│       └── timers.js
└── client/          # React + Vite frontend
    └── src/
        ├── hooks/       # useSession, useTimers, useAlerts
        ├── components/  # TimerCard, AddTimerForm, ConfirmDialog, ShareBar, …
        └── utils/       # formatTime, alertLogic, audio (BuzzController)
```

## Data Persistence

Timer data is stored in `server/data/db.json` (created automatically, gitignored). As long as the server keeps running, all timers and sessions persist across browser refreshes. Restarting the server preserves data because it reads the file on startup.
