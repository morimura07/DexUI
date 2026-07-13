# SwiftSwap — Backend API

SwiftSwap is a fully-functional automatic crypto exchange — crypto-to-crypto, crypto-to-fiat, and fiat-to-crypto across 90+ pairs, no account needed to swap. It's modelled on BeeSwap but rebuilt from scratch (React + Vite, PHP 8.4, PostgreSQL) with our own improvements. The core loop: a user picks a route, enters an amount, and we calculate the payout using stored rates, min/max limits, and a reserve system that blocks orders exceeding what we can actually pay out. Orders flow through clear states (Pending → Payment Received → Completed/Expired), all managed via a full admin panel. Our main departure from BeeSwap is support: instead of pushing users to a Telegram DM, we keep them in-app — fiat payments and support needs trigger an in-app live chat, auto-create a support ticket, and bridge the conversation to our team's Telegram group (customer stays on-site; team still gets notified, can reply, refund, close cases, and receive screenshots).

This is the **backend**: a custom, framework-free PHP REST API.

---

## Tech stack

- **PHP 8.4** (min 8.1) — no framework; a small custom core (Router, Request, Database, Middleware)
- **PostgreSQL** — primary datastore (PDO, prepared statements)
- **vlucas/phpdotenv** — environment config
- **Groq API** — powers the in-app AI assistant (SwiftBot)
- **Telegram Bot API** — support bridge (messages, replies, screenshots)
- **Composer** — PSR-4 autoloading under the `SwiftSwap\` namespace

---

## Project structure

```
backend/
├── public/
│   └── index.php              # Entry point — bootstraps the app, dispatches routes
├── src/
│   ├── Core/
│   │   ├── App.php            # Application bootstrap
│   │   ├── Router.php         # Route matching + dispatch
│   │   ├── Request.php        # Request wrapper + validation
│   │   ├── Database.php       # PDO singleton, query helpers
│   │   ├── Mailer.php         # Transactional email (verify, reset, order events)
│   │   └── Notifier.php       # Notification helpers
│   ├── Middleware/
│   │   └── Auth.php           # Bearer-token auth guard
│   ├── Controllers/
│   │   ├── AuthController.php          # User + admin auth, email verify, password reset
│   │   ├── AdminController.php         # Admin panel: stats, orders, users, routes, tickets
│   │   ├── ExchangeRouteController.php # Public route lookups
│   │   ├── ExchangeOrderController.php # Order create/lookup/status, verification
│   │   ├── UserController.php          # Profile, wallets, API keys, files, 2FA, FCM
│   │   ├── AffiliateController.php     # Referral/partner program
│   │   ├── PublicController.php        # Reviews, news, FAQ, rules, routes, site content
│   │   ├── ChatController.php          # SwiftBot AI + Telegram support bridge
│   │   └── TestController.php          # Health/diagnostics
│   └── Routes/
│       └── ApiRoutes.php      # All route registrations (single source of truth)
├── database/
│   ├── migrations/            # Ordered SQL migrations
│   ├── schema.sql             # Full schema snapshot
│   ├── dump.sql               # Data dump
│   ├── seed.php               # Seeder
│   └── cleanup.php            # Maintenance
├── composer.json
└── .env.example               # Copy to .env and fill in
```

---

## Getting started

```bash
cd backend
composer install
cp .env.example .env          # then edit .env (see below)
```

Create the database and run migrations in order:

```bash
createdb swiftswap
psql -U postgres -d swiftswap -f database/migrations/001_initial_schema.sql
psql -U postgres -d swiftswap -f database/migrations/003_support_tickets_admin_reply.sql
psql -U postgres -d swiftswap -f database/migrations/004_dedupe_routes.sql
php database/seed.php          # optional: seed base data
```

Run the dev server:

```bash
php -S localhost:8000 -t public/
```

The API is now at `http://localhost:8000/api/v1`.

---

## Environment variables (`.env`)

