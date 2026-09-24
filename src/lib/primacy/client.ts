/**
 * Typed PRIMACY client.
 *
 * Method names/shapes mirror Desktop/primacy's own frontend SDK
 * (frontend/src/lib/primacy/primacyClient.ts) and Primacy.py's real view
 * and write method names/kwargs -- see that repo's README.md/docs for
 * the canonical contract API this wraps. Do not copy Primacy.py itself
 * into this frontend; this module only calls it over RPC.
 *
 * PRIMACY is a live product, not a demo. There is no mock/fixture data
 * anywhere in this module:
 * - No `VITE_CONTRACT_ADDRESS` configured -> every list read resolves to
 *   `[]`, every single-record read resolves to `null`, every write
 *   throws. Nothing is invented to fill the gap.
 * - An address is configured -> every read/write goes through
 *   genlayer-js against Studio Next (chain 61997), for real. A failed
 *   RPC call throws (or, for list reads, resolves to `[]`) -- it never
 *   falls back to fabricated data.
 * - `checkLiveStatus()` is the single source of truth for whether the
 *   configured address actually has code on-chain right now (a real
 *   `eth_getCode` call, not just "an address string is set") -- see
 *   AppShell's `useLiveStatus()` for how the UI consumes this.
 */
import { createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import { CHAIN_ID, CONTRACT_ADDRESS, CONTRACT_LANE_ID, HAS_CONTRACT, UI_LANE_ID } from "./config";
import { discoverProviders, getSelectedProvider } from "./walletProvider";
import type {
  ActivityEvent,
  BettingState,
  BoardStats,
  ContractConfig,
  ContractLaneId,
  Constitution,
  LaneId,
  Market,
  Position,
  VenueEvidence,
} from "./types";

// genlayer-js@2.0.0-rc.1's ClientConfig.chain and readContract/writeContract
// arg types are ad-hoc inline object types (not the same declared type as
// GenLayerChain/CalldataEncodable, and neither is re-exported from the
// package root), and under this project's `exactOptionalPropertyTypes`
// tsconfig they don't structurally match GenLayerChain / Record<string,
// unknown> directly. Derive the real expected shapes from createClient's
// own signature instead of importing private type names -- see
// node_modules/genlayer-js/dist/index.d.ts / index-BT1ApAqQ.d.ts.
type PrimacyGenLayerClient = ReturnType<typeof createClient>;
type ChainConfig = Parameters<typeof createClient>[0] extends { chain?: infer C } ? C : never;
type ReadArgs = Parameters<PrimacyGenLayerClient["readContract"]>[0];
type WriteArgs = Parameters<PrimacyGenLayerClient["writeContract"]>[0];
type ContractAddress = ReadArgs["address"];
type Kwargs = NonNullable<ReadArgs["kwargs"]>;
type TxHash = Parameters<PrimacyGenLayerClient["getTransaction"]>[0]["hash"];

const CHAIN_CONFIG = studioDevnet as unknown as ChainConfig;

function requireContractAddress(): ContractAddress {
  if (!CONTRACT_ADDRESS) throw new PrimacyError(NO_CONTRACT);
  return CONTRACT_ADDRESS as ContractAddress;
}

export interface TxResult {
  hash: string;
  status: "accepted" | "finalized";
}

export class PrimacyError extends Error {}

const NO_CONTRACT = "Contract not deployed on Studio Next (61997).";

const VENUE_SOURCES: Record<string, string> = {
  binance: "https://www.binance.com",
  bitget: "https://www.bitget.com",
  gate: "https://www.gate.io",
};

const VENUE_ORDER = ["binance", "bitget", "gate"] as const;

/** Maps Primacy.py's stable, lowercase UserError strings to a short,
 * human-readable message. Contract error text arrives wrapped in
 * platform-specific framing that varies by call path -- always match by
 * substring, never exact-equality. */
const ERROR_MESSAGES: Record<string, string> = {
  "market not found": "That market doesn't exist.",
  "betting closed": "Betting has closed for this market.",
  "below min lead": "This market's start time needs at least 30 minutes' notice.",
  "side locked": "You already have a position on a different symbol in this market.",
  "below min bet": "Bets must be at least 1 GEN.",
  "unknown lane": "That isn't a recognized market lane.",
  "unknown symbol": "That symbol isn't part of this market's lane.",
  "not hour boundary": "The start time must land exactly on an hour boundary (UTC).",
  "already settled": "This market has already been settled.",
  "not expired": "This market's hour hasn't completed yet.",
  "nothing to claim": "There's nothing for you to claim on this market.",
  "not inconclusive": "This market isn't in a refundable (inconclusive) state.",
  "duplicate market": "A market for this lane and start time already exists.",
  "creator cap reached": "You already have the maximum number of open markets (8).",
  "wrong bond amount": "The attached GEN doesn't match the required bond amount.",
};

function describePrimacyError(raw: string): string {
  const lower = raw.toLowerCase();
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (lower.includes(key)) return message;
  }
  return raw;
}

