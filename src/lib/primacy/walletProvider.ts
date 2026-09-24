/**
 * One shared wallet-provider discovery, used by both useWallet.ts (connect
 * UI state) and client.ts (signs real writes). They MUST agree on the same
 * provider instance -- discovering separately risks useWallet connecting to
 * one wallet while client.ts's own naive `window.ethereum` read picks a
 * different one in a multi-wallet browser, silently signing (or failing to
 * sign) with a wallet the user never approved.
 *
 * A naive `window.ethereum` read alone also breaks with more than one
 * wallet extension installed: some wallets overwrite `window.ethereum` on
 * load (last one wins, in an undefined order), others only announce
 * themselves via EIP-6963 and never touch the global at all -- either way
 * `request()` targets the wrong wallet or a `window.ethereum` that doesn't
 * exist, and the wallet's popup never fires with no error to show for it.
 * EIP-6963 discovery (the modern standard every major wallet now supports,
 * MetaMask included) is the real fix; legacy `window.ethereum` /
 * `window.ethereum.providers[]` reads stay only as a fallback for wallets
 * that predate it.
 */

export interface Eip1193 {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
}

interface Eip6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface Eip6963ProviderDetail {
  info: Eip6963ProviderInfo;
  provider: Eip1193;
}

export interface DiscoveredProvider {
  provider: Eip1193;
  name: string;
}

let selected: Eip1193 | null = null;
let discovered: DiscoveredProvider[] = [];

function discoverEip6963Providers(timeoutMs = 250): Promise<Eip6963ProviderDetail[]> {
  if (typeof window === "undefined") return Promise.resolve([]);
  return new Promise((resolve) => {
    const found: Eip6963ProviderDetail[] = [];
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
      if (detail && !found.some((f) => f.info.uuid === detail.info.uuid)) {
        found.push(detail);
      }
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      resolve(found);
    }, timeoutMs);
  });
}

function getLegacyProviders(): DiscoveredProvider[] {
  if (typeof window === "undefined") return [];
  const eth = (
    window as unknown as { ethereum?: Eip1193 & { providers?: Eip1193[]; isMetaMask?: boolean } }
  ).ethereum;
  if (!eth) return [];
  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    return eth.providers.map((p, i) => ({ provider: p, name: `Injected wallet ${i + 1}` }));
  }
  return [{ provider: eth, name: eth.isMetaMask ? "MetaMask" : "Injected wallet" }];
}

/** Runs discovery, remembers the result, and selects the first provider
 * found (EIP-6963 preferred) if nothing is selected yet. Safe to call more
 * than once -- later calls just refresh the list. */
export async function discoverProviders(): Promise<DiscoveredProvider[]> {
  const eip6963 = await discoverEip6963Providers();
  discovered =
    eip6963.length > 0
      ? eip6963.map((d) => ({ provider: d.provider, name: d.info.name }))
      : getLegacyProviders();
  if (!selected && discovered[0]) selected = discovered[0].provider;
  return discovered;
}

export function getSelectedProvider(): Eip1193 | null {
  return selected;
}

export function setSelectedProvider(provider: Eip1193 | null): void {
  selected = provider;
}

export function getDiscoveredProviders(): DiscoveredProvider[] {
  return discovered;
}
