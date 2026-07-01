# Nightly UX Audit Log

Autonomous overnight run — MyRaceNight frontend (Next.js 14, Vercel).
Date: 2026-07-01. FRONTEND ONLY. Overview page and auth logic protected.

## Environment / setup notes
- `node_modules` were not present; ran `npm ci` to install pinned deps.
- **Local build requires `NEXT_PUBLIC_API_URL`.** `next.config.js` rewrites `/api/:path*`
  to `${NEXT_PUBLIC_API_URL}/api/:path*`; when the env var is unset the build fails with
  "Invalid rewrite" (`destination` = `undefined/api/...`). On Vercel this var is configured,
  so this is a local-only concern. For every local `npm run build` verification I pass a
  dummy value: `NEXT_PUBLIC_API_URL=https://api.example.com npm run build`.
  **No source/config files were changed for this** — purely a local build-env shim.
- Baseline build (before any changes): **GREEN** with the dummy API URL.
- Confirmed login SSR bug: prerendered `.next/server/app/auth/login.html` contains only the
  loading spinner (`animate-spin`), not the form fields — because `LoginForm` uses
  `useSearchParams()` inside a `<Suspense>`, so the server renders the fallback. This is the
  root cause behind Finding/Item 2.

## Observations flagged for morning review
- `src/app/auth/register/page.tsx` features list hard-codes **"85% of proceeds to your club"**.
  This is a specific pricing figure that conflicts with the beta "no fixed percentage" decision.
  Left UNCHANGED (out of scope for the 8 items; changing it would alter a page not listed).
  Flagging for your review — you may want to soften this to match the honest pricing copy.
- Login redirects to `/auth/change-password` on `mustChangePassword`, but no
  `src/app/auth/change-password/` route exists in the frontend repo. Pre-existing; left as-is
  (creating routes / touching auth flow is out of scope). Flagging in case it 404s in prod.

---

## Per-item results

### Item 1 — /terms and /privacy (DRAFT) — DONE
- Created `src/app/terms/page.tsx` and `src/app/privacy/page.tsx` as server components
  matching the site's dark/gold design, each with a visible yellow banner:
  "DRAFT — pending legal review before public launch." + "not legal advice" wording.
- Terms covers: who we are, eligibility/accounts, hosting events, tickets/fees/payments
  (honest beta wording, no invented %), acceptable use, IP, beta availability, liability,
  privacy link, changes, governing law (Ireland), contact email.
- Privacy is GDPR-aware: data collected (names, emails, phone, payments), lawful bases,
  sharing, international transfers, retention, data-subject rights + DPC complaint route,
  security, cookies, contact email.
- Each page has its own unique `metadata` (title + description) — also satisfies Item 5 for
  these two pages.
- Verification: `npm run build` GREEN; both routes prerender as static (`/terms`, `/privacy`).
  Confirmed prerendered HTML contains the DRAFT note, real body content, GDPR references and
  the contact email. Register consent links `href="/terms"` and `href="/privacy"` now resolve
  to real pages.
- Decision: dated both documents "Last updated: 1 July 2026" (today) as a reasonable draft date.
