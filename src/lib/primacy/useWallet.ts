import { useCallback, useEffect, useState } from "react";
import { ADD_CHAIN_PARAMS, CHAIN_ID, CHAIN_ID_HEX } from "./config";

interface Eip1193 {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
}

export function getInjectedProvider(): Eip1193 | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: Eip1193 }).ethereum ?? null;
}

const provider = getInjectedProvider;

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState(false);

  useEffect(() => {
    setHasProvider(Boolean(provider()));
  }, []);

  const refresh = useCallback(async (addr: string) => {
    const p = provider();
    if (!p) return;
    try {
      const cid = (await p.request({ method: "eth_chainId" })) as string;
      setChainId(parseInt(cid, 16));
      const raw = (await p.request({
        method: "eth_getBalance",
        params: [addr, "latest"],
      })) as string;
      setBalance((Number(BigInt(raw) / BigInt(1e12)) / 1e6).toFixed(3));
    } catch {
      setBalance(null);
    }
  }, []);

  const connect = useCallback(async () => {
    const p = provider();
    if (!p) {
      setError("No injected wallet found in this browser.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = (await p.request({ method: "eth_requestAccounts" })) as string[];
      const addr = accounts[0] ?? null;
      setAddress(addr);
      if (addr) await refresh(addr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet connection rejected.");
    } finally {
      setConnecting(false);
    }
  }, [refresh]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
  }, []);

  const switchChain = useCallback(async () => {
    const p = provider();
    if (!p) return;
    try {
      await p.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID_HEX }],
      });
    } catch {
      await p
        .request({ method: "wallet_addEthereumChain", params: [ADD_CHAIN_PARAMS] })
        .catch(() => {});
    }
    if (address) await refresh(address);
  }, [address, refresh]);

  return {
    address,
    chainId,
    balance,
    connecting,
    error,
    hasProvider,
    connected: Boolean(address),
    wrongChain: Boolean(address) && chainId !== null && chainId !== CHAIN_ID,
    connect,
    disconnect,
    switchChain,
  };
}
