# Hourglass Insights

# PRIMACY — production frontend for Lovable
# Visual system derived from the attached references, unified so they do not clash.
# Protocol is a GenLayer hourly primacy market. Do not invent a payments/treasury/consulting company.

Build a complete, clickable frontend. Do not leave lorem or empty routes.
Connect to a typed client module at src/lib/primacy (reads + writes). If the contract address is missing, render the full UI on realistic mock data and a visible banner: “Studio Next · contract not set · demo data”.

────────────────────────────────────────
PRODUCT
────────────────────────────────────────
PRIMACY settles one question:

Which of three comparable instruments led a locked UTC hour?

V1 lanes (never call these NYSE stocks):
- CRYPTO EQUITY PROXIES — MSTR · COIN · HOOD
- MAJORS — BTC · ETH · SOL

Instrument label everywhere: “USDT-M index return, completed UTC hour”.
Settlement: Binance + Bitget + Gate, 2-of-3 votes. Pari-mutuel GEN. 2% fee on settled winning pools only. Inconclusive → exact refund.
Network: GenLayer Studio Next / Studio Dev. Chain ID 61997. RPC https://studio-dev.genlayer.com/api. Explorer https://explorer-studio-dev.genlayer.com. State may reset.

────────────────────────────────────────
VISUAL SYSTEM (one language — do not mix the refs)
────────────────────────────────────────
From the refs, KEEP:
- Warm paper canvas + white cards (Beyond / consulting grid)
- Soft rounded 16–20px cards, generous padding, no hard drop shadows (Privy)
- Dashboard metric + sparkline + activity list (Privy treasury)
- Marketing split: dark band with serif headline + three stats (Beyond dark band)
- 3-up feature cards with short title, mute body, text link (consulting grid)
- One primary filled CTA, one text link beside it (Beyond hero)

THROW AWAY:
- Lavender page wash as the app background
- Orange as a second brand color
- Purple “credit card” illustration
- Logo clouds of PayPal / Google / Dyson
- Consulting copy (“business growth”, “modernise”)
- Any neon lime / GenLayer electric blue frames

TOKENS
--paper: #F3F1EC
--ink: #141414
--mute: #6A6A6A
--line: rgba(20,20,20,0.08)
--surface: #FFFFFF
--surface-2: #FAFAF7
--band: #161616
--band-text: #F4F2EC
--accent: #3B5BDB
--accent-soft: #E7EBFB
--up: #1F7A4D
--down: #C43C3C
--warn: #A16207
--radius-card: 20px
--radius-btn: 999px
--shadow: 0 1px 0 rgba(20,20,20,0.04), 0 12px 32px rgba(20,20,20,0.04)

Type
- Display / H1: Fraunces or Newsreader, 56–72px marketing, 32px app page titles, tracking -0.02em
- UI / body: Inter or Geist, 15–16px, line 1.5
- Mono: JetBrains Mono 12–13px for SHAs, GEN amounts, timestamps, bps

Buttons
- Primary: --ink background, white label, 44px height, pill (marketing + app primary)
- Accent (rare): --accent background, white label — only “Settle” / “Look up evidence”
- Ghost: transparent, --ink text
- Disabled: 40% opacity + reason tooltip

Inputs
- White, 48px, 1px --line, 12px radius
- Focus: 1px --accent
- Never black fields on grey

Do not use more than one accent. Charts use --accent at 40–70% opacity, not rainbow.

────────────────────────────────────────
SITEMAP
────────────────────────────────────────
/                 Marketing
/app              Board (default logged-in home)
/app/m/:id        Market ticket
/app/portfolio    Positions, claims, refunds
/app/activity     Settlements + keeper actions
/app/lanes        Constitution + instrument class
/app/create       Create hour (form + preview)

Top bar on marketing: wordmark PRIMACY · Board · Lanes · Docs · Connect
Top bar on /app: wordmark · Board · Portfolio · Activity · chain chip “Studio Next · 61997” · Connect
Footer everywhere: PRIMACY · Studio Next · chain 61997 · state may reset · contract 0x… truncated

────────────────────────────────────────
MARKETING /  (Beyond structure, our product)
────────────────────────────────────────
Hero on --paper:
Left: serif H1 “Which name led the hour.”
Sub: “Three comparable instruments. One UTC hour. Independent venue candles. 2-of-3 consensus.”
Row: primary “Open the board” → /app   text “Read the constitution” → /app/lanes
Right: a live-looking MARKET TICKET card (white, 20px radius) for CRYPTO EQUITY PROXIES, window 14:00–15:00 UTC, three rows MSTR/COIN/HOOD with bps in green/red, status pill SETTLED, three small venue tabs Binance / Bitget / Gate. This card is the product, not a video of a consultant.

Dark band (--band):
Left serif: “A comparative hour is a judgment, not a feed.”
Right 3 stats: 2-of-3 venues · 30 min min lead · 2% settled fee
Mute sentence: “If venues do not agree, the hour is inconclusive and every stake is returned.”

