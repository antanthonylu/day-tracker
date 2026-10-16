# Day Tracker — Handoff Spec

A personal, single-user habit tracker that runs as an installable web app (PWA) on my iPhone. It's a calendar-first tracker: every day you complete a habit is a colored mark, a missed day is just an empty outline, and a whole year fits on one screen. No accounts, no backend, no analytics, no paywall.

This document is the source of truth for v1. Build it milestone by milestone (see §12), and check in with me at the end of each milestone.

---

## 1. Goals and non-goals

**Goals**

- Fast one-tap daily logging on iPhone, installed to the Home Screen via Safari → Share → Add to Home Screen, running full-screen (`display: standalone`).
- Calendar-based views (month grid, year views) as the core of the app. Streaks are shown as stats, but nothing "resets" or punishes a missed day.
- Fully offline after the first load. All data stays on the device.
- Free static hosting (GitHub Pages or Cloudflare Pages).
- Reliable JSON backup/restore.
- A storage layer clean enough that a future Scriptable home-screen widget can read the same data (see §11).

**Non-goals for v1**

- Notifications/reminders, accounts, cloud sync, multi-device, Android-specific polish, home-screen widgets, gamification, mascots, confetti.

**Originality:** this is my own app inspired by a feature set I like. Use an original name (Day Tracker), original icon, and original styling. Don't copy another app's branding, icon, or screenshots.

---

## 2. Tech stack

- **Vite + TypeScript + Preact** (small bundle, component model). Use `preact/hooks`. No heavy UI library.
- **State:** a small store module (plain TS + Preact signals or a context). Keep domain logic (dates, streaks, stats) in pure functions, separate from UI.
- **Storage:** IndexedDB via the `idb` package. Call `navigator.storage.persist()` on first launch.
- **PWA:** `vite-plugin-pwa` (Workbox) with precaching of all build assets, `registerType: 'prompt'`, and an in-app "Update available — reload" banner.
- **Rendering:** SVG for marks/shapes in grids. Use `<canvas>` only for the share-card image export. A full-year view must stay smooth on an iPhone (~365 days × N habits); memoize, and if needed render the year grid as a single SVG/canvas rather than thousands of components.
- **Font:** a self-hosted, open-license monospace font (e.g., IBM Plex Mono or JetBrains Mono, both OFL) for the whole UI, giving it a plain, instrument-like feel. Include `font-display: swap` and a system-monospace fallback.
- **Testing:** Vitest for all pure logic (dates, streaks, stats, import validation, migrations).
- **Lint/format:** ESLint + Prettier, strict TypeScript.

---

## 3. Data model

All dates are **local calendar dates** stored as `YYYY-MM-DD` strings (never UTC timestamps for day identity).

```ts
type HabitId = string; // crypto.randomUUID()
type DateKey = string; // 'YYYY-MM-DD', local

type ShapeId =
  | 'circle'
  | 'square'
  | 'rounded'
  | 'diamond'
  | 'triangle'
  | 'heart'
  | 'clover'
  | 'star'
  | 'sunburst'
  | 'hexagon'
  | 'pentagon'
  | 'octagon'
  | 'plus'
  | 'moon'
  | 'drop'
  | 'flower'
  | 'ring'
  | 'squircle'
  | 'shield'
  | 'bolt'
  | 'leaf'
  | 'cloud'
  | 'spade'
  | 'bowtie';

interface Habit {
  id: HabitId;
  name: string;
  color: string; // hex from the palette (§6)
  shape: ShapeId;
  kind: 'check' | 'count'; // check = done/not done; count = numeric
  target?: number; // count habits: daily target (e.g., 8)
  unit?: string; // count habits: 'glasses', 'min', 'hrs'
  step?: number; // count habits: increment per tap (default 1)
  activeDays?: number[]; // 0–6 (Sun–Sat); undefined = every day
  createdAt: DateKey; // stats start from here
  archivedAt?: DateKey; // archived habits hidden from Today, kept in history
  order: number; // manual sort
}

// One record per habit per day that has any value
interface Entry {
  habitId: HabitId;
  date: DateKey;
  value: number; // check: 1 = done; count: current amount
}

interface Settings {
  weekStartsOn: 0 | 1; // Sunday or Monday
  dayStartsAtHour: number; // 0–6; e.g., 3 means 2am still counts as "yesterday"
  theme: 'system' | 'light' | 'dark';
  lastBackupAt?: string; // ISO timestamp
}

interface ExportFile {
  app: 'day-tracker';
  schemaVersion: number; // start at 1
  exportedAt: string; // ISO
  habits: Habit[];
  entries: Entry[];
  settings: Settings;
}
```

**Rules**

