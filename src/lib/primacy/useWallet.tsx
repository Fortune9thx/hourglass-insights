import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ADD_CHAIN_PARAMS, CHAIN_ID, CHAIN_ID_HEX } from "./config";
import { discoverProviders, getSelectedProvider, type Eip1193 } from "./walletProvider";

export interface WalletState {
  address: string | null;
  chainId: number | null;
  balance: string | null;
  connecting: boolean;
  error: string | null;
  hasProvider: boolean;
  connected: boolean;
  wrongChain: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: () => Promise<void>;
}

/**
 * The actual wallet-state implementation. This must be called from exactly
 * ONE place (WalletProvider, below) -- every `useState` here is local to
 * the component instance that calls it, so calling this hook independently
 * from multiple components (as ConnectButton and useWriteGate used to)
 * gives each one its own disconnected copy: ConnectButton shows a real
 * connected address while every write-gated page still sees
 * `connected: false` forever, because connect() only ever updated
 * ConnectButton's own instance. Confirmed live: the header showed a real
 * connected wallet with a real balance while every "Create hour"/bet/
 * settle button stayed disabled with "Connect your wallet first."
 */
function useWalletState(): WalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void discoverProviders().then((found) => {
      if (cancelled) return;
      setHasProvider(found.length > 0);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const provider = useCallback((): Eip1193 | null => getSelectedProvider(), []);

  const refresh = useCallback(
    async (addr: string) => {
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
    },
    [provider],
  );

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
  }, [provider, refresh]);

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
  }, [address, provider, refresh]);

  // Keep state in sync when the wallet extension itself changes accounts or
  // network -- without this, switching accounts in MetaMask after connecting
  // leaves this app silently pointed at the old address until a full reload.
  useEffect(() => {
    const p = provider();
    if (!p?.on) return;
    const onAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      const addr = accounts[0] ?? null;
      setAddress(addr);
      if (addr) void refresh(addr);
    };
    const onChainChanged = (...args: unknown[]) => {
      const cid = args[0] as string;
      setChainId(parseInt(cid, 16));
    };
    p.on("accountsChanged", onAccountsChanged);
    p.on("chainChanged", onChainChanged);
    return () => {
      p.removeListener?.("accountsChanged", onAccountsChanged);
      p.removeListener?.("chainChanged", onChainChanged);
    };
  }, [address, provider, refresh]);

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

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWalletState();
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}

/** The single wallet state every component reads and acts on -- always the
 * same instance app-wide, via WalletProvider (mounted once in __root.tsx,
 * above both the landing page and /app/*). Never call useWalletState()
 * directly outside of WalletProvider. */
export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet() must be used within <WalletProvider>");
  }
  return ctx;
}
