import { LANES } from "./config";
import type {
  ActivityEvent,
  BoardStats,
  Market,
  MarketState,
  Position,
  VenueEvidence,
} from "./types";

const HOUR = 3_600_000;

export const ANCHOR_HOUR = Math.floor(Date.now() / HOUR) * HOUR;

/** Deterministic pseudo-random in [0,1) from a string seed. */
function rand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

const REASONS = [
  "candles complete",
  "index return computed",
  "close within tolerance",
  "missing close",
  "venue lag > 90s",
];

function buildEvidence(id: string, symbols: string[], state: MarketState): VenueEvidence[] {
  if (state === "OPEN" || state === "UPCOMING") return [];
  const venues = ["binance", "bitget", "gate"] as const;
  return venues.map((venue, i) => {
    const r = rand(`${id}-${venue}`);
    const abstain = state === "INCONCLUSIVE" ? i === 2 : r > 0.88;
    const open = 100 + r * 40;
    const b = (rand(`${id}-${venue}-b`) - 0.45) * 90;
    const winnerIdx = state === "INCONCLUSIVE" ? i % symbols.length : Math.floor(rand(`${id}-w`) * 3);
    return {
      venue,
      vote: abstain ? null : (symbols[winnerIdx] ?? symbols[0]!),
      open: abstain ? open : open,
      close: abstain ? null : open * (1 + b / 10000),
      bps: abstain ? null : Number(b.toFixed(1)),
      reason: abstain ? REASONS[3]! : REASONS[Math.floor(rand(`${id}-${venue}-r`) * 3)]!,
      source: `https://api.${venue}.com/klines?symbol=${symbols[0]}USDT&interval=1h`,
    };
  });
}

function buildMarket(laneIndex: number, hourOffset: number): Market {
  const lane = LANES[laneIndex]!;
  const startsAt = ANCHOR_HOUR + hourOffset * HOUR;
  const endsAt = startsAt + HOUR;
  const id = `${lane.id}-${new Date(startsAt).toISOString().slice(0, 13)}`;
  const r = rand(id);

  let state: MarketState;
  if (hourOffset > 0) state = "UPCOMING";
  else if (hourOffset === 0) state = "OPEN";
  else state = r > 0.86 ? "INCONCLUSIVE" : "SETTLED";

  const legs = lane.symbols.map((symbol, i) => {
    const pool = Number((20 + rand(`${id}-${symbol}`) * 900).toFixed(2));
    const started = startsAt <= Date.now();
    const b = (rand(`${id}-${symbol}-bps`) - 0.45) * 120;
    return {
      symbol,
      pool: state === "UPCOMING" ? Number((pool * 0.15).toFixed(2)) : pool,
      bps: started ? Number(b.toFixed(1)) : null,
      _i: i,
    };
  });

  const evidence = buildEvidence(id, lane.symbols, state);
  const votes = evidence.filter((e) => e.vote).length;
  const winner =
    state === "SETTLED"
      ? (evidence.find((e) => e.vote)?.vote ?? lane.symbols[0]!)
      : null;

  return {
    id,
    lane: lane.id,
    startsAt,
    endsAt,
    state,
    legs: legs.map(({ symbol, pool, bps }) => ({ symbol, pool, bps })),
    totalPool: Number(legs.reduce((s, l) => s + l.pool, 0).toFixed(2)),
    winner,
    votes,
    evidence,
  };
}

export const MOCK_MARKETS: Market[] = (() => {
  const out: Market[] = [];
  for (let offset = 4; offset >= -14; offset--) {
    for (let lane = 0; lane < LANES.length; lane++) {
      if (offset > 1 && lane === 1) continue;
      out.push(buildMarket(lane, offset));
    }
  }
  return out;
})();

export const MOCK_STATS: BoardStats = (() => {
  const genInPlay = MOCK_MARKETS.filter((m) => m.state === "OPEN" || m.state === "UPCOMING").reduce(
    (s, m) => s + m.totalPool,
    0,
  );
  const recent = MOCK_MARKETS.filter((m) => m.startsAt > ANCHOR_HOUR - 24 * HOUR);
  return {
    genInPlay: Number(genInPlay.toFixed(2)),
    openHours: MOCK_MARKETS.filter((m) => m.state === "OPEN").length,
    settled24h: recent.filter((m) => m.state === "SETTLED").length,
    inconclusive24h: recent.filter((m) => m.state === "INCONCLUSIVE").length,
    sparkline: Array.from({ length: 24 }, (_, i) => 0.25 + rand(`spark-${i}`) * 0.75),
  };
})();

export const MOCK_POSITIONS: Position[] = MOCK_MARKETS.slice(0, 7).map((m, i) => {
  const symbol = m.legs[i % m.legs.length]!.symbol;
  const stake = Number((5 + rand(`${m.id}-pos`) * 120).toFixed(2));
  const won = m.state === "SETTLED" && m.winner === symbol;
  return {
    marketId: m.id,
    lane: m.lane,
    startsAt: m.startsAt,
    symbol,
    stake,
    state: m.state,
    payout:
      m.state === "INCONCLUSIVE"
        ? stake
        : won
          ? Number((stake * (1.4 + rand(`${m.id}-pay`) * 0.9) * 0.98).toFixed(2))
          : m.state === "SETTLED"
            ? 0
            : null,
    claimed: i > 4,
  };
});

export const MOCK_ACTIVITY: ActivityEvent[] = MOCK_MARKETS.filter(
  (m) => m.state === "SETTLED" || m.state === "INCONCLUSIVE" || m.state === "OPEN",
)
  .slice(0, 22)
  .map((m, i) => {
    const voted = m.evidence.filter((e) => e.vote);
    const action: ActivityEvent["action"] =
      m.state === "OPEN" ? "CREATE" : m.state === "INCONCLUSIVE" ? "REFUND" : "SETTLE";
    const verdict =
      action === "CREATE"
        ? "Hour opened"
        : action === "REFUND"
          ? "Inconclusive — stakes returned"
          : `${m.winner} led the hour`;
    return {
      id: `${m.id}-ev-${i}`,
      at: m.endsAt + (i % 5) * 60_000,
      marketId: m.id,
      lane: m.lane,
      action,
      verdict,
      tx: `0x${Math.abs(Math.floor(rand(`${m.id}-tx`) * 1e16)).toString(16).padStart(40, "a")}`,
      detail:
        action === "SETTLE"
          ? `${voted.length} venues named ${m.winner}. ${
              m.evidence.find((e) => !e.vote)
                ? `${m.evidence.find((e) => !e.vote)!.venue} abstained (missing close).`
                : "All venues reported."
            } Hour settled.`
          : action === "REFUND"
            ? "Venues disagreed. No symbol reached two votes. Every stake returned, no fee."
            : "Create bond of 2 GEN posted by keeper.",
      votes: voted.map((v) => `${v.venue}: ${v.vote}`),
    };
  });
