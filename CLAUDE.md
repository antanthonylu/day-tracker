# Day Tracker

Personal habit tracker PWA for my iPhone. The full spec is in `HANDOFF.md`; read it before doing anything, and treat it as the source of truth.

- Work one milestone at a time (HANDOFF.md §12). At the end of each milestone, summarize what's done and wait for me before starting the next.
- Keep domain logic (dates, streaks, stats, shapes) in pure, framework-free TypeScript modules with Vitest tests.
- All persistence goes through the `StorageAdapter` interface (§11).
- Dates are local `YYYY-MM-DD` strings; never use UTC or millisecond math for day identity.
- No analytics, trackers, or third-party network calls. No new heavy dependencies without asking.
- If something in the spec is ambiguous or seems wrong, ask instead of guessing.
