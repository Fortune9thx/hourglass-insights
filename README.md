# PRIMACY

A permissionless hourly primacy market on GenLayer Studio Next: three
comparable instruments race each completed UTC hour, and validators
independently fetch three locked venues to agree on which one led.

**Live**: https://hourglass-insights.vercel.app
**Protocol/contract**: [Desktop/primacy](../primacy) (this repo is the
frontend only — see that repo's README for the contract, tests, and
docs).
**Contract address**: not deployed yet. Studio Dev is currently unable
to load any contract over ~305 bytes — see
[`../primacy/docs/STATUS.md`](../primacy/docs/STATUS.md) for the full
diagnosis. The UI is live and fully wired; it is honestly empty until a
contract address is set.

## What this is

PRIMACY settles one question: *which of three comparable instruments had
the highest completed-hour return, across three locked public venues?*
Every instrument is a USDT-M index return over a completed UTC hour —
never a stock, never NYSE. See
[`../primacy/docs/architecture.md`](../primacy/docs/architecture.md) for
how settlement actually reaches consensus (validators independently
re-fetch Binance/Bitget/Gate and derive their own answer; nothing is
trusted from a single caller's claim).

## This app is a live product, not a demo

There is no mock data anywhere in this codebase. `src/lib/primacy/client.ts`
is fail-closed by construction:

- No `VITE_CONTRACT_ADDRESS` configured, or the address has no code on
  chain right now (a real `eth_getCode` check, not just "an env var is
  set") → every list read resolves to `[]`, every single-record read
  resolves to `null`, every write throws. The app shows honest empty
  states ("No hours on chain yet.") and a banner naming the exact reason
  (not deployed / no code at address / RPC unreachable).
- A live contract → every read and write goes through `genlayer-js`
  against Studio Next (chain 61997), for real. A failed RPC call throws
  or resolves to an empty list — it never falls back to fabricated data.
- Every write (create hour, place bet, settle, claim, refund, reclaim
  bonds) is disabled until a real injected wallet is connected, on chain
  61997, against a contract confirmed live — with the specific reason
  shown, not just "disabled."

## Stack

Vite + TanStack Start + Nitro, via `@lovable.dev/vite-tanstack-config`.
Deployed on Vercel — Nitro's own platform auto-detection (via the
`VERCEL` build env var) picks the `vercel` preset with zero config
overrides needed; `vercel.json` just pins the framework/build/install
commands. Package manager is `bun`.

## Development

```bash
bun install
bun run dev
```

Copy `.env.example` to `.env` and set `VITE_CONTRACT_ADDRESS` once
Primacy is actually deployed (see `../primacy/deploy/deployments.json`
for the real address once one exists). Leave it unset to develop
against the honest "not deployed" empty state.

```bash
bun run build      # production build, also used by Vercel
bun run lint        # eslint (flat config)
bunx tsc --noEmit    # typecheck
```

## Routes

| Route | Purpose |
|---|---|
| `/` | Marketing — renders a real open/settled market from the chain when live, an inert dashed placeholder when not |
| `/app` | Board — every hour, filterable by lane/state |
| `/app/m/:id` | Market ticket — pools, stake, evidence, settle/reclaim |
| `/app/portfolio` | Your positions, claims, refunds |
| `/app/activity` | Settlements and keeper actions |
| `/app/lanes` | Lanes and the constitution |
| `/app/create` | Create hour (keeper action) |

## Deploying

```bash
bunx vercel --prod --yes
```

The Vercel project's GitHub integration is connected, so a push to
`main` deploys automatically. Production/Preview env vars
(`VITE_GENLAYER_RPC_URL`, `VITE_GENLAYER_CHAIN_ID`,
`VITE_GENLAYER_CHAIN_NAME`, `VITE_EXPLORER`) are set in the Vercel
project directly; `VITE_CONTRACT_ADDRESS` is deliberately unset until a
real deploy succeeds.
