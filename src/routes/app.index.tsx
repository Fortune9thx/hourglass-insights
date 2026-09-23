import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/primacy/AppShell";
import {
  Button,
  Card,
  Input,
  Metric,
  PoolBar,
  Skeleton,
  Sparkline,
  StatusPill,
  useNow,
} from "@/components/primacy/ui";
import { primacy } from "@/lib/primacy/client";
import { LANES, laneById } from "@/lib/primacy/config";
import { countdown, gen, windowLabel } from "@/lib/primacy/format";
import type { MarketState } from "@/lib/primacy/types";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Board — PRIMACY" },
      {
        name: "description",
        content: "Every open, upcoming and settled primacy hour on Studio Next.",
      },
      { property: "og:title", content: "Board — PRIMACY" },
      { property: "og:description", content: "Open, upcoming and settled primacy hours." },
    ],
  }),
  component: Board,
});

const STATES = ["All", "Open", "Upcoming", "Settled", "Inconclusive"] as const;

function Board() {
  const [q, setQ] = useState("");
  const [lane, setLane] = useState<string>("all");
  const [state, setState] = useState<(typeof STATES)[number]>("All");
  const now = useNow();

  const stats = useQuery({ queryKey: ["stats"], queryFn: () => primacy.getStats() });
  const markets = useQuery({
    queryKey: ["markets", lane, state],
    queryFn: () => primacy.getMarkets({ lane: lane as never, state }),
  });

  const rows = (markets.data ?? []).filter((m) =>
    q.trim() === ""
      ? true
      : m.legs.some((l) => l.symbol.toLowerCase().includes(q.toLowerCase().trim())) ||
        laneById(m.lane).name.toLowerCase().includes(q.toLowerCase().trim()),
  );

  return (
    <>
      <PageHeader
        title="Board"
        sub="USDT-M index return, completed UTC hour."
        action={
          <Link to="/app/create">
            <Button>Create hour</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="GEN in play"
          value={stats.data ? gen(stats.data.genInPlay, 0) : "—"}
          sub="open and upcoming pools"
        >
          {stats.data ? <Sparkline values={stats.data.sparkline} /> : <Skeleton className="h-10" />}
        </Metric>
        <Metric label="Open hours" value={stats.data?.openHours ?? "—"} sub="accepting stakes" />
        <Metric label="Settled 24h" value={stats.data?.settled24h ?? "—"} sub="2-of-3 reached" />
        <Metric
          label="Inconclusive 24h"
          value={stats.data?.inconclusive24h ?? "—"}
          sub="stakes returned"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search symbol or lane"
          className="h-11 w-full max-w-[260px]"
        />
        <select
          value={lane}
          onChange={(e) => setLane(e.target.value)}
          className="h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
        >
          <option value="all">All lanes</option>
          {LANES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap items-center gap-2">
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => setState(s)}
              className={`h-9 rounded-full px-4 text-[13px] transition-colors ${
                state === s
                  ? "bg-ink text-surface"
                  : "border border-line bg-surface text-mute hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-[12px] text-mute">{rows.length} hours</span>
      </div>

      <Card padded={false} className="mt-5 min-h-[480px] overflow-hidden">
        {markets.isPending ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex h-14 items-center gap-6 px-6">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-36" />
                <Skeleton className="ml-auto h-3 w-48" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[480px] flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-[15px] text-mute">
              No open hour in this lane. Next creatable window is{" "}
              <span className="font-mono text-ink">15:00 UTC</span>.
            </p>
            <Link to="/app/create">
              <Button>Create hour</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {rows.map((m) => {
              const total = m.legs.reduce((s, l) => s + l.pool, 0) || 1;
              const cd =
                now !== null && m.startsAt > now
                  ? `opens in ${countdown(m.startsAt - now)}`
                  : now !== null && m.endsAt > now
                    ? `closes in ${countdown(m.endsAt - now)}`
                    : "hour complete";
              return (
                <Link
                  key={m.id}
                  to="/app/m/$id"
                  params={{ id: m.id }}
                  className="flex h-14 items-center gap-4 px-6 transition-colors hover:bg-surface-2"
                >
                  <span className="w-[170px] shrink-0 truncate text-sm">
                    {laneById(m.lane).name}
                  </span>
                  <span className="w-[200px] shrink-0">
                    <span className="font-mono text-[13px]">
                      {windowLabel(m.startsAt, m.endsAt)}
                    </span>
                    <span className="ml-2 font-mono text-[11px] text-mute">{cd}</span>
                  </span>
                  <span className="hidden flex-1 items-center gap-3 lg:flex">
                    {m.legs.map((l) => (
                      <span key={l.symbol} className="flex-1">
                        <span className="font-mono text-[11px] text-mute">{l.symbol}</span>
                        <PoolBar share={l.pool / total} />
                      </span>
                    ))}
                  </span>
                  <span className="w-[110px] shrink-0 text-right font-mono text-[13px]">
                    {gen(m.totalPool, 0)} GEN
                  </span>
                  <span className="w-[130px] shrink-0 text-right">
                    <StatusPill state={m.state as MarketState} />
                  </span>
                  <span className="text-mute">›</span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
