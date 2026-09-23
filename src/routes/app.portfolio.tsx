import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/primacy/AppShell";
import { Button, Card, Metric, Skeleton, StatusPill } from "@/components/primacy/ui";
import { primacy } from "@/lib/primacy/client";
import { HAS_CONTRACT, laneById } from "@/lib/primacy/config";
import { gen, windowLabel } from "@/lib/primacy/format";
import { useWallet } from "@/lib/primacy/useWallet";

export const Route = createFileRoute("/app/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — PRIMACY" },
      {
        name: "description",
        content: "Open exposure, claimable payouts and refunds on Studio Next.",
      },
      { property: "og:title", content: "Portfolio — PRIMACY" },
      { property: "og:description", content: "Positions, claims and refunds." },
    ],
  }),
  component: Portfolio,
});

function Portfolio() {
  const wallet = useWallet();
  const queryClient = useQueryClient();
  const [err, setErr] = useState<string | null>(null);

  const positions = useQuery({
    queryKey: ["positions", wallet.address],
    queryFn: () => primacy.getUserPositions(wallet.address ?? ""),
    enabled: Boolean(wallet.address) || !HAS_CONTRACT,
  });
  const rows = positions.data ?? [];

  const claimMutation = useMutation({
    mutationFn: (p: (typeof rows)[number]) =>
      p.state === "INCONCLUSIVE"
        ? primacy.claimRefund({ marketId: p.marketId })
        : primacy.claim({ marketId: p.marketId }),
    onSuccess: () => {
      setErr(null);
      void queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
    onError: (e: Error) => setErr(e.message),
  });
  const openExposure = rows
    .filter((p) => p.state === "OPEN" || p.state === "UPCOMING")
    .reduce((s, p) => s + p.stake, 0);
  const claimable = rows
    .filter((p) => !p.claimed && p.payout && p.payout > 0)
    .reduce((s, p) => s + (p.payout ?? 0), 0);

  return (
    <>
      <PageHeader title="Portfolio" sub="One symbol per wallet per hour." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Metric
          label="Open exposure"
          value={`${gen(openExposure)} GEN`}
          sub="stakes in live hours"
        />
        <Metric
          label="Claimable"
          value={`${gen(claimable)} GEN`}
          sub="payouts and refunds waiting"
        />
      </div>

      <Card padded={false} className="mt-5 min-h-[420px] overflow-hidden">
        {positions.isPending ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex h-14 items-center gap-6 px-6">
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="ml-auto h-3 w-24" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : !wallet.address && HAS_CONTRACT ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
            <p className="text-[15px] text-mute">Connect a wallet to see your positions.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
            <p className="text-[15px] text-mute">No positions on Studio Next.</p>
            <Link to="/app">
              <Button>Open the board</Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[11px] uppercase tracking-[0.12em] text-mute">
                <th className="px-6 py-3 text-left font-normal">Hour</th>
                <th className="px-6 py-3 text-left font-normal">Side</th>
                <th className="px-6 py-3 text-right font-normal">Stake</th>
                <th className="px-6 py-3 text-right font-normal">State</th>
                <th className="px-6 py-3 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => {
                const canClaim = !p.claimed && (p.payout ?? 0) > 0;
                return (
                  <tr key={p.marketId} className="h-14 hover:bg-surface-2">
                    <td className="px-6">
                      <Link to="/app/m/$id" params={{ id: p.marketId }} className="hover:underline">
                        <span className="text-mute">{laneById(p.lane).name} · </span>
                        <span className="font-mono text-[13px]">
                          {windowLabel(p.startsAt, p.startsAt + 3_600_000)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 font-mono text-[13px]">{p.symbol}</td>
                    <td className="px-6 text-right font-mono text-[13px]">{gen(p.stake)} GEN</td>
                    <td className="px-6 text-right">
                      <StatusPill state={p.state} />
                    </td>
                    <td className="px-6 text-right">
                      <Button
                        variant="outline"
                        className="h-9 px-4"
                        disabled={!canClaim || !HAS_CONTRACT || claimMutation.isPending}
                        reason={
                          !HAS_CONTRACT
                            ? "No contract set on Studio Next"
                            : p.claimed
                              ? "Already claimed"
                              : "Nothing to claim on this hour"
                        }
                        onClick={() => claimMutation.mutate(p)}
                      >
                        {claimMutation.isPending && claimMutation.variables?.marketId === p.marketId
                          ? "…"
                          : p.state === "INCONCLUSIVE"
                            ? "Refund"
                            : "Claim"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
      {err ? <p className="mt-3 text-[13px] text-down">{err}</p> : null}
    </>
  );
}
