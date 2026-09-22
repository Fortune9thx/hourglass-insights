import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ConnectButton } from "./ConnectButton";
import { Footer } from "./Footer";
import { CHAIN_ID, CHAIN_NAME, HAS_CONTRACT } from "@/lib/primacy/config";

const NAV = [
  { to: "/app", label: "Board", exact: true },
  { to: "/app/portfolio", label: "Portfolio" },
  { to: "/app/activity", label: "Activity" },
  { to: "/app/lanes", label: "Lanes" },
] as const;

export function DemoBanner() {
  if (HAS_CONTRACT) return null;
  return (
    <div className="border-b border-line bg-warn-soft">
      <div className="mx-auto max-w-[1200px] px-8 py-2 font-mono text-[12px] text-warn">
        Studio Next · contract not set · demo data
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <DemoBanner />
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
            <ConnectButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-8 py-8">{children}</main>
      <Footer />
    </div>
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