| Key | Description |
|-----|-------------|
| `APP_ENV` | `local` or `production` |
| `APP_DEBUG` | `true` returns error messages in responses |
| `APP_URL` | Backend base URL |
| `FRONTEND_URL` | Frontend origin (CORS + email links) |
| `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | PostgreSQL connection |
| `MAIL_DRIVER` | `smtp` to send, `log` to write to `storage/logs/mail.log` |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP credentials |
| `ADMIN_EMAIL` | Admin/notification recipient |
| `GROQ_API_KEY` | Groq API key (SwiftBot) |
| `GROQ_MODEL` | Model id (default `llama-3.3-70b-versatile`) |
| `TELEGRAM_BOT_TOKEN` | Support bot token |
| `TELEGRAM_SUPPORT_GROUP_ID` | Target support group chat id |
| `NEWS_API_KEY` | Crypto news feed key |

> **Never commit `.env`.** Only `.env.example` is tracked. Rotate any key that leaks.

---

## Database tables

`users`, `personal_access_tokens`, `currencies`, `exchange_routes`, `exchange_orders`, `wallets`, `wallet_transactions`, `api_keys`, `reviews`, `support_tickets`, `news`, `news_comments`, `faq_groups`, `faqs`, `rules`, `static_pages`, `contacts`, `verifications`, `web_alerts`, `partner_blocks`, `social_networks`, `products`, `fcm_tokens`, `visits`.

Key columns worth knowing:
- **`exchange_routes.rate`** — stored as a "TO per 1 FROM" multiplier.
- **`exchange_routes.reserve`** — amount of the TO (receive) currency available to pay out; `0` = no limit.
- **`exchange_routes.min_amount` / `max_amount`** — limits enforced server-side on order creation.
- **`support_tickets.status`** — `OPEN` → `IN_PROGRESS` → `RESOLVED` / `CLOSED`.
- **`support_tickets.order_id`** — links refund tickets to the originating order.

---

## Conventions

- **Base path:** all routes are served under `/api/v1` (e.g. `POST /api/v1/public/exchanger/order/create`).
- **Auth:** authenticated routes expect `Authorization: Bearer <token>`. Admin routes additionally require an admin account.
- **Responses:** JSON, shaped `{ "success": true, "data": {...} }` or `{ "success": false, "error": { "code": "...", "message": "..." } }`.
- **Scope tags below:** **Public** = no auth · **User** = bearer token · **Admin** = admin token.

---

## API reference

Every registered route is listed below, grouped by domain. Nothing is omitted.

### Chat & support (Public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/public/chat` | SwiftBot AI chat (Groq). Emits a handoff when a human is needed. |
| POST | `/public/chat/refund` | Open a refund request tied to a **real order** (looks it up, snapshots it onto a ticket, alerts Telegram). |
| POST | `/public/chat/upload` | Upload a screenshot; validates + forwards it to the support Telegram group (opens a ticket if none). |
| POST | `/public/chat/webhook` | Telegram webhook — receives agent replies and `/close` commands. |
| GET | `/public/chat/reply` | Poll for the latest agent reply + ticket status. |

### Reviews, contact & routes proxy (Public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/public/contact/submit` | Contact form submission (notifies Telegram). |
| POST | `/public/reviews/submit` | Submit a customer review (pending moderation). |
| GET | `/public/reviews` | List approved reviews. |
| POST | `/public/beeswap/sync` | Route-sync hook (currently a no-op; routes are local). |
| GET | `/public/beeswap/routes` | List all exchange routes from our DB (rate, min/max, reserve). |
| GET | `/public/beeswap/image` | Currency-icon image proxy. |

### Diagnostics (Public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/test/health` | Health check. |
| GET | `/test/ip` | Report caller IP. |
| GET | `/test/rest/request` | REST connectivity probe. |
| GET | `/test/rest/mongodb` | Datastore probe. |

### Admin auth (Public → issues admin session)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/auth/sign-in` | Admin login. |
| POST | `/admin/auth/socket/get/token` | Issue admin socket token. |

### Admin panel (Admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Dashboard stats. |
| GET | `/admin/orders` | List orders. |
| PUT | `/admin/orders/update` | Update an order (status, etc.). |
| GET | `/admin/users` | List users. |
| PUT | `/admin/users/update` | Update a user. |
| GET | `/admin/wallets` | List wallets. |
| PUT | `/admin/wallets/update` | Update a wallet. |
| GET | `/admin/routes` | List exchange routes (full detail incl. reserve). |
| POST | `/admin/route/create` | Create a route (rate, min/max, fee, reserve). |
| PUT | `/admin/route/update` | Update a route. |
| DELETE | `/admin/route/delete` | Delete a route. |
| GET | `/admin/currencies` | List currencies. |
| GET | `/admin/support/tickets` | List support tickets. |
| PUT | `/admin/support/tickets/update` | Update ticket status (incl. RESOLVED/CLOSED). |
| POST | `/admin/support/tickets/reply` | Reply to a ticket. |
| GET | `/admin/reviews` | List reviews (all statuses). |
| PUT | `/admin/reviews/update` | Approve/reject/update a review. |

