# SwiftSwap — Frontend

The web client for SwiftSwap, an automatic crypto exchange (crypto-to-crypto, crypto-to-fiat, fiat-to-crypto across 90+ pairs — no account required to swap). It's a single-page React app that talks to the [SwiftSwap backend API](../backend) for exchange routes, orders, auth, and content, and to CoinGecko for live market prices.

It ships three surfaces from one codebase:

- **Marketing site** — a long-form landing page plus News, About, Contacts, Rules, and KYC/AML pages.
- **Exchange funnel** — the swap card, order creation, and a live order-tracking page with an in-app support chat.
- **Admin panel** — a full operator dashboard (orders, users, wallets, routes, support tickets, reviews, analytics) at `/admin`.

The UI is fully **themeable** (dark/light), **internationalised** (English, 简体中文, 日本語, Русский), and **animated** (a shared, reduced-motion-safe motion system).

---

## Tech stack

- **React 18** + **Vite 5** — SPA, fast HMR, ESM build
- **React Router 6** — client-side routing
- **Tailwind CSS v4** — CSS-first (`@tailwindcss/vite`, no `tailwind.config.js`); theme tokens are CSS variables
- **motion** (Framer Motion v11) — animation foundation; **lenis** — smooth scroll on the landing
- **Radix UI** — accordion, tabs, slot (landing primitives)
- **lucide-react** — icon set
- **clsx** + **tailwind-merge** + **class-variance-authority** — class composition
- **TypeScript** — used for the design-system, landing, and library code (`.ts`/`.tsx`); app pages are `.jsx`

---

## Project structure

```
frontend/
├── index.html                  # Vite entry; sets favicon + no-FOUC theme script
├── vite.config.js              # @ alias, dev proxy, tunnel host allow-list
├── public/
│   ├── logo.png                # App logo (used in-app)
│   └── favicon.png             # Brand favicon (logo on a rounded square)
└── src/
    ├── main.jsx                # Root: ThemeProvider → LangProvider → MotionConfig → App
    ├── App.jsx                 # Routes + MainLayout (navbar, page transition, footer, chat)
    ├── index.css               # Tailwind entry, theme tokens, base + utilities
    ├── config.js               # API_BASE (from VITE_API_URL)
    ├── api/                     # API client + endpoint helpers
    ├── context/                # AuthContext (session, login/logout)
    ├── pages/                  # Route pages (Landing, Auth, Exchange, User, News, About, Contacts, StaticPages)
    ├── components/
    │   ├── Common.jsx          # Footer + ProtectedRoute
    │   ├── Logo.jsx            # Theme-aware logo (white on dark, dark on light)
    │   ├── ChatWidget.jsx     # In-app AI + human support chat
    │   ├── ui/kit.jsx         # Shared design-system primitives (Field, Input, Button, Alert…)
    │   └── landing/           # Landing tree: navbar, sections/, swap-card, hooks, primitives
    ├── admin/                  # Admin panel (AdminApp, components/, pages/)
    └── lib/
        ├── theme.tsx           # Light/dark theme context
        ├── i18n.tsx            # Translation context + useT() hook
        ├── translations/       # en / zh / ja / ru tables + page fragment packs
        ├── motion.tsx          # Animation foundation (Reveal, CountUp, transitions…)
        ├── locales.ts          # Language list + nav config (single source)
        ├── format.ts           # Number formatting
        └── utils.ts            # cn() and helpers
```

---

## Getting started

Requires **Node 18+**.

```bash
cd frontend
npm install
npm run dev            # dev server at http://localhost:5173
```

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server (HMR). |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Serve the production build locally. |

The backend must be running for live data. In dev, requests to `/api` are proxied to `http://localhost:8000` (see `vite.config.js`), so the app works against a local backend with no CORS setup.

---

## Environment

Configuration is via Vite env vars (`.env`, `.env.local`). Only `VITE_`-prefixed vars are exposed to the client.

| Key | Description |
|-----|-------------|
| `VITE_API_URL` | Base URL of the backend API. Falls back to `http://localhost:8000/api/v1`. Set to `/api/v1` to route calls through the dev proxy (keeps them same-origin — handy behind a tunnel), or to the real API origin in production. |

> The market table pulls **live prices from CoinGecko's public API** directly from the browser (no key). Under heavy traffic you may hit its shared rate limit — front it with a small caching backend proxy if needed.

---

## Architecture

### Theme (light / dark)

