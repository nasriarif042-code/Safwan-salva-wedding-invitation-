# AGENTS.md

## Architecture

This is a static, framework-free site (no bundler, no build step) plus one Netlify Function and one Postgres table:

- `index.html` — the single-page invitation. Sections are full-height (`100svh`) `<section>` elements inside `#scrollContainer`, laid out with CSS scroll-snap. `js/script.js` drives: the curtain-opening intro, an `IntersectionObserver`-based auto-scroll (each section reads its dwell time from `data-duration` in milliseconds; the final section has none, which stops auto-advance there), the Qur'an two-passage crossfade, the canvas scratch-reveal, the live countdown, floating petals, and the guest response form.
- `dashboard.html` / `js/dashboard.js` — password-gated admin view. The password (`SafSal2026!`) is checked both client-side (UX) and server-side inside the function (actual authorization). Excel export uses SheetJS (`xlsx`) loaded from a CDN — there is no build step, so this is a `<script>` tag, not an npm dependency.
- `netlify/functions/rsvp.mts` — single endpoint at `/api/rsvp`. `POST` inserts a response; `GET` requires the `x-dashboard-password` header and returns rows split into `groom`/`bride` plus attendance counts.
- `db/schema.ts` + `db/index.ts` — Drizzle ORM schema/client for Netlify Database. Migrations live in `netlify/database/migrations/` and are applied automatically by the Netlify platform at deploy time — never run `drizzle-kit migrate/push` or hand-edit an already-applied migration; roll forward with a new `drizzle-kit generate` instead.

## Conventions

- Keep the site dependency-free on the frontend (no npm-installed UI framework); it's meant to stay a plain HTML/CSS/JS deliverable per the original brief.
- Arabic text blocks use `dir="rtl"` explicitly, even though the surrounding document is `dir="ltr"`.
- All animation is transform/opacity based (see `.reveal` in `css/style.css`) to stay smooth on low/mid-range Android phones — avoid animating layout properties.
- The word "RSVP" is intentionally never shown in any user-facing copy; use "response" / "attend" instead.
- Only one wedding video asset was supplied, so `assets/wedding-video.mp4` is reused for both the Arabic-names section and the final section.

## Non-obvious decisions

- The curtain "split" effect uses two 50%-wide panels, each showing the *other* half of the same background image (via an inner element shifted by its own width), rather than two separate image files — there was only one curtain image to work with.
- Auto-scroll timers are cleared and rescheduled every time a new section crosses the 55% visibility threshold (regardless of whether the scroll was manual or programmatic). This is what makes manual scrolling "win" without any special-case detection code.
