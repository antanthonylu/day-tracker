# Day Tracker

A calendar-first habit tracker that runs as an installable web app on an iPhone.
Every day you complete a habit is a coloured mark; a missed day is an empty
outline. No accounts, no backend, no analytics. All data stays on the device.

Live: **https://antanthonylu.github.io/day-tracker/**

## ⚠️ Back up your data

Your habits and entries live in IndexedDB **on the phone only**. They are never
uploaded anywhere — this repo hosts the app's code, never your data.

That cuts both ways: **deleting the Home Screen icon deletes all your data.**
So does "Clear History and Website Data" in Safari settings. Export a backup
from Settings before you remove or reinstall the app.

## Install on your iPhone

1. Open <https://antanthonylu.github.io/day-tracker/> in **Safari** (not Chrome —
   only Safari can add to the Home Screen).
2. Tap the Share button, then **Add to Home Screen**.
3. Launch it from the icon. It opens full-screen with no browser chrome.

After the first launch everything is cached on the phone, so it works in
airplane mode, on the subway, and with your computer switched off.

## Updating the installed app

Push to `main`. GitHub Actions lints, tests, builds, and deploys to Pages. The
next time you open the app it shows an "Update available" banner — tap **Reload**
and you're on the new version. Your data is untouched; there's nothing to
reinstall.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173/day-tracker/
```

| Command              | What it does                       |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Dev server with hot reload         |
| `npm test`           | Vitest unit tests (domain logic)   |
| `npm run test:watch` | Tests in watch mode                |
| `npm run lint`       | ESLint                             |
| `npm run format`     | Prettier                           |
| `npm run build`      | Type-check, then build to `dist/`  |
| `npm run preview`    | Serve the production build locally |

Note that the dev server runs under the `/day-tracker/` path, matching the
GitHub Pages subpath — the bare `http://localhost:5173/` will 404.

Service workers need HTTPS or `localhost`. Testing over the LAN with
`vite --host` is fine for checking layout on the phone, but install and offline
behaviour can only be verified on the deployed URL.

## Project layout

```
src/
  domain/    pure TypeScript — dates, shapes, stats. No framework imports, fully unit-tested.
  storage/   StorageAdapter interface + the IndexedDB implementation.
  store/     app state, built on top of the adapter.
  ui/        Preact components. Never touches storage directly.
tools/
  make-icons.py   regenerates the app icons (no dependencies)
```

Domain logic is kept framework-free on purpose: a future Scriptable home-screen
widget needs to reuse the shape and stats code without pulling in Preact.

## Backup format

`Settings → Export backup` writes `day-tracker-backup-YYYY-MM-DD.json`
containing every habit, entry, and setting, plus a `schemaVersion`. Import
validates the file, runs any migrations, and applies it in a single transaction —
it either fully succeeds or changes nothing.

## Status

Milestones 1-3 of 8 (see `HANDOFF.md` §12): installable shell, data layer and
habit management, and daily logging. Month, Year and Insights are still
placeholders until their milestone lands.

### Where this differs from HANDOFF.md

The spec is the starting point, not a contract. These were changed on purpose:

- **Habits are binary.** No count habits, targets, units or steps — a day is
  done or it isn't. `Entry.value` stays numeric so that could come back.
- **Twelve shapes, not twenty-four**, chosen so no two share a silhouette at
  the ~10px the year grid will draw them at.
- **No "week starts on" or "day starts at" settings.** Weeks start Sunday and
  days start at midnight, fixed, as `WEEK_STARTS_ON` / `DAY_STARTS_AT_HOUR`.
- **The date switcher travels forward past today** (read-only) and back to at
  least 1 January of the current year, rather than being pinned to habit
  history.
