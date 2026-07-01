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

### Repo hygiene fix (during Item 1/2)
- The repo had **no `.gitignore`**, so an initial `git add -A` swept `node_modules` (~26.6k
  files) and `.next` build output into a commit. I reset that commit (nothing was pushed),
  added a `.gitignore` (`node_modules`, `.next`, `out`, `.env*.local`, `next-env.d.ts`, etc.),
  and recommitted Item 1 with only the intended source files. All later commits are clean.
  `tsconfig.tsbuildinfo` was already tracked in the original upload, so it is left tracked.

### Item 2 — Login fields in initial HTML — DONE
- Root cause: `LoginForm` calls `useSearchParams()` inside a `<Suspense>`, so on the server
  only the spinner fallback renders and the form fields are absent from the initial HTML
  (confirmed against prerendered `.next/server/app/auth/login.html`).
- Fix (chosen: the safest, explicitly-allowed option — a `<noscript>` fallback that changes
  NO auth logic): added a `<noscript>` block to `LoginPage` containing a static, styled
  email + password sign-in form plus an "enable JavaScript / phone-PIN login needs JS" notice,
  and a CSS rule hiding the interactive container when JS is off. The interactive `LoginForm`
  (client-side `login()`, email/password + phone/PIN, and the `mustChangePassword` →
  `/auth/change-password` redirect) is byte-for-byte unchanged.
- Verification: `npm run build` GREEN. Prerendered login HTML now contains `name="email"`,
  `name="password"`, "Email address", "Welcome back" and the JS notice (visible in view-source).
  Diff of `LoginForm` shows zero changes to auth logic (only the outer wrapper gained the
  noscript block and a `.js-login-form` container div).

### Item 3 — Homepage pricing section — DONE
- Added an honest, beta-flagged pricing section (`id="pricing"`) to the homepage between the
  Features and closing CTA. Content per Decisions: "Beta pricing — subject to confirmation"
  badge; three cards — Free to host / Small platform fee (scales with ticket price, higher
  ticket → lower fee) / Most goes to your club (exact rate confirmed per event); closing note
  that there is no fixed percentage yet and pricing may change. NO invented number. Includes
  the contact email.
- Verification: `npm run build` GREEN; prerendered homepage HTML contains the pricing headings.
  Confirmed the homepage placeholder stats (€2.5M+ / 500+ / 50K+ / 4.9★) are unchanged.

### Item 4 — Viewport meta (allow zoom) — DONE
- Removed `maximumScale: 1` and `userScalable: false` from `viewport` in `src/app/layout.tsx`.
  Kept `width: device-width`, `initialScale: 1`, `viewportFit: 'cover'`, themeColor.
- Verification: `npm run build` GREEN. Prerendered `<meta name="viewport">` is now
  `width=device-width, initial-scale=1, viewport-fit=cover` — no `user-scalable=no` and no
  `maximum-scale` anywhere in the built HTML, so pinch-zoom is now permitted (accessibility fix).
  Only the zoom-lock attributes were removed; layout-affecting values (width/initial-scale/
  viewport-fit) are unchanged, so page layout is unaffected.

### Item 5 — Unique meta descriptions — DONE
- Homepage: added a `metadata` export to `src/app/page.tsx` (was inheriting the generic root
  layout description).
- Login & Register are client components (can't export metadata), so added server-component
  route layouts `src/app/auth/login/layout.tsx` and `src/app/auth/register/layout.tsx` that
  export their own `metadata` (title + description) and just render `children`. Auth pages
  themselves untouched.
- Terms & Privacy already carry unique descriptions from Item 1.
- Verification: `npm run build` GREEN. Extracted `<meta name="description">` from each
  prerendered page — all five (home, login, register, terms, privacy) are present and mutually
  distinct and accurate.

### Item 6 — Testimonials — SKIPPED (per Decisions)
- No testimonials exist yet (beta) and the instruction is to NOT fabricate any. Skipped
  intentionally; no code change. Nothing to verify.

### Item 7 — Contact email in footer — DONE
- Added a `mailto:myracenightireland@gmail.com` link to the homepage footer (visible text =
  the address), styled to match, next to the copyright line.
- Verification: `npm run build` GREEN; prerendered homepage HTML contains
  `mailto:myracenightireland@gmail.com`. The link is visible in the footer and the mailto
  opens the user's email client to that address.