### User auth (Public → issues user session)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/user/auth/register` | Register; sends verification email. |
| GET | `/user/auth/register/confirm` | Confirm email from token. |
| POST | `/user/auth/register/resend` | Resend verification (enumeration-safe). |
| POST | `/user/auth/sign-in` | Login. |
| POST | `/user/auth/sign-in/telegram` | Telegram-based sign-in. |
| POST | `/user/auth/reset-password` | Request password reset. |
| GET | `/user/auth/reset-password/redirect` | Reset-link redirect handler. |
| POST | `/user/auth/reset-password/is-valid` | Validate a reset token. |
| POST | `/user/auth/reset-password/confirm` | Set a new password. |
| GET | `/user/auth/session/get` | Get current session. |
| DELETE | `/user/auth/session/destroy` | Logout. |
| POST | `/user/auth/socket/get/token` | Issue user socket token. |

### API keys (User)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/user/auth/api/create` | Create an API key. |
| GET | `/user/auth/api/get/list` | List API keys. |
| DELETE | `/user/auth/api/delete` | Delete an API key. |

### Exchange routes (Public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/public/exchanger/route/get` | List all routes. |
| GET | `/public/exchanger/route/get/one` | Get one route. |
| GET | `/public/exchanger/route/get/one/by-xml` | Get one route by currency XML code. |
| GET | `/public/exchanger/route/get/one/by-friendlyURL` | Get one route by friendly URL. |
| GET | `/public/exchanger/route-v2/get` | Route list (v2 shape). |
| GET | `/public/exchanger/favorite/get` | Featured/favorite routes. |

### Exchange orders (Public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/public/exchanger/order/create` | Create an order (enforces min/max + reserve, email-verified gate). |
| POST | `/public/exchanger/order/files/create` | Attach files to an order. |
| GET | `/public/exchanger/order/get-lasts` | Recent orders (ticker). |
| GET | `/public/exchanger/order/get` | Get an order (owner/admin only). |
| PUT | `/public/exchanger/order/update-status` | Update order status. |

### Verification (Public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/public/exchanger/verification/create` | Start a verification. |
| GET | `/public/exchanger/verification/find` | Find a verification. |
| GET | `/public/exchanger/verification/find/by-order-id` | Find verification by order id. |

### Orders (User)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/user/exchanger/order/chart` | Order volume chart data. |
| GET | `/user/exchanger/order/history` | The user's order history. |
| PUT | `/user/exchanger/order/update/owner` | Claim/assign order ownership. |

### User verification (User)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/user/verification/get` | List verifications. |
| GET | `/user/verification/get/one` | Get one verification. |
| POST | `/user/verification/init` | Initialize verification. |

### Profile (User)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/user/profile/details/get` | Get profile. |
| POST | `/user/profile/edit/main` | Edit main profile fields. |
| PUT | `/user/profile/edit/email` | Change email (sends confirmation). |
| GET | `/user/profile/edit/email/confirm` | Confirm email change. |
| PUT | `/user/profile/edit/password` | Change password. |
| PUT | `/user/profile/edit/partner-link` | Set affiliate/partner link. |
| GET | `/user/profile/limits/get` | Get account limits. |
| PUT | `/user/profile/access/block` | Block account access. |
| DELETE | `/user/profile/access/delete` | Delete account. |

### OTP / 2FA (User)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/user/profile/secure/otp/create` | Begin TOTP setup. |
| POST | `/user/profile/secure/otp/confirm` | Confirm/enable TOTP. |
| DELETE | `/user/profile/secure/otp/delete` | Disable TOTP. |

### Wallets (User)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/user/wallets/address` | Get deposit address. |
| GET | `/user/wallets/balance` | Get balance. |
| GET | `/user/wallets/transaction/list` | List wallet transactions. |

