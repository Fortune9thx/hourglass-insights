/**
 * Typed PRIMACY client.
 *
 * Reads and writes go through this module. When no contract address is
 * configured the client serves realistic mock data and every write is
 * rejected with a stated reason, so the whole UI stays clickable.
 */
import { CONTRACT_ADDRESS, HAS_CONTRACT } from "./config";
import { MOCK_ACTIVITY, MOCK_MARKETS, MOCK_POSITIONS, MOCK_STATS } from "./mock";
import type { ActivityEvent, BoardStats, LaneId, Market, Position } from "./types";

export interface TxResult {
  hash: string;
  status: "wallet" | "submitted" | "accepted" | "finalized";
}

export class PrimacyError extends Error {}

const NO_CONTRACT =
  "Contract address is not set. Deploy to Studio Next and set VITE_PRIMACY_CONTRACT_ADDRESS.";

async function delay<T>(value: T, ms = 220): Promise<T> {
  await new Promise((r) => setTimeout(r, ms));
  return value;
}

export const primacy = {
  contractAddress: CONTRACT_ADDRESS,
  isLive: HAS_CONTRACT,

  async getStats(): Promise<BoardStats> {
    return delay(MOCK_STATS);
  },

  async listMarkets(filter?: { lane?: LaneId | "all"; state?: string }): Promise<Market[]> {
    let rows = MOCK_MARKETS;
    if (filter?.lane && filter.lane !== "all") rows = rows.filter((m) => m.lane === filter.lane);
    if (filter?.state && filter.state !== "All")
      rows = rows.filter((m) => m.state === filter.state.toUpperCase());
    return delay(rows);
  },

  async getMarket(id: string): Promise<Market | null> {
    return delay(MOCK_MARKETS.find((m) => m.id === id) ?? null);
  },

  async listPositions(): Promise<Position[]> {
    return delay(MOCK_POSITIONS);
  },

  async listActivity(): Promise<ActivityEvent[]> {
    return delay([...MOCK_ACTIVITY].sort((a, b) => b.at - a.at));
  },

  async placeBet(_args: { marketId: string; symbol: string; amount: number }): Promise<TxResult> {
    throw new PrimacyError(NO_CONTRACT);
  },

  async createHour(_args: { lane: LaneId; startsAt: number }): Promise<TxResult> {
    throw new PrimacyError(NO_CONTRACT);
  },

  async settleHour(_args: { marketId: string }): Promise<TxResult> {
    throw new PrimacyError(NO_CONTRACT);
  },

  async claim(_args: { marketId: string }): Promise<TxResult> {
    throw new PrimacyError(NO_CONTRACT);
  },
};