// ---------------------------------------------------------------------------
// genlayer-js clients
// ---------------------------------------------------------------------------

let _readClient: ReturnType<typeof createClient> | null = null;

function getReadClient() {
  if (!_readClient) {
    _readClient = createClient({ chain: CHAIN_CONFIG });
  }
  return _readClient;
}

async function getWriteClient() {
  let provider = getSelectedProvider();
  if (!provider) {
    // useWallet's own discovery should already have run, but a write
    // triggered before that effect settles (or in a context where
    // useWallet never mounted) still needs the same shared provider --
    // never a fresh, separately-discovered one, or this could silently
    // sign with a different wallet than the one the user connected.
    const found = await discoverProviders();
    provider = found[0]?.provider ?? null;
  }
  if (!provider) throw new PrimacyError("No injected wallet found in this browser.");
  const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
  const account = accounts[0];
  if (!account) throw new PrimacyError("Connect your wallet first.");
  return createClient({
    chain: CHAIN_CONFIG,
    account: account as `0x${string}`,
    provider: provider as never,
  });
}

async function readView<T>(functionName: string, kwargs: Kwargs = {}): Promise<T> {
  const address = requireContractAddress();
  const client = getReadClient();
  try {
    return (await client.readContract({
      address,
      functionName,
      args: [],
      kwargs,
    })) as T;
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    throw new PrimacyError(describePrimacyError(raw));
  }
}

type PrimacyTransaction = Awaited<ReturnType<PrimacyGenLayerClient["getTransaction"]>>;

async function writeContract(
  functionName: string,
  kwargs: Kwargs,
  valueWei: bigint,
): Promise<TxResult> {
  const address = requireContractAddress();
  const client = await getWriteClient();
  const writeArgs: WriteArgs = {
    address,
    functionName,
    args: [],
    kwargs,
    value: valueWei,
  };

  let hash: TxHash;
  try {
    hash = (await client.writeContract(writeArgs)) as TxHash;
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    throw new PrimacyError(describePrimacyError(raw));
  }

  // A write's returned hash is not itself proof of success -- "reached a
  // terminal status" and "the call actually succeeded" are two different
  // claims, and every real fund-moving write here (claim/claimRefund/
  // reclaimBonds all pay the caller; settleMarket's outcome gates those
  // later claims) needs the stronger one. Wait for genuine FINALIZED, not
  // just ACCEPTED/"decided" -- a value transfer is not reliably final
  // before that. Then require txExecutionResultName === "FINISHED_WITH_RETURN"
  // as an explicit WHITELIST: never infer success from "not the one known
  // failure value," since a missing/undefined/NOT_VOTED result would
  // silently pass a blacklist check. See Desktop/primacy's
  // genlayer-master-audit-prompt.md items 6/28/40/90/131/146/164/171 --
  // this exact class of bug (status-alone success detection) has caused
  // real steward rejections on prior projects.
  let tx: PrimacyTransaction | null = null;
  try {
    tx = await client.waitForTransactionReceipt({
      hash,
      waitUntil: "finalized",
      retries: 120,
      interval: 5000,
    });
  } catch {
    tx = await client.getTransaction({ hash }).catch(() => null);
  }

  if (tx?.txExecutionResultName !== "FINISHED_WITH_RETURN") {
    const detail = tx?.txExecutionResultName ?? tx?.statusName ?? "unknown, no receipt";
    throw new PrimacyError(describePrimacyError(`transaction did not succeed (${detail})`));
  }

  return { hash, status: tx.lifecycle?.state === "finalized" ? "finalized" : "accepted" };
}

