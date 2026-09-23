import { useLiveStatus } from "@/components/primacy/AppShell";
import { CHAIN_ID } from "./config";
import { useWallet } from "./useWallet";

/** Every write action (create/bet/settle/claim/refund/reclaim) needs all
 * three: an injected wallet connected, on chain 61997, against a
 * contract that's actually live right now -- not just configured. */
export function useWriteGate(): { canWrite: boolean; reason?: string } {
  const wallet = useWallet();
  const status = useLiveStatus();

  if (!wallet.hasProvider) return { canWrite: false, reason: "No wallet found in this browser." };
  if (!wallet.connected) return { canWrite: false, reason: "Connect your wallet first." };
  if (wallet.chainId !== CHAIN_ID) {
    return { canWrite: false, reason: `Switch to Studio Next (chain ${CHAIN_ID}).` };
  }
  if (status !== "live") {
    return { canWrite: false, reason: "Contract not deployed or not live on Studio Next." };
  }
  return { canWrite: true };
}
