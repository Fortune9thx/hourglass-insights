import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/primacy/AppShell";
import {
  Button,
  Card,
  Input,
  PoolBar,
  SectionLabel,
  Skeleton,
  StatusPill,
  useNow,
} from "@/components/primacy/ui";
import { primacy } from "@/lib/primacy/client";
import { VENUES, laneById } from "@/lib/primacy/config";
import { bps, countdown, gen, pct, windowLabel } from "@/lib/primacy/format";
import { useWriteGate } from "@/lib/primacy/useWriteGate";

export const Route = createFileRoute("/app/m/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Hour ${params.id} — PRIMACY` },
      {
        name: "description",
        content: "Pools, stakes and venue evidence for a single locked UTC hour.",
      },
      { property: "og:title", content: "Market ticket — PRIMACY" },
      { property: "og:description", content: "Pools, stakes and venue evidence for one UTC hour." },
    ],
  }),
  component: Ticket,
});

function Ticket() {
  const { id } = Route.useParams();
  const now = useNow();
  const queryClient = useQueryClient();
  const writeGate = useWriteGate();
  const [venue, setVenue] = useState(VENUES[0]!.id);
  const [amount, setAmount] = useState("");
  const [side, setSide] = useState<string | null>(null);

  const q = useQuery({ queryKey: ["market", id], queryFn: () => primacy.getMarket(id) });
  const m = q.data;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["market", id] });
    void queryClient.invalidateQueries({ queryKey: ["markets"] });
    void queryClient.invalidateQueries({ queryKey: ["board"] });
    void queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const betMutation = useMutation({
    mutationFn: () => primacy.placeBet({ marketId: id, symbol: side!, amount: Number(amount) }),
    onSuccess: () => {
      setAmount("");
      invalidate();
    },
  });

  const settleMutation = useMutation({
    mutationFn: () => primacy.settleMarket({ marketId: id }),
    onSuccess: invalidate,
  });

  const reclaimMutation = useMutation({
    mutationFn: () => primacy.reclaimBonds({ marketId: id }),
    onSuccess: invalidate,
  });

  if (q.isPending) {
    return (
      <>
        <PageHeader title="Hour" sub="Loading the ticket from Studio Next." />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[58fr_42fr]">
          <Card className="min-h-[420px] space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </Card>
          <Card className="min-h-[420px] space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </Card>
        </div>
      </>
    );
  }

  if (q.isError) {
    return (
      <>
        <PageHeader title="Could not load hour" />
        <Card className="flex min-h-[320px] flex-col items-center justify-center gap-4">
          <p className="text-[15px] text-mute">
            {q.error instanceof Error
              ? q.error.message
              : "Could not read this hour from Studio Next."}
          </p>
          <Link to="/app">
            <Button>Back to the board</Button>
          </Link>
        </Card>
      </>
    );
  }

  if (!m) {
    return (
      <>
        <PageHeader title="Hour not found" />
        <Card className="flex min-h-[320px] flex-col items-center justify-center gap-4">
          <p className="text-[15px] text-mute">No hour with this id on chain.</p>
          <Link to="/app">
            <Button>Back to the board</Button>
          </Link>
        </Card>
      </>
    );
  }

  const lane = laneById(m.lane);
  const total = m.legs.reduce((s, l) => s + l.pool, 0) || 1;
  const started = now !== null && now >= m.startsAt;
  const expired = now !== null && now >= m.endsAt;
  const bettingClosed = m.state !== "OPEN" || started;
  const canBet = m.state === "OPEN" && !started;
  const ev = m.evidence.find((e) => e.venue === venue);

  const betDisabledReason = !writeGate.canWrite
    ? writeGate.reason
    : !canBet
      ? "Betting closed at the hour start"
      : !side
        ? "Choose one symbol"
        : Number(amount) < 1
          ? "Minimum stake is 1 GEN"
          : undefined;

  return (
    <>
      <PageHeader
        title={lane.name}
        sub={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[13px] text-ink">
              {windowLabel(m.startsAt, m.endsAt)}
            </span>
            <StatusPill state={m.state} />
            {now !== null && !expired ? (
              <span className="font-mono text-[12px]">
                {started
                  ? `closes in ${countdown(m.endsAt - now)}`
                  : `opens in ${countdown(m.startsAt - now)}`}
              </span>
            ) : null}
          </span>
        }
        action={
          expired && m.state === "OPEN" ? (
            <Button
              variant="accent"
              disabled={!writeGate.canWrite || settleMutation.isPending}
              reason={writeGate.canWrite ? "Posts a 1 GEN settle bond" : writeGate.reason}
              onClick={() => settleMutation.mutate()}
            >
              {settleMutation.isPending ? "Settling…" : "Settle hour"}
            </Button>
          ) : m.state === "SETTLED" || m.state === "INCONCLUSIVE" ? (
            <Button
              variant="outline"
              disabled={!writeGate.canWrite || reclaimMutation.isPending}
              reason={writeGate.canWrite ? "Returns any bond owed to you" : writeGate.reason}
              onClick={() => reclaimMutation.mutate()}
            >
              {reclaimMutation.isPending ? "Reclaiming…" : "Reclaim bonds"}
            </Button>
          ) : null
        }
      />

      {settleMutation.isError ? (
        <p className="mb-4 text-[13px] text-down">
          {settleMutation.error instanceof Error ? settleMutation.error.message : "Settle failed."}
        </p>
      ) : null}
      {reclaimMutation.isError ? (
        <p className="mb-4 text-[13px] text-down">
          {reclaimMutation.error instanceof Error
            ? reclaimMutation.error.message
            : "Reclaim failed."}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[58fr_42fr]">
        <Card>
          <SectionLabel>Instruments · USDT-M index return, completed UTC hour</SectionLabel>
          <div className="mt-5 space-y-5">
            {m.legs.map((leg) => {
              const share = leg.pool / total;
              const selected = side === leg.symbol;
              return (
                <button
                  key={leg.symbol}
                  onClick={() => canBet && setSide(leg.symbol)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    selected ? "border-accent bg-accent-soft/50" : "border-line hover:bg-surface-2"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm">{leg.symbol}</span>
                    <span className="flex items-baseline gap-5 font-mono text-[13px]">
                      <span>{gen(leg.pool)} GEN</span>
                      <span className="text-mute">{pct(share)} implied</span>
                      {started ? (
                        <span
                          className={
                            leg.bps === null ? "text-mute" : leg.bps >= 0 ? "text-up" : "text-down"
                          }
                        >
                          {bps(leg.bps)}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div className="mt-3">
                    <PoolBar share={share} />
                  </div>
                </button>
              );
            })}
          </div>
          {started ? (
            <p className="mt-3 font-mono text-[11px] text-mute">
              bps shown are informational — not settlement
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row">
            <Input
              value={amount}
              inputMode="decimal"
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Stake in GEN"
              className="sm:max-w-[220px]"
            />
            <select
              value={side ?? ""}
              onChange={(e) => setSide(e.target.value || null)}
              disabled={!canBet}
              className="h-12 rounded-xl border border-line bg-surface px-4 text-[15px] text-ink outline-none focus:border-accent disabled:opacity-40 sm:max-w-[180px]"
            >
              <option value="">Select symbol</option>
              {m.legs.map((l) => (
                <option key={l.symbol} value={l.symbol}>
                  {l.symbol}
                </option>
              ))}
            </select>
            <Button
              className="h-12"
              disabled={Boolean(betDisabledReason) || betMutation.isPending}
              reason={betDisabledReason}
              onClick={() => betMutation.mutate()}
            >
              {betMutation.isPending ? "Placing…" : "Place bet"}
            </Button>
          </div>
          {betMutation.isError ? (
            <p className="mt-3 text-[13px] text-down">
              {betMutation.error instanceof Error ? betMutation.error.message : "Bet failed."}
            </p>
          ) : null}
          {betMutation.isSuccess ? <p className="mt-3 text-[13px] text-up">Bet placed.</p> : null}
          <p className="mt-3 text-[13px] text-mute">
            One symbol per wallet. Switching is rejected. Min 1 GEN. Betting closes at the hour
            start.
          </p>
          {bettingClosed ? (
            <p className="mt-1 font-mono text-[12px] text-warn">Betting closed for this hour.</p>
          ) : null}
        </Card>

        <Card>
          <SectionLabel>Evidence</SectionLabel>
          <div className="mt-4 flex items-center gap-2">
            {VENUES.map((v) => (
              <button
                key={v.id}
                onClick={() => setVenue(v.id)}
                className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide ${
                  venue === v.id ? "bg-ink text-surface" : "bg-surface-2 text-mute hover:text-ink"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {m.evidence.length === 0 ? (
            <div className="mt-6 space-y-3">
              <p className="pt-2 text-[13px] text-mute">
                No evidence yet. Evidence appears after the first successful settle call.
              </p>
            </div>
          ) : ev ? (
            <dl className="mt-6 space-y-3 text-sm">
              {[
                ["Vote", ev.vote ?? "ABSTAIN"],
                ["Open", ev.open === null ? "—" : ev.open.toFixed(4)],
                ["Close", ev.close === null ? "—" : ev.close.toFixed(4)],
                ["Return", bps(ev.bps)],
                ["Reason", ev.reason],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line pb-3">
                  <dt className="text-mute">{k}</dt>
                  <dd className="font-mono text-[13px]">{v}</dd>
                </div>
              ))}
              <a
                href={ev.source}
                target="_blank"
                rel="noreferrer"
                className="inline-block pt-1 text-sm underline underline-offset-4"
              >
                View source
              </a>
            </dl>
          ) : null}

          <p className="mt-6 border-t border-line pt-4 text-[13px] text-mute">
            Settlement reads this object. The chart does not.
          </p>
        </Card>
      </div>
    </>
  );
}
