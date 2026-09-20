# Market OS mobile app

React Native (Expo Router) app covering both client roles from the product
plan — the trader ("simple") experience and the association admin
("sophisticated") experience — in one app, gated by an admin invite code
rather than shipped as two separate products. Mirrors the structure of the
per-merchant `financial-os-ng/mobile` app (same component/API-layer
patterns), pointed at `market-os/backend` instead.

## Status

- [x] Auth (register trader account, login)
- [x] Home — market summary, next due + pay action, recent announcements
- [x] Dues — full invoice list, mark-as-paid per pending/overdue invoice
- [x] Announcements — full feed for the trader's market
- [x] Trader profile — view/edit (name, phone, category, emergency contact)
- [x] **Admin** tab — see "Becoming an admin" and "Admin dashboard" below
- [x] Verified end-to-end in a browser preview (Expo web) against a live
      Supabase-backed API, including two accounts co-administering two
      markets, generating dues, adding an expense, posting an announcement,
      and the trader side picking all of it up
- [ ] Savings, credit, insurance, voting, disputes — later product phases,
      not part of this app yet (see `../README.md`'s roadmap)

Registering a trader account only creates the `Trader` + `User` records —
it does not join a market as a member. There's no self-service "find my
market" flow yet, so the Home/Dues/Announcements screens show a "you're
not in a market yet" empty state until the market association's admin
adds the trader (Admin → Members → Add member, by email).

## Becoming an admin

The **Admin** tab is visible to every account, but starts empty: it's the
code-entry gate itself; there's no separate "admin build" or hidden
setting. Two ways in:

1. **Create a market** — becomes its primary admin immediately, and a
   random `adminInviteCode` is generated for it (shown once, on the
   dashboard's "Invite a co-admin" card — fetch it again anytime via
   "Show invite code").
2. **Join with an admin code** — redeem another market's invite code to
   become a co-admin of it, with identical rights to whoever created it.
   An account already administering a market can do this too (there's an
   "Administer another market" box on the admin home screen for exactly
   that) — one account can co-administer several markets; a switcher
   (chips at the top of Admin) appears once it does.

There's no separate "secretary" or "treasurer" role — a co-admin can do
everything the creator can, including seeing and re-sharing the invite
code. Rotating a leaked code isn't implemented; the only mitigation right
now is that the code is never displayed by any general market read (see
`market-os/backend`'s README), only the dedicated invite-code endpoint.

## Admin dashboard

Once an account administers at least one market, `Admin` shows:

- **Overview** — member count, balance, dues collected/outstanding
- **Members** — list, plus "Add member" (looks a trader up by the email
  they registered with via `GET /trader/lookup`, then adds them with an
  optional section/stall number — the trader must already have created
  their own account first)
- **Levies & generate dues** — create a levy (name, amount, frequency),
  activate/deactivate it, and generate one invoice per active member for
  a given period
- **All dues** — every invoice across every member, with status
- **Market expenses** — list + add, by category
- **Announcements** — compose new ones, see the full feed

Every one of these sub-screens is pushed with the selected market's id as
a route param from the Admin overview (so the member switcher there
actually changes what Members/Levies/etc. show) — opening one directly
without that param falls back to the account's first administered market.

## Running it

```bash
cd market-os/mobile
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_URL if not localhost:3001
npm run web             # or `npm start` for the Expo dev tools / device
```

Needs `market-os/backend` running (`npm run start:dev` in that folder,
listening on port 3001 by default).

## Notes from building this

- **Stale-response race condition**: Expo Router keeps tab screens
  mounted across switches, so an older, slower fetch can resolve after a
  newer one and overwrite the UI with stale data (caught this when a
  just-paid invoice briefly showed "Pending" again after switching tabs).
  Every screen's `load()` guards against this with a request-sequence
  number (see `app/(tabs)/*.tsx` and `app/(tabs)/admin/*.tsx`) — bump a
  ref on each call, drop any response whose sequence number no longer
  matches the latest.
- A plain web app (rather than folding the admin experience into this
  Expo project) would arguably fit an at-a-desk chairman/treasurer better
  than a phone app — that trade-off was made deliberately for one shared
  codebase and one login, not because it's clearly the better UX call.
