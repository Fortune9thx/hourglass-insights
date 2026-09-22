export type LaneId = "crypto-equity-proxies" | "majors";

export type MarketState = "OPEN" | "UPCOMING" | "SETTLED" | "INCONCLUSIVE";

export type VenueId = "binance" | "bitget" | "gate";

export interface Lane {
  id: LaneId;
  name: string;
  instrumentClass: string;
  symbols: string[];
  venues: string[];
  session: string;
}

export interface SymbolLeg {
  symbol: string;
  pool: number;
  bps: number | null;
}

export interface VenueEvidence {
  venue: VenueId;
  vote: string | null;
  open: number | null;
  close: number | null;
  bps: number | null;
  reason: string;
  source: string;
}

export interface Market {
  id: string;
  lane: LaneId;
  startsAt: number;
  endsAt: number;
  state: MarketState;
  legs: SymbolLeg[];
  totalPool: number;
  winner: string | null;
  votes: number;
  evidence: VenueEvidence[];
}

export interface Position {
  marketId: string;
  lane: LaneId;
  startsAt: number;
  symbol: string;
  stake: number;
  state: MarketState;
  payout: number | null;
  claimed: boolean;
}

export interface ActivityEvent {
  id: string;
  at: number;
  marketId: string;
  lane: LaneId;
  action: "CREATE" | "SETTLE" | "REFUND" | "CLAIM" | "KEEPER_SLASH";
  verdict: string;
  tx: string;
  detail: string;
  votes: string[];
}

export interface BoardStats {
  genInPlay: number;
  openHours: number;
  settled24h: number;
  inconclusive24h: number;
  sparkline: number[];
}
