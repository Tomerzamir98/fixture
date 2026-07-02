# FPL Fixture Advisor — Client

React (Create React App) frontend for the FPL (Fantasy Premier League) helper app. It lets you
search players, view your team, track price changes, and get chip-usage advice, all backed by
the Express API in `../server`.

The UI is split by feature under `src/` — `App.js` is the top-level shell/nav, with one
component per tab under `src/components/` (`ChipAdvisor`, `PriceTracker`, `CompareTable`,
`PlayerRow`, `TeamCard`, `MyTeam`), plus shared `constants.js`, `theme.js`, and `utils.js`.
See `../CLAUDE.md` for the full architecture writeup.

## Features / tabs

- **Search** — autocomplete player search with a sticky compare tray (select up to 4 players).
- **My Team** — enter an FPL Team ID + gameweek to view your squad (starting XI + bench) with
  per-player START/CONSIDER/BENCH recommendations.
- **Price Tracker** — players with the biggest net transfer movement, filterable by position.
- **Chip Advisor** — Wildcard / Bench Boost / Triple Captain / Free Hit recommendations for a
  given Team ID + gameweek, including double/blank gameweek detection.
- Dark mode toggle.

## Running locally

The API server must be running separately (it is not started by this app):

```bash
# from the repo root
node ../server/index.js   # starts the API on http://localhost:3001

# from client/
npm start                 # starts this app on http://localhost:3000
```

By default the client calls `http://localhost:3001`. To point at a different API instance, set
`REACT_APP_API_URL` (used in production via Vercel — see `.vercel/`).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000). Reloads on
changes.

### `npm test`

Launches the CRA test runner in interactive watch mode.

### `npm run build`

Builds a minified production bundle to the `build` folder.

### `npm run eject`

One-way operation to copy CRA's build config (webpack, Babel, ESLint) into the project. Not
needed for normal development.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app);
see the [CRA documentation](https://facebook.github.io/create-react-app/docs/getting-started) for
more on the underlying tooling.
