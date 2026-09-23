import type { ContractLaneId, Lane, LaneId } from "./types";

export const CHAIN_ID = Number(import.meta.env["VITE_GENLAYER_CHAIN_ID"] ?? 61997);
export const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}`;
export const CHAIN_NAME = "Studio Next";
export const CHAIN_FULL_NAME =
  (import.meta.env["VITE_GENLAYER_CHAIN_NAME"] as string | undefined) ?? "GenLayer Studio Next";
export const RPC_URL =
  (import.meta.env["VITE_GENLAYER_RPC_URL"] as string | undefined) ??
  "https://studio-dev.genlayer.com/api";
export const EXPLORER_URL =
  (import.meta.env["VITE_EXPLORER"] as string | undefined) ??
  "https://explorer-studio-dev.genlayer.com";

// Vite, not Next.js -- import.meta.env.VITE_*, never process.env.NEXT_PUBLIC_*.
export const CONTRACT_ADDRESS: string | null =
  (import.meta.env["VITE_CONTRACT_ADDRESS"] as string | undefined) || null;

export const HAS_CONTRACT = Boolean(CONTRACT_ADDRESS);

export const ADD_CHAIN_PARAMS = {
  chainId: CHAIN_ID_HEX,
  chainName: CHAIN_FULL_NAME,
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [EXPLORER_URL],
};

export const VENUES = [
  { id: "binance" as const, label: "Binance" },
  { id: "bitget" as const, label: "Bitget" },
  { id: "gate" as const, label: "Gate" },
];

/**
 * UI-facing lane ids stay kebab-case (route/query-string friendly); the
 * real contract's lane_id is the SCREAMING_SNAKE string Primacy.py's
 * LANES dict actually uses. Every contract call/response crosses this
 * boundary exactly once, in client.ts.
 */
export const CONTRACT_LANE_ID: Record<LaneId, ContractLaneId> = {
  "crypto-equity-proxies": "CRYPTO_EQUITY_PROXIES",
  majors: "MAJORS",
};

export const UI_LANE_ID: Record<ContractLaneId, LaneId> = {
  CRYPTO_EQUITY_PROXIES: "crypto-equity-proxies",
  MAJORS: "majors",
};

export const LANES: Lane[] = [
  {
    id: "crypto-equity-proxies",
    name: "Crypto equity proxies",
    instrumentClass: "USDT-M index return, completed UTC hour",
    symbols: ["MSTR", "COIN", "HOOD"],
    venues: ["Binance", "Bitget", "Gate"],
    session: "24/7",
  },
  {
    id: "majors",
    name: "Majors",
    instrumentClass: "USDT-M index return, completed UTC hour",
    symbols: ["BTC", "ETH", "SOL"],
    venues: ["Binance", "Bitget", "Gate"],
    session: "24/7",
  },
];

export const CONSTITUTION = [
  "One hour, one lane, three comparable instruments. No cross-lane comparison.",
  "The instrument is the USDT-M index return over a completed UTC hour.",
  "Venue hosts are hardcoded: Binance, Bitget, Gate. No user-supplied URLs.",
  "A winner needs 2-of-3 venue votes on the same symbol.",
  "A venue with a missing open or close abstains and casts no vote.",
  "If no symbol reaches two votes the hour is inconclusive.",
  "Inconclusive hours refund every stake exactly. No fee is taken.",
  "Pools are pari-mutuel in GEN. Winners split the losing pool pro rata.",
  "The fee is 2% and applies only to settled winning pools.",
  "One symbol per wallet per hour. Switching sides is rejected; topping up is allowed.",
  "Keeper bonds: 2 GEN to create an hour, 1 GEN to settle it. An empty book slashes the create bond.",
];

export function laneById(id: string): Lane {
  return LANES.find((l) => l.id === id) ?? LANES[0]!;
}
