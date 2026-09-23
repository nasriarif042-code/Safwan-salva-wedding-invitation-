# Safwan & Salva — Wedding Invitation

A premium, cinematic Islamic wedding invitation website built with plain HTML, CSS, and JavaScript, backed by a Netlify Function and a Netlify Database (Postgres) for guest responses.

## What's here

- **`index.html` / `css/style.css` / `js/script.js`** — the invitation itself: a curtain-opening intro with a champagne-gold glow, a full-screen video Arabic names reveal, English names, two separate Qur'anic passages with a crossfade, a scratch-to-reveal reception date card, the venue section, a live countdown, and a final section with a guest response form. Sections auto-advance on a timer and gracefully pause when the guest scrolls manually.
- **`dashboard.html` / `js/dashboard.js` / `css/dashboard.css`** — a password-protected dashboard (linked via a small "Dashboard" link in the footer) that lists Groom's-side and Bride's-side responses separately, shows attending/not-attending counts, and exports each side to its own Excel file.
- **`netlify/functions/rsvp.mts`** — the API endpoint (`/api/rsvp`). `POST` saves a guest response; `GET` (password-protected via an `x-dashboard-password` header) returns the data for the dashboard.
- **`db/schema.ts`** — the `rsvps` table (name, side, response, timestamp), managed with Drizzle ORM against Netlify Database.
- **`assets/`** — the supplied images/video/audio (curtain artwork, wedding video, English-names and Qur'an backgrounds, venue photo, background music).

## Running locally

```bash
npm install
netlify dev --port 8889
```

Open `http://localhost:8889`. Note that the database only comes alive once a deploy has been published (Netlify provisions and migrates it automatically at deploy time), so RSVP submissions will only persist after the first deploy.

## Dashboard access

Visit `/dashboard.html` and enter the password `SafSal2026!`.

## Notes on assets

Only one wedding video was supplied, so it is used both behind the Arabic names section and behind the final section, as instructed by the reference brief when no second video is available.
