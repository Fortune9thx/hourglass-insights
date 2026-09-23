import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/primacy/AppShell";
import { Card, SectionLabel, Skeleton } from "@/components/primacy/ui";
import { primacy } from "@/lib/primacy/client";
import { EXPLORER_URL, laneById } from "@/lib/primacy/config";
import { stampLabel, truncate } from "@/lib/primacy/format";

export const Route = createFileRoute("/app/activity")({
  head: () => ({
    meta: [
      { title: "Activity — PRIMACY" },
      { name: "description", content: "Settlements, refunds and keeper actions on Studio Next." },
      { property: "og:title", content: "Activity — PRIMACY" },
      { property: "og:description", content: "Settlements, refunds and keeper actions." },
    ],
  }),
  component: Activity,
});

function Activity() {
  const q = useQuery({ queryKey: ["activity"], queryFn: () => primacy.listActivity() });
  const rows = q.data ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const event = rows.find((r) => r.id === selected) ?? null;

  return (
    <>
      <PageHeader title="Activity" sub="Settlements and keeper actions, newest first." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[62fr_38fr]">
        <Card padded={false} className="min-h-[520px] overflow-hidden">
          {q.isPending ? (
            <div className="divide-y divide-line">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex h-14 items-center gap-6 px-6">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="ml-auto h-3 w-52" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex min-h-[520px] items-center justify-center text-[15px] text-mute">
              No settlements recorded yet on Studio Next.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[11px] uppercase tracking-[0.12em] text-mute">
                  <th className="px-6 py-3 text-left font-normal">Time</th>
                  <th className="px-6 py-3 text-left font-normal">Market</th>
                  <th className="px-6 py-3 text-left font-normal">Action</th>
                  <th className="px-6 py-3 text-left font-normal">Verdict</th>
                  <th className="px-6 py-3 text-right font-normal">Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r.id)}
                    className={`h-14 cursor-pointer ${
                      selected === r.id ? "bg-accent-soft/50" : "hover:bg-surface-2"
                    }`}
                  >
                    <td className="px-6 font-mono text-[12px] text-mute">{stampLabel(r.at)}</td>
                    <td className="px-6">{laneById(r.lane).name}</td>
                    <td className="px-6 font-mono text-[12px]">{r.action}</td>
                    <td className="px-6 text-mute">{r.verdict}</td>
                    <td className="px-6 text-right font-mono text-[12px] text-mute">
                      {truncate(r.tx)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="min-h-[520px]">
          <SectionLabel>Inspector</SectionLabel>
          {!event ? (
            <div className="flex min-h-[420px] items-center justify-center text-[15px] text-mute">
              Select an event.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <h2 className="font-display text-[22px]">{event.verdict}</h2>
              <p className="text-[15px] text-mute">{event.detail}</p>
              <dl className="space-y-3 border-t border-line pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-mute">Time</dt>
                  <dd className="font-mono text-[13px]">{stampLabel(event.at)} UTC</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-mute">Action</dt>
                  <dd className="font-mono text-[13px]">{event.action}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-mute">Votes</dt>
                  <dd className="text-right font-mono text-[13px]">
                    {event.votes.length ? event.votes.join(" · ") : "none"}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-4 pt-2 text-sm">
                <Link
                  to="/app/m/$id"
                  params={{ id: event.marketId }}
                  className="underline underline-offset-4"
                >
                  Open ticket
                </Link>
                <a
                  href={`${EXPLORER_URL}/tx/${event.tx}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  View on explorer
                </a>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
