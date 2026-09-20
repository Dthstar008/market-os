# Market OS

A **Market Operating System**: digital infrastructure for a market
association (chairman/secretary/treasurer, section leaders, traders), not
another per-merchant fintech app. The association is the customer and
distribution channel; individual traders are users brought in through it.

This is a standalone product — its own backend, database and deploy —
separate from the `financial-os-ng` project's per-business financial OS for
individual merchants. A trader can plausibly use both (their own shop's
books, and their market's collections), but the two don't share a database
or auth: that project has its own `Business`/`User` model per merchant,
while Market OS has its own `Trader`/`User` model scoped to market
membership.

## Why this shape

Convincing 1,500 individual traders to install an app is a 1,500-times
acquisition problem. Convincing one market association to require MarketOS
for all its members turns it into a single partnership. So the product is
built around the association's own workflows first (who's a member, who
owes what, what did the association spend), and only later layers in
trader-facing financial services (savings, credit, insurance) through
licensed partners — this codebase is the technology and distribution layer,
not a bank.

## Status: Phase 1 MVP

- [x] **Trader identity** — a digital profile per trader (name, phone,
      category, photo, emergency contact) — see [`Trader`](backend/src/entities/trader.entity.ts)
      and `GET/PATCH /trader/me`
- [x] **Markets** — an association account administers a `Market`; a
      `Trader` joins it via a `MarketMembership` (section, stall number,
      status)
- [x] **Levies** — recurring or one-time due types a market defines (dues,
      sanitation, security, development levy, ...)
- [x] **Dues collection** — generate one invoice per active member per
      levy+period; a trader pays their own, the admin sees all
- [x] **Market accounting** — dues collected/outstanding, expenses by
      category, balance
- [x] **Announcements** — association broadcasts to its members, replacing
      the WhatsApp-group message that disappears
- [x] **Trader mobile app** — React Native/Expo app covering the above from
      a trader's side (dues, pay, announcements, profile) — see
      [`mobile/README.md`](mobile/README.md); verified end-to-end in a
      browser preview against the live API
- [x] **Admin dashboard** — built into the same app rather than as a
      separate product: an "Admin" tab that any account can unlock by
      creating a market or redeeming another market's `adminInviteCode`,
      then covers member directory + add-by-email, levy management +
      generate dues, the full dues ledger, market expenses, and an
      announcement composer — see [`mobile/README.md`](mobile/README.md)
- [ ] Savings, credit, insurance (through licensed partners), voting,
      disputes — later phases, see roadmap below

## Roadmap

```
Phase 1 — Digital Market Registry     Trader identity + market/section/stall mapping     [MVP, built]
Phase 2 — Collections                 Dues + levies + receipts + reconciliation           [MVP, built]
Phase 3 — Accounting                  Income + expenditure + financial reports            [MVP, built]
Phase 4 — Financial Services          Savings + cooperative finance
Phase 5 — Credit                      Loans, underwritten by licensed lending partners
                                       using the trader's membership/payment history
Phase 6 — Protection                  Insurance, distributed through the association
Phase 7 — Governance                  Voting + announcements + disputes
                                       (announcements built; voting/disputes not started)
Phase 8 — Business Intelligence       Market analytics, trader financial profiles
```

Deliberately **not** building yet: MarketOS as a payment rail. A trader
should keep receiving money however they already do (bank transfer, POS,
cash) — MarketOS is a system of record and management layer above that, not
a replacement for it. This keeps adoption friction low and avoids taking on
regulated payments/lending/insurance directly; those come through licensed
partners once the platform has real distribution and data.

## Architecture

```
                    MARKET ASSOCIATION
                           |
                           v
                  +-----------------+
                  |    MARKET OS    |
                  +-----------------+
                           |
        +------------------+------------------+
        v                  v                  v
   MEMBERSHIP          PAYMENTS          ACCOUNTING
   (Trader,             (Levy,            (dues + expenses
    MarketMembership)    DuesInvoice)       summary)
        |
        +---- Announcements  [built]
        +---- Savings        [not started]
        +---- Loans          [not started]
        +---- Insurance      [not started]
        +---- Voting         [not started]
        +---- Disputes       [not started]
```