### Files (User)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/user/files/upload/image` | Upload an image. |

### FCM notifications (User)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/user/notify/fcm/register` | Register an FCM device token. |
| DELETE | `/user/notify/fcm/remove` | Remove an FCM device token. |

### Affiliate / partner program (User)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/user/affiliate/basic/get` | Basic affiliate summary. |
| GET | `/user/affiliate/today/get` | Today's affiliate stats. |
| GET | `/user/affiliate/orders` | Affiliate-attributed orders. |
| GET | `/user/affiliate/chart` | Affiliate earnings chart. |
| GET | `/user/exchanger/partner-route/get` | List partner routes. |
| GET | `/user/exchanger/partner-route/get/one` | Get one partner route. |
| GET | `/user/exchanger/partner-route/statistic` | Partner route stats. |
| PUT | `/user/profile/edit/partner-link` | Set partner link (also under Profile). |
| POST | `/user/exchanger/order/partner/create` | Create a partner order. |
| GET | `/user/exchanger/order/partner/get` | Get a partner order. |
| GET | `/user/exchanger/order/partner/history` | Partner order history. |

### Site content — reviews, news, FAQ, rules, pages (Public unless noted)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/public/reviews/create` | Create a review. |
| GET | `/public/reviews/get` | Get reviews. |
| POST | `/public/ticket/create` | Create a support ticket. |
| GET | `/public/news/crypto` | Crypto news feed. |
| GET | `/public/news/list/basic` | News list (basic). |
| GET | `/public/news/list/full` | News list (full). |
| GET | `/public/news/get/one` | Get one news article. |
| GET | `/public/news/comment/get` | Get news comments. |
| POST | `/user/news/comment/create` | Create a news comment *(User)*. |
| DELETE | `/user/news/comment/delete` | Delete a news comment *(User)*. |
| GET | `/public/faq/get/one` | Get one FAQ. |
| GET | `/public/faq/get/list` | List FAQs. |
| GET | `/public/faq/get/group` | FAQs grouped. |
| GET | `/public/rule/list` | List rules. |
| GET | `/public/rule/get` | Get a rule. |
| GET | `/public/site/page/static/list` | List static pages. |
| GET | `/public/site/page/static/content` | Static page content. |
| GET | `/public/contacts/list` | Contact channels. |
| GET | `/public/web-alerts/get/list` | Site-wide alerts. |
| GET | `/public/partners-block/list` | Partner blocks. |
| GET | `/public/social-networks/list` | Social links. |
| GET | `/public/products/list` | Products list. |
| GET | `/public/products/one` | Get one product. |
| GET | `/public/server/lang/all` | Language strings. |
| GET | `/public/site/status/get` | Site status. |
| POST | `/public/visits/register` | Register a page visit (analytics). |

---

## Notable features

- **Reserve system.** Each route holds a `reserve` in the receive currency. Orders that would pay out more than the reserve are hard-blocked server-side (`INSUFFICIENT_RESERVE`); `0` means no limit. Admin sets/tops-up reserves manually.
- **Email verification gate.** Users can browse and log in unverified, but cannot create an order until verified.
- **Order-access security.** `order/get` requires the owner's bearer token or admin — no open order lookups by id.
- **In-app support bridge.** SwiftBot (Groq) handles chat; on handoff it opens a `support_tickets` row and alerts the Telegram group. Agents reply from Telegram (`SS-XXXXX: message`) and close with `/close SS-XXXXX`. Customers never leave the site.
- **Refund requests.** Always tied to a real order — the API validates the order, snapshots it onto a ticket, and notifies support.
- **Screenshot upload.** Customers attach images in chat; the API validates and forwards them to the support group via Telegram `sendPhoto`.

---

## Deployment (production)

```bash
cd /var/www/swiftswap
git pull origin main
systemctl reload php8.4-fpm      # PHP is interpreted — reload clears opcache
```

The API runs behind nginx + PHP-FPM. Apply new migrations manually when the schema changes.

### Local dev gotchas (Windows / PowerShell)
- Use `-P pager=off` with `psql` (PowerShell has no `| cat`).
- The PHP built-in server can drop the `Authorization` header in some setups.
- Escape `$` in PowerShell strings.