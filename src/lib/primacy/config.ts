import type { Lane } from "./types";

export const CHAIN_ID = 61997;
export const CHAIN_ID_HEX = "0xf22d";
export const CHAIN_NAME = "Studio Next";
export const RPC_URL = "https://studio-dev.genlayer.com/api";
export const EXPLORER_URL = "https://explorer-studio-dev.genlayer.com";

export const CONTRACT_ADDRESS: string | null =
  (import.meta.env["VITE_PRIMACY_CONTRACT_ADDRESS"] as string | undefined) ?? null;

export const HAS_CONTRACT = Boolean(CONTRACT_ADDRESS);

export const ADD_CHAIN_PARAMS = {
  chainId: CHAIN_ID_HEX,
  chainName: `GenLayer ${CHAIN_NAME}`,
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [EXPLORER_URL],
};

export const VENUES = [
  { id: "binance" as const, label: "Binance" },
  { id: "bitget" as const, label: "Bitget" },
  { id: "gate" as const, label: "Gate" },
];

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

export function laneById(id: LaneId | string): Lane {
  return LANES.find((l) => l.id === id) ?? LANES[0]!;
}

export type { LaneId } from "./types";
import type { LaneId } from "./types";
