# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An FPL (Fantasy Premier League) helper app: a React client for browsing/searching players and a
recommendation engine that blends live official-FPL-API data with 4 seasons of historical stats to
suggest who to start, captain, or bench.

## Commands

There is no root-level script that runs both halves together — start server and client separately.

```bash
# Server (Express API, port 3001, hardcoded in server/index.js)
node server/index.js

# Client (CRA dev server, port 3000)
cd client && npm start

# Client build/test
cd client && npm run build
cd client && npm test
```

The root `package.json` only holds the server's dependencies (`express`, `cors`, `axios`,
`csv-parse`) and has no real `test`/`start`/`dev` script. The client is a standard
`create-react-app` app with its own `package.json` under `client/`.

## Architecture

**Two independent halves, no shared tooling.** The server has no `package.json` of its own — it
uses the root one. The client is a fully separate CRA app deployed to Vercel
(`client/.vercel/`), configured to call the API via `REACT_APP_API_URL` (falls back to
`http://localhost:3001` for local dev — see the `API` constant near the top of `client/src/App.js`).

### Server (`server/`)

- `server/index.js` — Express app entry point; mounts everything under `/api/players`.
- `server/routes/players.js` — single router with all 8 endpoints (player list/search,
  price tracker, team-by-ID, chip advisor, player fixtures, player recommendation,
  current-GW). This is where the recommendation/scoring logic lives.
- `server/services/fplApi.js` — axios wrapper around the official FPL API
  (`https://fantasy.premierleague.com/api`), with a simple in-memory cache (5-minute TTL) keyed
  by URL. `getBootstrap()` is the core "all players/teams" payload most routes join against.
- `server/services/historicalData.js` — loads and caches (once, in-process) all
  `data/merged_gw_*.csv` files, tagging each row with its season. Exposes
  `getPlayerVsOpponent(playerName, opponentTeamId)` used to compute historical average points
  vs a specific opponent.

**Recommendation scoring** (used by `/api/players/:id/recommendation` and the chip advisor):
blended score = 40% historical average vs the upcoming opponent + 40% recent form (last 5
games) + 20% minutes-played %. Verdict thresholds (START/CONSIDER/BENCH) are position-specific
(GK/DEF vs MID vs FWD have different cutoffs) — see `players.js` for the exact numbers before
changing them.

**Chip advisor** (`/api/players/chip-advisor/:teamId/:gw`) additionally detects double/blank
gameweeks by counting `team_h`/`team_a` fixture appearances per club for the target GW, and
factors chip-usage history (which chips a team has already played) into its Wildcard/Bench
Boost/Triple Captain/Free Hit recommendations.

### Data (`data/`)

Four CSVs (`merged_gw_2022-23.csv`, `merged_gw_2023-24.csv`, `merged_gw_2024-25.csv`,
`merged_gw_2025-26.csv`), one per season, in the `vaastav/Fantasy-Premier-League`
merged-gameweek format — per-player, per-fixture box scores (points, minutes, goals, assists,
xG/xA, bonus, etc.). This is the source of truth for all historical (as opposed to live-API)
stats. To add a new season: download the CSV from vaastav's repo, add the season string to the
`seasons` array in `server/services/historicalData.js`, and update `TEAM_MAP` in
`client/src/constants.js`.

### Client (`client/src/`)

Split by feature, one component per file — no Context/Redux, no react-router:

- `constants.js` — `API` base URL (`REACT_APP_API_URL` or `http://localhost:3001`),
  `POSITION_MAP` (1-4 → GK/DEF/MID/FWD), `TEAM_MAP` (1-20 → club codes). Updated for 2026-27
  season (COV, HUL, LEE, SUN replaced WHU, WOL, SOU, LEI). Update each season as clubs change.
- `theme.js` — `theme(dark)` returns a color-token object for light/dark mode; every component
  takes a `dark` prop and calls this itself rather than reading from Context. Dark-mode state
  lives only in the top-level `App` component and is threaded down via props.
- `utils.js` — `sanitize` (search input), `pointsColor`, `calcBreakdown` (turns a raw fixture
  stat row into human-readable "⚽ 1 goal · 4pts" lines).
- `components/` — `ChipAdvisor.js`, `PriceTracker.js`, `CompareTable.js`, `PlayerRow.js`,
  `TeamCard.js`, `MyTeam.js` (one component per feature/tab; `MyTeam` renders `TeamCard`).
- `App.js` (default export) — top-level shell: header, dark-mode toggle, and a 4-tab nav
  (Search, My Team, Price Tracker, Chip Advisor) switched via local `page` state; navigation is
  plain conditional rendering, not a router. Owns the Search tab's autocomplete + compare-tray
  state directly.

Other patterns to know before editing the client:

- State management is `useState`/`useEffect` only — no Redux/Context/Zustand.
- API calls use plain `fetch`, not axios — despite axios being a server dependency.
- Styling is inline `style={{}}` objects throughout, plus the hand-rolled `theme()` tokens;
  `App.css` only holds a handful of global rules.
- Search autocomplete (in `App.js`) is debounced (300ms, min 2 chars) via a **global
  `window._searchTimer`**, not a ref or hook — keep this pattern in mind if touching the search
  box.
