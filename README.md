# PERFLIGHT Event Planner

A planning tool for VATSIM event organizers and controllers to coordinate ATC staffing across timezones. Computes coverage windows for facilities and shift schedules for controllers based on departure/arrival times — handling International Date Line crossings correctly. See it live at https://perflight.com/events.

This is a planning tool, not a flight tracker. Everything is computed from user inputs. Plans can be shared via URL — click the Share button to save a snapshot and get a link anyone can open.

## Getting Started

```bash
npm install
npm run dev
```

Open the localhost URL shown in the terminal.

## Build

```bash
npm run build
```

Produces a static `dist/` folder. Plan sharing requires a Firebase project (see `docs/share-plan-feature.md` for setup).

## Deploying

1. If hosting from a subdirectory (e.g., `https://example.com/my-planner/`), set the `base` option in `vite.config.ts` to match:
   ```ts
   base: '/my-planner/',
   ```
2. Run `npm run build`
3. Upload the contents of the `dist/` folder to your web server via FTP/SFTP, rsync, or any static hosting provider (Netlify, Vercel, GitHub Pages, etc.)

## How It Works

1. **Plan Inputs** — Set a scenario name, base date (UTC), departure window (Zulu), flight duration, and optional buffers.
2. **Facilities** — Add departure-side, arrival-side, or enroute facilities with their IANA timezones and lead/lag buffers. The app computes each facility's required coverage window in both UTC and local time.
3. **Controllers** — Add controllers with their local timezones. The app shows what each facility's coverage window looks like in their local time, split into shifts.
4. **Timeline** — A visual bar chart of all windows on a UTC axis.

All times are computed and stored in UTC. Local times are derived via Luxon's IANA timezone support.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Luxon (timezone-aware date/time)
- Firebase Firestore (plan sharing)
- localStorage for persistence

## Theming

Edit the `@theme` block in `src/index.css` to change the color palette:

```css
@theme {
  --color-base: #457b9d;
  --color-surface: #354f52;
  --color-primary: #52796f;
  --color-accent: #a8dadc;
  --color-text: #f1faee;
}
```

## Project Structure

```
src/
  components/
    PlanInputs.tsx       — Scenario/date/time form
    FacilitiesPanel.tsx  — Facility CRUD + coverage display
    ControllersPanel.tsx — Controller CRUD + local shifts
    Timeline.tsx         — Horizontal bar visualization
    ShareButton.tsx      — Save plan to Firestore + copy URL
  context/
    PlanContext.tsx      — State management + localStorage + shared plan loading
  services/
    sharePlan.ts         — Firestore save/load with validation
  firebase.ts            — Firebase initialization
  utils/
    coverage.ts          — Window computation + shift splitting
    timezone.ts          — UTC-to-local formatting
    timezoneList.ts      — Timezone picker options with offsets
  types.ts               — TypeScript interfaces
public/
  .htaccess              — Apache rewrite for SPA routing
```
