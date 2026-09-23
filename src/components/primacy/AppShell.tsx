import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
import { ConnectButton } from "./ConnectButton";
import { Footer } from "./Footer";
import { CHAIN_ID, CHAIN_NAME, CONTRACT_ADDRESS, EXPLORER_URL } from "@/lib/primacy/config";
import { primacy, type LiveStatus } from "@/lib/primacy/client";
import { truncate } from "@/lib/primacy/format";

const NAV: {
  to: "/app" | "/app/portfolio" | "/app/activity" | "/app/lanes";
  label: string;
  exact?: boolean;
}[] = [
  { to: "/app", label: "Board", exact: true },
  { to: "/app/portfolio", label: "Portfolio" },
  { to: "/app/activity", label: "Activity" },
  { to: "/app/lanes", label: "Lanes" },
];

const LiveStatusContext = createContext<LiveStatus | undefined>(undefined);

/** The single hook every page/component uses to know whether the
 * contract is really live -- undefined while the first check is still
 * in flight. Never assume live just because an address is configured;
 * this reflects a real `eth_getCode` result. */
export function useLiveStatus(): LiveStatus | undefined {
  return useContext(LiveStatusContext);
}

function useLiveStatusQuery() {
  return useQuery({
    queryKey: ["liveStatus"],
    queryFn: () => primacy.checkLiveStatus(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

function StatusBanner({ status }: { status: LiveStatus | undefined }) {
  if (!status || status === "live") return null;
  const copy: Record<Exclude<LiveStatus, "live">, string> = {
    not_deployed: "Contract not deployed on Studio Next (61997).",
    no_code: "No code at this address. Studio Next was reset. Redeploy.",
    rpc_down: "Cannot reach studio-dev.genlayer.com.",
  };
  return (
    <div className="border-b border-line bg-warn-soft">
      <div className="mx-auto max-w-[1200px] px-8 py-2 font-mono text-[12px] text-warn">
        {copy[status]}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const statusQuery = useLiveStatusQuery();
  const status = statusQuery.data;

  return (
    <LiveStatusContext.Provider value={status}>
      <div className="flex min-h-screen flex-col bg-paper">
        <StatusBanner status={status} />
        <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-8">
            <Link to="/" className="font-display text-lg tracking-tight">
              PRIMACY
            </Link>
            <nav className="hidden items-center gap-5 text-sm md:flex">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  activeOptions={{ exact: n.exact ?? false }}
                  className="text-mute transition-colors hover:text-ink data-[status=active]:text-ink"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-[11px] text-mute sm:inline">
                {CHAIN_NAME} · {CHAIN_ID}
              </span>
              {status === "live" && CONTRACT_ADDRESS ? (
                <a
                  href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-[11px] text-mute hover:text-ink sm:inline"
                >
                  {truncate(CONTRACT_ADDRESS)}
                </a>
              ) : null}
              <ConnectButton />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-8 py-8">{children}</main>
        <Footer />
      </div>
    </LiveStatusContext.Provider>
  );
}

export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[32px] leading-tight">{title}</h1>
        {sub ? <p className="mt-1 text-sm text-mute">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}