- A day is "complete" for a check habit if `value >= 1`. For a count habit, complete if `value >= target`. Partial is `0 < value < target`.
- Days before `createdAt`, days after today, and days not in `activeDays` are "not applicable": they don't count against completion rate and don't break streaks.
- Deleting a habit asks for confirmation and deletes its entries. Prefer **Archive** as the default action.
- IndexedDB stores: `habits` (key `id`), `entries` (compound key `[habitId, date]`, index on `date`), `meta` (settings, schemaVersion).
- Write a migration runner keyed on `schemaVersion` from day one, even if v1 has none.

---

## 4. Screens

Bottom tab bar with 4 tabs: **Today**, **Month**, **Year**, **Insights**. Settings is a gear icon in the top bar.

### 4.1 Today (default tab)

- A list of active habits for today, each with its shape/color mark and name.
- **Check habit:** tap the row → toggles done (mark fills). Light haptic if available (`navigator.vibrate` is not supported on iOS, so skip it gracefully).
- **Count habit:** tap → +step; long-press or a small "−" button → −step; show `value / target unit` and fill the mark partially (see §5).
- A date switcher (‹ Today ›) to log or fix previous days. Can't log future days.
- A small week strip at the top showing the last 7 days' completion at a glance.

### 4.2 Month

- A grid: rows = habits, columns = days of the month (scrolls horizontally if needed), **or** a standard calendar layout per habit. Implement the **habits × days grid** as the main view; it's the most useful single screen.
- Each cell shows the habit's shape: filled = complete, partially filled = partial count, outline = missed, faint dot = not applicable.
- Tap a cell to toggle or edit that day.
- Month switcher (‹ Oct 2026 ›).

### 4.3 Year

Two modes via a segmented control:

- **All habits:** 12 mini-month calendars. Each day is a small **pie**: a circle split into equal wedges, one per habit active that day; completed habits' wedges are filled in their colors, the rest left as empty/outline. A day with nothing completed is an empty circle. (Equal wedges for all active habits reads better than only-completed-habit slices; make it easy to switch to the alternative later.)
- **One habit:** a habit picker, then 12 mini-months where each day is that habit's shape in its color, with the same filled/partial/outline states.
- Year switcher.

### 4.4 Habit detail (tap a habit name anywhere)

- Header with mark, name, kind/target.
- Stats (§7): current streak, best streak, completion % (this month, this year, all time), total completions; for count habits also total and daily average.
- A gauge comparing the current streak to the best streak.
- That habit's current month calendar.
- Buttons: Edit, Archive/Unarchive, Share card.

### 4.5 Insights

- For the selected month: a compact heatmap comparing every habit day by day, plus a ranked list of habits by completion % for the month, highlighting the top one ("carried the month").
- Simple text summaries: best day of the week per habit; month-over-month change in completion %.

### 4.6 Add/Edit habit (sheet)

- Name, color (palette swatches), shape (grid of 24 shapes previewed in the chosen color), kind (Check / Count), target + unit + step for counts, active days (7 toggles, default all), start date (default today).
- Reorder habits via drag handles on a "Manage habits" list in Settings (or long-press reorder on Today).

### 4.7 Settings

- Week starts on, day starts at hour, theme.
- **Export backup** → downloads/shares `day-tracker-backup-YYYY-MM-DD.json`.
- **Import backup** → file picker; validate; choose **Replace all** or **Merge** (merge = union of habits by id; for entry conflicts keep the higher value). Show a summary before confirming.
- Manage habits (reorder, archived list, delete).
- Storage status: whether persistent storage was granted, number of habits/entries, last backup date.
- App version and "Check for update".

### 4.8 Share card

- Render to `<canvas>` a clean image of one habit's month or year (shape grid in its color, habit name, period, completion %), at 1080×1350 or 1080×1920 (story).
- Use `navigator.share({ files: [pngFile] })` when available (it is on iOS Safari), falling back to download.

---

## 5. Marks and shapes

- Build all 24 shapes as SVG path definitions in one module, each normalized to a 0–100 viewBox, so every view and the canvas share card can reuse them (use `Path2D` for canvas).
- States:
  - **Complete:** shape filled with the habit color.
  - **Partial (count habits):** outline in the habit color plus a fill clipped from the bottom proportional to `value/target` (like a liquid level).
  - **Missed:** thin outline in the habit color at reduced opacity.
  - **Not applicable:** tiny neutral dot.
  - **Today:** subtle ring/underline indicator.
- Shapes exist for accessibility (distinguishable without color). Never rely on color alone.

---

## 6. Visual design

- Minimal, calm, monospace everywhere; numerals align in columns. No gradients, no illustrations.
- Palette of ~16 distinct colors that work on both light and dark backgrounds (check contrast against both). Define as CSS custom properties.
- Light and dark themes via CSS variables; follow `prefers-color-scheme` when theme = system.
- Comfortable tap targets (min 44×44 pt).
- Inputs must be ≥16px font size to prevent iOS zoom on focus.

---

## 7. Stats logic (pure functions, fully unit-tested)