// ---------------------------------------------------------------------------
// liveness -- the single source of truth for "is there really a working
// contract at this address right now," not just "is an address configured"
// ---------------------------------------------------------------------------

export type LiveStatus = "not_deployed" | "no_code" | "rpc_down" | "live";

export async function checkLiveStatus(): Promise<LiveStatus> {
  if (!CONTRACT_ADDRESS) return "not_deployed";
  try {
    const client = getReadClient();
    // eth_getCode is a real, confirmed-working method on Studio Dev's RPC
    // (verified directly via curl), but genlayer-js@2.0.0-rc.1's `request`
    // overloads only enumerate its own gen_/sim_ methods plus a handful of
    // viem standard ones -- eth_getCode isn't among them in the .d.ts even
    // though the server supports it. Cast through `never` rather than
    // pretending it fits one of the declared overloads.
    const request = client.request as (args: {
      method: "eth_getCode";
      params: [string, string];
    }) => Promise<string>;
    const code = await request({ method: "eth_getCode", params: [CONTRACT_ADDRESS, "latest"] });
    return code && code !== "0x" ? "live" : "no_code";
  } catch {
    return "rpc_down";
  }
}

// ---------------------------------------------------------------------------
// wei <-> GEN (display-only; the contract is the source of truth for
// exact amounts)
// ---------------------------------------------------------------------------

const GEN_SCALE = 1e18;

function weiToGenNumber(wei: string | number | bigint | undefined | null): number {
  if (wei === undefined || wei === null) return 0;
  return Number(BigInt(wei)) / GEN_SCALE;
}

function genToWeiBigInt(gen: number): bigint {
  return BigInt(Math.round(gen * GEN_SCALE));
}

// ---------------------------------------------------------------------------
// raw contract shape -> UI domain types (types.ts)
// ---------------------------------------------------------------------------

interface RawMarket {
  market_id: number;
  creator: string;
  lane_id: ContractLaneId;
  symbols: string[];
  start: number;
  end: number;
  state: "OPEN" | "SETTLED" | "INCONCLUSIVE";
  winner: string | null;
  settler: string | null;
  total_pool: string | number;
  pool_by_symbol: Record<string, string | number>;
  create_bond_returned: boolean;
  create_bond_slashed: boolean;
  settle_bond_returned: boolean;
}

interface RawEvidence {
  market_id?: string;
  lane_id?: string;
  start?: number;
  votes?: Record<string, string | null>;
  abstain_reason?: Record<string, string>;
  bps?: Record<string, Record<string, number>>;
  winner?: string | null;
  status?: string;
  audit_winner?: string;
}

function mapMarket(raw: RawMarket, evidence?: RawEvidence): Market {
  const lane = UI_LANE_ID[raw.lane_id] ?? "crypto-equity-proxies";
  const votes = evidence?.votes ?? {};
  const bpsByVenue = evidence?.bps ?? {};
  const voteCount = Object.values(votes).filter((v) => v !== null && v !== undefined).length;

  const legs = raw.symbols.map((symbol) => {
    const pool = weiToGenNumber(raw.pool_by_symbol[symbol]);
    const readings = VENUE_ORDER.map((v) => bpsByVenue[v]?.[symbol]).filter(
      (v): v is number => typeof v === "number",
    );
    const bps = readings.length
      ? Number((readings.reduce((s, v) => s + v, 0) / readings.length).toFixed(1))
      : null;
    return { symbol, pool: Number(pool.toFixed(4)), bps };
  });

  const venueEvidence: VenueEvidence[] = evidence
    ? VENUE_ORDER.map((venue) => {
        const vote = votes[venue] ?? null;
        const venueBps = vote ? (bpsByVenue[venue]?.[vote] ?? null) : null;
        return {
          venue,
          vote,
          open: null,
          close: null,
          bps: venueBps,
          reason: evidence.abstain_reason?.[venue] ?? (vote ? "vote recorded" : "—"),
          source: VENUE_SOURCES[venue] ?? "#",
        };
      })
    : [];

  return {
    id: String(raw.market_id),
    lane,
    startsAt: raw.start * 1000,
    endsAt: raw.end * 1000,
    state: raw.state,
    legs,
    totalPool: Number(weiToGenNumber(raw.total_pool).toFixed(4)),
    winner: raw.winner,
    votes: voteCount,
    evidence: venueEvidence,
  };
}