Feature grid (3+2 cards on --paper, white cards) — titles only from this list:
1. Locked venues — Binance, Bitget, Gate. Hosts are hardcoded. No user URLs.
2. Derived consensus — Validators agree on winner and votes, not raw JSON.
3. Honest instruments — USDT-M index return. Not NYSE cash.
4. Keeper bonds — Create 2 GEN, settle 1 GEN. Empty books slash the create bond.
5. Exact refunds — Inconclusive hours return the stake. No fee.
Sixth cell: dark/accent panel “Open the next hour” CTA to /app/create. No “Not sure where to start?” consulting line.

Do not add a trusted-by logo row.

────────────────────────────────────────
APP SHELL (Privy treasury density on paper)
────────────────────────────────────────
Max width 1200px, padding 32px.
Page header: serif 32px title left, primary action right.
Work surface is white cards. Never dump a single control on empty paper.

────────────────────────────────────────
BOARD /app
────────────────────────────────────────
Stats row (4 white cards, Privy metric style):
- GEN in play
- Open hours
- Settled 24h
- Inconclusive 24h
Small sparkline allowed on GEN in play (cobalt bars, not purple 3D).

Toolbar: search · lane filter · state pills All / Open / Upcoming / Settled / Inconclusive · count “N hours”

Table/list in one white card, min-height 480px, row 56px:
Lane · Window (14:00–15:00 UTC + countdown) · Three symbols with mini pool bars · Total GEN · Status pill · chevron

Status pills:
OPEN = accent-soft + accent text
UPCOMING = paper + mute
SETTLED = up tint
INCONCLUSIVE = warn tint

Loading: 8 skeleton rows, same geometry. Ban the word “Loading…” as a page.
Empty: keep the card. Centered “No open hour in this lane. Next creatable window is 15:00 UTC.” + Create hour.

────────────────────────────────────────
TICKET /app/m/:id  (split like Privy accounts + activity)
────────────────────────────────────────
Header: lane name · window · status · “Settle hour” if expired and still OPEN.

LEFT 58% white card
- Three instrument rows: symbol, pool GEN, implied share %, bps if window started (label “informational — not settlement”)
- Stake field + symbol selector (disabled if user already chose a side)
- Primary “Place bet” / “Top up”
- Helper: “One symbol per wallet. Switching is rejected. Min 1 GEN. Betting closes at the hour start.”

RIGHT 42% white card “Evidence”
- Three tabs: Binance, Bitget, Gate
- Each: vote or ABSTAIN, open, close, bps, reason code, “View source” (locked URL)
- Footer: “Settlement reads this object. The chart does not.”

If evidence empty: skeleton + “Evidence appears after the first successful settle call.”

────────────────────────────────────────
CREATE /app/create
────────────────────────────────────────
58/42 split.
Left form: lane segmented control · hour picker (UTC hours only, min now+30m) · bond callout “2 GEN create bond”
Right preview ticket that updates live.
Primary “Create hour” disabled until lane + valid hour. Show the reject reason.

────────────────────────────────────────
PORTFOLIO
────────────────────────────────────────
Two metric cards: Open exposure · Claimable
Then a table: Hour · Side · Stake · State · Claim / Refund button
Empty: “No positions on Studio Next.” + Open the board

────────────────────────────────────────
ACTIVITY
────────────────────────────────────────
62/38 split.
Left ledger: TIME · MARKET · ACTION · VERDICT · TX
Right inspector always mounted: selected row detail or “Select an event.”
Never leave the right pane blank.

────────────────────────────────────────
LANES / constitution
────────────────────────────────────────
Each lane a white card: class, three symbols, venues, session 24/7.
A constitution list of the 11 rules in short sentences. No legal novel.

────────────────────────────────────────
WALLET + TX
────────────────────────────────────────
Connect injected wallet. If chain ≠ 61997, show “Switch to Studio Next (61997)” and the add-chain params.
Show GEN balance.
Disabled actions always explain why (betting closed, below min lead, side locked, no contract).
Tx states: wallet → submitted → accepted → finalized. Link explorer-studio-dev.genlayer.com.
Banner if RPC down or contract has no code: “Studio Next may have reset. Redeploy and set NEXT_PUBLIC_CONTRACT_ADDRESS.”

────────────────────────────────────────
COPY RULES
────────────────────────────────────────
Write like a protocol, not an agency and not a meme.
Good: “Two venues named COIN. Gate abstained (missing close). Hour settled.”
Bad: “Unleash agentic alpha.” “Modernise your stack.” “Stock of the hour!!!”
Never: stock, NYSE, oracle network, 0% fee (fee is 2% on settled winners), tool-0, lorem.

────────────────────────────────────────
QUALITY BAR
────────────────────────────────────────
- Light paper app. Dark only on the marketing band and the sixth CTA tile.
- One accent.
- Every /app route fills the viewport with chrome + a work surface.
- Skeletons, empty states, errors are designed.
- Responsive: stack the 58/42 splits under 1000px. Ticket preview never disappears.
- Accessibility: contrast on mute text ≥ 4.5 on paper.
- No stock photos of people. No credit-card mock. No fake TVL.

Build every route in this pass.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f66a11a2-591d-40ee-8ce4-a510a7eaeeea).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