- `isApplicable(habit, date)` → within `createdAt..today`, not archived before that date, and in `activeDays`.
- `status(habit, entry?)` → 'complete' | 'partial' | 'missed' | 'na'.
- **Current streak:** consecutive applicable days ending today (or yesterday, if today isn't complete yet) that are complete. Skip non-applicable days without breaking.
- **Best streak:** max run over all history with the same skip rule.
- **Completion %:** complete applicable days / applicable days in the period.
- Respect `dayStartsAtHour` when determining "today".
- Tests must cover: month boundaries, leap years (2028-02-29), DST changes (use local-date arithmetic, never add 86,400,000 ms), active-day schedules, habits created mid-month, archived habits, and count-habit partials.

---

## 8. iOS PWA requirements (important)

- `manifest.webmanifest`: `name`, `short_name`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, `background_color`, `theme_color`, icons 192/512 plus a maskable icon.
- In `index.html`:
  - `<link rel="apple-touch-icon" href="apple-touch-icon-180.png">` (iOS uses this, not the manifest icons)
  - `<meta name="apple-mobile-web-app-capable" content="yes">` and `<meta name="mobile-web-app-capable" content="yes">`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
  - `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
  - `<meta name="theme-color">` for light and dark
- Respect safe areas with `env(safe-area-inset-*)` (notch and home indicator), especially for the tab bar.
- Disable pull-to-refresh/overscroll bounce where it hurts the UX (`overscroll-behavior: none` on the body).
- No `alert()`/`confirm()`; use in-app sheets.
- Use relative asset paths so it works under a GitHub Pages subpath (`base` in `vite.config.ts`).
- Service workers need HTTPS (or localhost). Testing over LAN on the phone via `vite --host` works for UI but not offline/install; test install and offline on the deployed URL.

---

## 9. Data safety

- Request persistent storage on first launch; show the result in Settings.
- Show a gentle banner on Today if there's been no backup in 30 days (dismissible).
- Make the export easy to reach (Settings, top section).
- Import must validate with a schema check (hand-written type guards or `zod`), reject unknown `app` values, run migrations on older `schemaVersion`s, and never partially apply. Use a single IndexedDB transaction.
- Note for me in the README: deleting the Home Screen icon deletes the app's data, so export first.

---

## 10. Hosting and deploy

- Default: **GitHub Pages** via a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds on push to `main` and deploys `dist/`.
- Set Vite `base` to `/<repo-name>/`.
- README with: local dev, build, deploy, how to install on iPhone, and how to back up and restore.
- The repo can be public (the code has no personal data). Make sure no sample/personal data is committed.

---

## 11. Future: Scriptable widget (do not build now, just don't block it)

A later version may add a home-screen widget via the Scriptable iOS app. The likely design: the tracker runs inside a Scriptable WebView and saves data as a JSON file in iCloud Drive, and a Scriptable widget script reads that file to draw the week/month grid.

To keep that path open:

- Put all persistence behind a `StorageAdapter` interface (`loadAll()`, `saveHabit()`, `saveEntry()`, `exportAll()`, `importAll()`, etc.) with an `IndexedDbAdapter` implementation. A future `ScriptableFileAdapter` can then swap in.
- Keep the `ExportFile` format as the canonical full-state JSON document.
- Keep shape definitions and stats functions framework-free so they can be reused in a widget script.

---

## 12. Milestones

1. **Scaffold & installable shell:** Vite/TS/Preact, lint, Vitest, PWA manifest + icons + service worker, tab bar with empty screens, safe-area layout, light/dark themes, GitHub Pages deploy working. _Done when:_ installs to the iPhone Home Screen, opens full-screen, works offline.
2. **Data layer & habits:** IndexedDB adapter, migrations runner, add/edit/archive/delete/reorder habits, the 24 shapes + palette, settings persistence.
3. **Logging:** Today screen with check and count habits, date switcher, week strip, partial fills.
4. **Month view:** habits × days grid with tap-to-edit.
5. **Year views:** all-habits pie calendar and single-habit calendar, smooth on iPhone.
6. **Stats & Insights:** pure stats functions with full tests, habit detail screen, Insights screen.
7. **Backup & share:** export/import with validation and merge, backup reminder banner, share-card PNG export.
8. **Polish:** empty states, onboarding hint ("Add to Home Screen"), accessibility labels, performance pass, README.

## 13. Acceptance checklist (v1)

- [ ] Installs from Safari to the Home Screen, launches standalone, no browser chrome.
- [ ] Works in airplane mode after the first load.
- [ ] Logging a habit takes one tap from launch.
- [ ] Data survives app close, phone restart, and app update.
- [ ] Export → delete all → import restores everything exactly.
- [ ] Year view scrolls smoothly with 10 habits and a full year of data (add a dev-only "seed demo data" button, excluded from production).
- [ ] Streak/completion numbers match unit tests across DST and month/year boundaries.
- [ ] No network requests after load except for update checks; no analytics or third-party scripts.