`src/lib/theme.tsx` holds a `{ theme, setTheme, toggle }` context, persists to `localStorage.ss_theme`, and toggles a `.dark` class on `<html>`. An inline script in `index.html` resolves the theme **before first paint** so there's no flash. All colours are CSS-variable tokens defined in `index.css` (`:root` = light, `.dark` = dark) and mapped into Tailwind via `@theme inline`, so `bg-bg2`, `text-muted`, `border-border`, `bg-brand/10`, etc. theme for free.

### Internationalisation

`src/lib/i18n.tsx` is a lightweight, dependency-free translation context. `useT()` returns `t('namespace.key', { vars })`, which resolves against the active language and **falls back to English** per missing key. Language is persisted to `localStorage.ss_lang`; the navbar (and the admin TopBar) expose a switcher.

Strings live in `src/lib/translations/`: `en.ts` is authoritative, and `zh/ja/ru` mirror it. Page-specific strings are split into **fragment packs** under `translations/pages/` and merged in `index.ts`, so each page can be authored independently. Coverage spans the whole app (nav, auth, all pages, legal, admin). Live/server data (currency names, rates, news, raw API errors) stays as-is.

> **The zh / ja / ru translations are machine-drafted** and marked as such — have them natively reviewed before production, especially the legal pages (English remains the authoritative text there, with a disclaimer shown to non-English readers).

### Motion

`src/lib/motion.tsx` is the animation foundation, standardised on `motion` (Framer Motion). It exports easing/duration tokens, entrance variants, `<Reveal>` / `<RevealGroup>` (scroll-in), `<PageTransition>` (per-route enter), `<CountUp>` (numbers tally up), and `<SuccessCheck>` (drawn-in confirmation). Reduced motion is honoured globally via `<MotionConfig reducedMotion="user">` in `main.jsx`, so components don't guard individually.

### Design system

Two small primitive sets: `components/ui/kit.jsx` for app pages (`Field`, `Input`, `PasswordInput`, `Button`, `Alert`, …) and `components/landing/` for the marketing tree (shadcn-style). Both are token-backed, so they theme automatically.

### Data

- **Backend API** (`src/api/`, base from `VITE_API_URL`) — routes, orders, auth, profile, affiliate, reviews, news, admin.
- **CoinGecko** (`components/landing/use-markets.ts`) — the landing's live market table; polls every 30s, keeps the last good data on a failed refresh.

---

## Routes

| Path | Surface | Notes |
|------|---------|-------|
| `/overview` | Landing | Marketing home (default redirect from `/`) |
| `/news` `/about` `/contacts` `/rules` `/kyc` | Marketing | Content pages (Rules/KYC are long-form legal) |
| `/exchange` | Funnel | Swap card + order creation |
| `/order/:orderId` | Funnel | Live order tracking (auth-gated) + support chat |
| `/login` `/register` `/forgot-password` `/reset-password` `/verify-email` | Auth | Account flows |
| `/orders` `/profile` `/affiliate` | Account | Protected (require login) |
| `/admin` | Admin | Full operator panel (admin token) |

`MainLayout` (in `App.jsx`) wraps the site pages with the floating navbar, a per-route page transition, the footer, and the chat widget. The landing (`/overview`) and admin (`/admin`) render their own shells.

---

## Conventions & notes

- **Path alias:** `@/` → `src/` (configured in `vite.config.js`). App `.jsx` files often use relative imports; `.ts`/`.tsx` use `@/`.
- **Tailwind v4 is CSS-first** — there is no `tailwind.config.js`. Add tokens/utilities in `index.css`. Raw theme vars must hold **complete** color values (hex/oklch), never bare channels, so `bg-brand/10` compiles to a valid `color-mix`.
- **Persisted keys:** `ss_theme`, `ss_lang`, `ss_token` / `ss_admin_token`, `ss_admin_tab`, `ss_chat_state`.
- **Dev over LAN / tunnel:** the dev server binds `0.0.0.0` and allow-lists `*.trycloudflare.com` (see `vite.config.js`), so it's reachable from another machine or a Cloudflare quick tunnel.

---

## Deployment (production)

```bash
cd frontend
npm ci
npm run build          # outputs static assets to dist/
```

Serve `dist/` from any static host (nginx, a CDN, etc.). Set `VITE_API_URL` to the real backend API origin at build time, and ensure that origin allows CORS from the frontend (or serve both behind the same domain).