/** Public, documented payout formula from Desktop/primacy README section 7
 * -- an ESTIMATE for display; the contract's own integer math is always
 * the exact, authoritative amount actually paid by claim(). */
function estimatePayout(
  myStakeGen: number,
  winningPoolGen: number,
  totalPoolGen: number,
  feeBps: number,
): number {
  if (winningPoolGen <= 0) return 0;
  const fee = (totalPoolGen * feeBps) / 10_000;
  const distributable = totalPoolGen - fee;
  return Number(((myStakeGen * distributable) / winningPoolGen).toFixed(4));
}

// ---------------------------------------------------------------------------
// public client
// ---------------------------------------------------------------------------

export const primacy = {
  contractAddress: CONTRACT_ADDRESS,
  chainId: CHAIN_ID,
  checkLiveStatus,

  async getStats(): Promise<BoardStats> {
    const board = await this.getBoard();
    return {
      genInPlay: Number(board.reduce((s, m) => s + m.totalPool, 0).toFixed(2)),
      openHours: board.filter((m) => m.state === "OPEN").length,
      settled24h: 0,
      inconclusive24h: 0,
      sparkline: [],
    };
  },

  async getConstitution(): Promise<Constitution> {
    const raw = await readView<Record<string, unknown>>("get_constitution");
    return {
      lanes: raw["lanes"] as Constitution["lanes"],
      venues: raw["venues"] as string[],
      hourSeconds: raw["hour_seconds"] as number,
      minLeadSeconds: raw["min_lead_seconds"] as number,
      minBetWei: String(raw["min_bet_wei"]),
      createBondWei: String(raw["create_bond_wei"]),
      settleBondWei: String(raw["settle_bond_wei"]),
      feeBps: raw["fee_bps"] as number,
      settleWindowSeconds: raw["settle_window_seconds"] as number,
      bpsTol: raw["bps_tol"] as number,
      maxOpenMarketsPerCreator: raw["max_open_markets_per_creator"] as number,
      maxPageSize: raw["max_page_size"] as number,
      instrumentLabel: raw["instrument_label"] as string,
      treasury: raw["treasury"] as string,
    };
  },

  async getConfig(): Promise<ContractConfig> {
    const raw = await readView<Record<string, unknown>>("get_config");
    return {
      treasury: raw["treasury"] as string,
      nextMarketId: Number(raw["next_market_id"]),
      totalMarkets: Number(raw["total_markets"]),
    };
  },

  async getBoard(): Promise<Market[]> {
    if (!HAS_CONTRACT) return [];
    const raw = await readView<RawMarket[]>("get_board");
    return raw.map((m) => mapMarket(m));
  },

  async getMarkets(filter?: { lane?: LaneId | "all"; state?: string }): Promise<Market[]> {
    if (!HAS_CONTRACT) return [];
    const stateFilter =
      filter?.state && filter.state !== "All" && filter.state !== "Upcoming"
        ? filter.state.toUpperCase()
        : "";
    const raw = await readView<RawMarket[]>("get_markets", {
      cursor: 0,
      limit: 50,
      state_filter: stateFilter,
    });
    let rows = raw.map((m) => mapMarket(m));
    if (filter?.lane && filter.lane !== "all") rows = rows.filter((m) => m.lane === filter.lane);
    return rows;
  },

  async getMarket(id: string): Promise<Market | null> {
    if (!HAS_CONTRACT) return null;
    const [raw, evidence] = await Promise.all([
      readView<RawMarket>("get_market", { market_id: Number(id) }),
      this.getEvidence(id).catch(() => null),
    ]);
    return mapMarket(raw, evidence ?? undefined);
  },

  async getEvidence(marketId: string): Promise<RawEvidence> {
    return readView<RawEvidence>("get_source_evidence", { market_id: Number(marketId) });
  },

  async getBettingState(marketId: string, address: string): Promise<BettingState> {
    const raw = await readView<Record<string, unknown>>("get_betting_state", {
      market_id: Number(marketId),
      address,
    });
    return {
      state: raw["state"] as BettingState["state"],
      isOpen: Boolean(raw["is_open"]),
      secondsUntilClose: Number(raw["seconds_until_close"]),
      mySymbol: (raw["my_symbol"] as string | null) ?? null,
      myStake: weiToGenNumber(raw["my_stake"] as string | number),
    };
  },

  async getUserPositions(address: string): Promise<Position[]> {
    if (!HAS_CONTRACT) return [];
    const raw = await readView<
      {
        market_id: number;
        state: Position["state"];
        symbol: string | null;
        amount: string | number;
        claimed: boolean;
      }[]
    >("get_user_positions", { address, cursor: 0, limit: 50 });

    return Promise.all(
      raw
        .filter((p) => p.symbol)
        .map(async (p) => {
          const market = await this.getMarket(String(p.market_id));
          const stake = weiToGenNumber(p.amount);
          const winningPool = market?.legs.find((l) => l.symbol === market.winner)?.pool ?? 0;
          const payout =
            market?.state === "INCONCLUSIVE"
              ? stake
              : market?.state === "SETTLED" && market.winner === p.symbol
                ? estimatePayout(stake, winningPool, market.totalPool, 200)
                : market?.state === "SETTLED"
                  ? 0
                  : null;
          const position: Position = {
            marketId: String(p.market_id),
            lane: market?.lane ?? "crypto-equity-proxies",
            startsAt: market?.startsAt ?? Date.now(),
            symbol: p.symbol!,
            stake,
            state: p.state,
            payout,
            claimed: p.claimed,
          };
          return position;
        }),
    );
  },

  async getClaimable(address: string): Promise<Market[]> {
    if (!HAS_CONTRACT) return [];
    const raw = await readView<RawMarket[]>("get_claimable_markets", {
      address,
      cursor: 0,
      limit: 50,
    });
    return raw.map((m) => mapMarket(m));
  },

  async listActivity(): Promise<ActivityEvent[]> {
    if (!HAS_CONTRACT) return [];
    // Primacy.py has no dedicated activity log view -- derive a minimal
    // feed from settled/inconclusive board entries until a real indexer
    // exists.
    const markets = await this.getMarkets({ state: "All" });
    const events: ActivityEvent[] = markets
      .filter((m) => m.state === "SETTLED" || m.state === "INCONCLUSIVE")
      .map((m) => ({
        id: `${m.id}-settle`,
        at: m.endsAt,
        marketId: m.id,
        lane: m.lane,
        action: m.state === "INCONCLUSIVE" ? "REFUND" : "SETTLE",
        verdict:
          m.state === "INCONCLUSIVE"
            ? "Inconclusive — stakes returned"
            : `${m.winner} led the hour`,
        tx: "",
        detail:
          m.state === "SETTLED"
            ? `${m.votes} venues named ${m.winner}.`
            : "Venues disagreed or no symbol reached two votes. Every stake returned, no fee.",
        votes: m.evidence.filter((e) => e.vote).map((e) => `${e.venue}: ${e.vote}`),
      }));
    return events.sort((a, b) => b.at - a.at);
  },

  async createMarket(args: { lane: LaneId; startsAt: number }): Promise<TxResult> {
    return writeContract(
      "create_market",
      { lane_id: CONTRACT_LANE_ID[args.lane], start: Math.floor(args.startsAt / 1000) },
      genToWeiBigInt(2),
    );
  },

  async placeBet(args: { marketId: string; symbol: string; amount: number }): Promise<TxResult> {
    return writeContract(
      "place_bet",
      { market_id: Number(args.marketId), symbol: args.symbol },
      genToWeiBigInt(args.amount),
    );
  },

  async settleMarket(args: { marketId: string }): Promise<TxResult> {
    return writeContract("settle_market", { market_id: Number(args.marketId) }, genToWeiBigInt(1));
  },

  async claim(args: { marketId: string }): Promise<TxResult> {
    return writeContract("claim", { market_id: Number(args.marketId) }, 0n);
  },

  async claimRefund(args: { marketId: string }): Promise<TxResult> {
    return writeContract("claim_refund", { market_id: Number(args.marketId) }, 0n);
  },

  async reclaimBonds(args: { marketId: string }): Promise<TxResult> {
    return writeContract("reclaim_bonds", { market_id: Number(args.marketId) }, 0n);
  },
};
