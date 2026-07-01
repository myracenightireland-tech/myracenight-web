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

### Item 8 — FAQ, How It Works, Pricing pages + footer nav — DONE
- Created three server-component pages matching the existing dark/gold design (same nav header
  + "Back to home" as terms/privacy):
  - `src/app/how-it-works/page.tsx` — 5-step journey (create event → sell tickets → AI
    commentary → live leaderboard → funds to club), CTA to register.
  - `src/app/pricing/page.tsx` — honest beta pricing (free to host, small fee off tickets that
    scales with ticket price, most proceeds to club, no fixed % yet), contact email, CTA.
  - `src/app/faq/page.tsx` — 7 Q&As (what it is, cost, joining, payments, GDPR/data, licensing
    responsibility, support), contact email, CTA.
  - Each has its own unique `metadata` (title + description).
- Added a footer nav on the homepage linking How It Works / Pricing / FAQ / Terms / Privacy.
- Verification: `npm run build` GREEN; `/faq`, `/pricing`, `/how-it-works` all prerender as
  static routes. Each is reachable via the footer nav (links present in homepage HTML) and has
  a distinct meta description. Confirmed all 8 site pages (home, login, register, terms, privacy,
  faq, pricing, how-it-works) have mutually distinct descriptions. The protected
  `dashboard/overview` page was not modified.

---

## FINAL SUMMARY

**Final production build: GREEN** (`NEXT_PUBLIC_API_URL=https://api.example.com npm run build`,
clean `.next` rebuild — "✓ Compiled successfully", all routes generated). Pushed to origin so
Vercel can deploy.

### Items done (7)
1. **/terms + /privacy** — DRAFT GDPR-aware pages with visible DRAFT notices; register consent
   links now resolve.
2. **Login fields in initial HTML** — `<noscript>` fallback adds email/password fields to
   view-source; zero changes to auth logic (login, phone/PIN, mustChangePassword redirect).
3. **Homepage pricing** — honest beta section, no invented number; placeholder stats untouched.
4. **Viewport** — removed `maximum-scale`/`user-scalable=no`; pinch-zoom enabled, layout unaffected.
5. **Meta descriptions** — home/login/register/terms/privacy (+ new pages) all unique & accurate.
7. **Contact email** — `mailto:myracenightireland@gmail.com` visible in homepage footer.
8. **FAQ / How It Works / Pricing pages** — created, footer-nav linked, each with own description;
   overview page not touched.

### Items skipped (1)
6. **Testimonials** — skipped per Decisions (none exist yet in beta; not fabricating any).

### Decisions applied
- Terms/Privacy: professional DRAFT copy + visible "DRAFT — pending legal review" note, dated today.
- Pricing: honest beta wording, NO invented percentage.
- Homepage stats: left exactly as-is (placeholders).
- Contact email: myracenightireland@gmail.com used throughout.
- Safest-reversible choices logged inline (noscript for login; local build env shim; .gitignore).

### Needs your input in the morning
1. **Terms & Privacy are DRAFTS** — must go through legal review before public launch (both carry
   the visible DRAFT banner).
2. **Register page still says "85% of proceeds to your club"** (`src/app/auth/register/page.tsx`),
   a hard-coded figure that conflicts with the beta "no fixed percentage" decision. Left unchanged
   (out of scope — not one of the 8 items). Consider aligning it with the honest pricing copy.
3. **`/auth/change-password` route does not exist** in the frontend repo, yet login redirects there
   on `mustChangePassword`. Pre-existing; left as-is (auth flow is protected/out of scope). May 404
   in production — worth confirming.
4. **Local builds need `NEXT_PUBLIC_API_URL`** set (Vercel already has it). No files changed for
   this; documented at top of this log.