## Running the backend

1. Start Postgres (this project defaults to port `5433` to avoid colliding
   with a default local Postgres on `5432`), or point `.env` at a hosted
   Postgres (e.g. Supabase) instead:
   ```bash
   cd market-os
   docker compose up -d
   ```
2. Install dependencies and configure env:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
3. Start the API in watch mode:
   ```bash
   npm run start:dev
   ```
   Listens on `http://localhost:3001`. Tables auto-create from entities in
   development (`synchronize: true` — switch to migrations before
   production).
4. Optional: seed a demo market (association chairman, one trader member,
   a monthly dues levy, a generated + paid invoice, a sample announcement):
   ```bash
   npm run seed
   ```
   Logs in as `chairman@computervillage-market.ng` (admin) or
   `chidi@computervillage-market.ng` (trader), both `password123`.

## API overview

All routes except `/auth/*` and `/health` require
`Authorization: Bearer <token>` from `/auth/login` or `/auth/register`.
Registering creates both a `User` account and a `Trader` profile — a market
admin is, underneath, also a trader account, matching how the seed's
chairman account works.

A market administers itself through whoever's `adminUserId` matches it (the
creator) plus anyone who has redeemed its `adminInviteCode` (a `MarketAdmin`
row) — see "Multiple admins per market" below. Everyone else needs an
active `MarketMembership` to read that market's data.

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login` |
| Trader profile | `GET/PATCH /trader/me`, `GET /trader/me/markets` (the markets this trader belongs to — the admin-side equivalent is `/markets/mine` below), `GET /trader/lookup?email=` (resolve a trader's id from their email, for adding them as a member) |
| Markets | `POST /markets`, `POST /markets/join-as-admin` (body `{ code }`), `GET /markets/mine`, `GET/PATCH /markets/:marketId`, `GET /markets/:marketId/invite-code` (admin-only) |
| Members | `POST/GET /markets/:marketId/members`, `GET /markets/:marketId/members/me`, `PATCH /markets/:marketId/members/:membershipId` |
| Levies | `POST/GET /markets/:marketId/levies`, `PATCH /markets/:marketId/levies/:levyId` |
| Dues | `POST /markets/:marketId/dues/generate`, `GET /markets/:marketId/dues`, `GET /markets/:marketId/dues/mine`, `POST /markets/:marketId/dues/:invoiceId/pay` |
| Market expenses | `POST/GET /markets/:marketId/expenses` |
| Announcements | `POST/GET /markets/:marketId/announcements` |
| Accounting | `GET /markets/:marketId/accounting/summary` |

Collecting dues for a period is two steps: the admin defines a `Levy` once
(name, amount, frequency), then calls `dues/generate` with a `period` label
(e.g. `"2026-09"`) — this creates one `pending` `DuesInvoice` per active
member for that levy+period, skipping any that already exist so it's safe
to call again. A trader marks their own invoice paid via
`dues/:invoiceId/pay`; there's no payment gateway wired up yet, so this is
a self-reported receipt (see "Deliberately not building yet" above).
`accounting/summary` rolls dues collected/outstanding and market expenses
into a balance.

### Multiple admins per market

`POST /markets` generates a random `adminInviteCode` for the new market,
returned once in that creation response (it's stripped from every other
market read — fetch it again later via `GET /markets/:marketId/invite-code`,
admin-only). Anyone who calls `POST /markets/join-as-admin` with that code
becomes a co-admin (a `MarketAdmin` row) with the exact same rights as the
original creator — there's no distinction between "primary" and "co-admin"
beyond who created the market. This is how a chairman brings in a secretary
or treasurer as a second administering account, without sharing a login.

## Design notes

- **Money** stored as `decimal(14,2)` Naira.
- **Multi-tenancy** is per-market for admin data, and per-trader for a
  trader's own view — enforced by `MarketsService.assertAdmin` /
  `assertAccess` on every route, not by a shared-nothing database per
  tenant.
- **Trader identity is market-agnostic**: a `Trader`'s core profile (name,
  phone, category, photo) lives independently of any `MarketMembership`,
  so the same trader profile could join a second market later without
  re-entering identity data — only membership-specific fields (section,
  stall, status) are re-entered per market.
