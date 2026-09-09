# NaijaNest

A contribution-management platform for Nigerian daily savings collections
(*ajo* / *esusu*).

Customers contribute cash to an assigned collector every day. NaijaNest is the
record of those contributions — not a payment processor. No money moves through
the app. What it does is make the ledger something a customer can check
themselves, instead of a notebook they have to take on trust.

Built by [HoblemercyTech](https://hoblemercy-tech.vercel.app/).

---

## What it does

**Customers** choose a daily amount and a duration, contribute cash to their
collector, and watch every day appear as paid or unpaid with the time it was
recorded. They can withdraw their balance whenever they want it.

**Collectors** work a daily round on their phone: two taps to record a payment,
activate cycle requests, confirm withdrawals, and log the cash they hand to the
office.

**Admins** see the whole operation — every cycle, contribution, withdrawal and
cash movement, plus an append-only audit log of who did what.

### The rule that matters most

**A missed day is not a debt.** If someone pays 27 days of a 30-day cycle, they
withdraw exactly what they paid. Nobody can charge them for the three they
missed. That rule is enforced in the database, not just described in the UI.

---

## Stack

| | |
|---|---|
| Frontend | React 18, React Router, vanilla CSS |
| Build | Vite |
| Backend | Supabase — PostgreSQL, Auth, Storage, Row Level Security |
| Email | Resend, via a Supabase Edge Function |
| Charts | Recharts |

No CSS framework and no component library. Styling is hand-written design
tokens in `src/styles/tokens.css`.

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure

Copy `.env.example` to `.env.local` and fill in two values from your Supabase
project (Settings → API):

```
VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Only `VITE_`-prefixed variables reach the browser. Never give that prefix to the
service role key — it would be compiled into the JavaScript bundle and readable
by anyone.

### 3. Set up the database

Run the migrations **in order** in the Supabase SQL editor:

```
0001_schema.sql      tables, enums, constraints, balance views
0002_rls.sql         row level security
0003_functions.sql   the financial RPCs
0004_storage.sql     avatars bucket
0005_avatar_rpc.sql  self-service profile photos
0006_roles.sql       guarded role changes
0007_dispatch.sql    notification dispatch support
```

### 4. Make yourself an admin

Sign up through the app first, then run once:

```sql
update profiles set role = 'ADMIN' where email = 'you@example.com';
```

Sign out and back in. Everything after that is done through the UI: create
contribution plans, promote a collector, assign customers.

### 5. Run it

```bash
npm run dev
```

---

## How it's put together

```
src/
├── styles/          tokens, base, shared component classes
├── lib/             supabase client, formatting, errors, CSV
├── hooks/           data fetching, one module per role
├── context/         auth session and profile
├── routes/          guards
├── components/
│   ├── ui/          primitives — no Supabase imports
│   └── layout/      app shell
└── pages/
    ├── auth/  user/  collector/  admin/

supabase/
├── migrations/      the SQL above
└── functions/       Edge Functions

scripts/
└── test-rls.mjs     RLS verification
```

**The rule that keeps it clean:** anything in `components/ui/` takes props and
renders. It never imports Supabase. Data lives in `pages/` and `hooks/`, so a
`Button` can't accidentally trigger a network call.

---

## The security model

Worth understanding before changing anything, because it is deliberately strict.

**RLS grants `SELECT` only.** There is no client-writable path to any financial
table. Every mutation goes through a `SECURITY DEFINER` PostgreSQL function that
re-checks the caller's role, locks the rows it touches, and writes an audit
entry. If someone lifts the anon key out of the bundle and hits PostgREST
directly, the worst they can do is read their own rows.

That produces some specific consequences:

- **Amounts are never client-supplied.** `nn_record_contribution` takes a
  contribution *day* id and writes that day's scheduled amount. A collector
  cannot record ₦2,000 against a ₦1,000 plan.
- **`nn_request_withdrawal` takes no amount at all.** It locks the cycle,
  computes the balance, and inserts that. Concurrent requests serialise on the
  row lock.
- **`nn_mark_withdrawal_paid` re-verifies the balance at payout time** and
  closes the cycle in the same transaction. A paid withdrawal is the only thing
  that ever reduces a balance.
- **The signup trigger hard-forces `role = 'USER'`.** Client metadata is never
  trusted for role.
- **`audit_logs` has a trigger that rejects UPDATE and DELETE.** Not even an
  admin can rewrite history.

### Rules held as constraints, not application logic

| Rule | Where it lives |
|---|---|
| One open cycle per customer | partial unique index |
| One open withdrawal per cycle | partial unique index |
| Cycle terms immutable after creation | trigger |
| Rejections require a reason | check constraint + RPC guard |
| One active collector per customer | partial unique index |
| No negative money anywhere | check constraints |

`COMPLETED` counts as an open cycle on purpose — the balance stays withdrawable
until a payout closes it, so nobody starts cycle 2 while cycle 1's money is
still sitting there.

### Verify it

```bash
npm run test:rls
```

Provisions throwaway accounts and has each attack the others through PostgREST
with the anon key, bypassing React entirely. Checks whether a customer can
promote themselves to admin, whether collector B can read collector A's
customers, whether anyone can forge an audit entry. Needs
`SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, and everything is deleted
afterwards. Run it against a development project.

---

## Email notifications

One Edge Function, `dispatch-notifications`, polls for unsent notifications and
delivers them through Resend. Setup is in
[`EDGE-FUNCTIONS.md`](./EDGE-FUNCTIONS.md).

Polling rather than a per-insert webhook: a collector recording forty payments
becomes one run, and a provider outage retries on the next tick instead of
losing the message. `email_sent_at` is stamped only after a confirmed send, so
overlapping runs never double-send.

Telegram alerts for collectors are built and disabled. The tables and RPCs are
in the migrations; turning them on is a deploy, not a schema change.

---

## Deploying

```bash
npm run build
```

`vercel.json` is included and handles the SPA rewrite — without it, refreshing on
`/dashboard` returns a 404.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment
variables. Nothing else. Then in Supabase:

- **Authentication → URL Configuration** → set Site URL to your live domain and
  add `https://yourdomain.com/reset-password` as a redirect URL
- **Edge Functions → Secrets** → point `APP_URL` at the live domain, or email
  buttons keep linking to localhost

Routes are code-split by role, so a collector on market-stall data doesn't
download the admin analytics bundle.

---

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # eslint
npm run test:rls   # RLS verification
```

---

## Not built

- **Staff-created customer accounts.** Collectors can't create a customer and
  email them an invite. The current flow — people sign up themselves, an admin
  promotes them — means nobody ever handles another person's password.
- **Telegram alerts.** Written, deployable, currently off.
- **`/admin/settings`.** In the original spec's route list with nothing concrete
  behind it.