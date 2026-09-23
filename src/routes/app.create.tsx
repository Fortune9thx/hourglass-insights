import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/primacy/AppShell";
import { Button, Card, SectionLabel } from "@/components/primacy/ui";
import { MarketTicket } from "@/components/primacy/MarketTicket";
import { primacy } from "@/lib/primacy/client";
import { HAS_CONTRACT, LANES } from "@/lib/primacy/config";
import type { LaneId, Market } from "@/lib/primacy/types";

export const Route = createFileRoute("/app/create")({
  head: () => ({
    meta: [
      { title: "Create hour — PRIMACY" },
      { name: "description", content: "Post a 2 GEN create bond and open the next UTC hour." },
      { property: "og:title", content: "Create hour — PRIMACY" },
      { property: "og:description", content: "Post a create bond and open the next UTC hour." },
    ],
  }),
  component: CreateHour,
});

const HOUR = 3_600_000;

function nextHours(count: number): number[] {
  const base = Math.ceil((Date.now() + 30 * 60_000) / HOUR) * HOUR;
  return Array.from({ length: count }, (_, i) => base + i * HOUR);
}

function label(ts: number) {
  const d = new Date(ts);
  const hh = d.getUTCHours().toString().padStart(2, "0");
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" })} ${hh}:00 UTC`;
}

function CreateHour() {
  const [lane, setLane] = useState<LaneId | null>(null);
  const [startsAt, setStartsAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const hours = useMemo(() => nextHours(12), []);

  const reason = !lane
    ? "Choose a lane"
    : !startsAt
      ? "Choose a UTC hour at least 30 minutes ahead"
      : !HAS_CONTRACT
        ? "Contract not set on Studio Next"
        : undefined;

  const preview: Market = {
    id: "preview",
    lane: lane ?? LANES[0]!.id,
    startsAt: startsAt ?? hours[0]!,
    endsAt: (startsAt ?? hours[0]!) + HOUR,
    state: "UPCOMING",
    legs: (lane ? LANES.find((l) => l.id === lane)! : LANES[0]!).symbols.map((symbol) => ({
      symbol,
      pool: 0,
      bps: null,
    })),
    totalPool: 0,
    winner: null,
    votes: 0,
    evidence: [],
  };

  return (
    <>
      <PageHeader title="Create hour" sub="Keeper action. The create bond is 2 GEN." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[58fr_42fr]">
        <Card>
          <SectionLabel>Lane</SectionLabel>
          <div className="mt-3 inline-flex rounded-full border border-line bg-surface-2 p-1">
            {LANES.map((l) => (
              <button
                key={l.id}
                onClick={() => setLane(l.id)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  lane === l.id ? "bg-ink text-surface" : "text-mute hover:text-ink"
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <SectionLabel>Hour · UTC only · minimum lead 30 minutes</SectionLabel>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {hours.map((h) => (
                <button
                  key={h}
                  onClick={() => setStartsAt(h)}
                  className={`h-11 rounded-xl border px-3 font-mono text-[12px] transition-colors ${
                    startsAt === h
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-line bg-surface text-ink hover:bg-surface-2"
                  }`}
                >
                  {label(h)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-line bg-surface-2 p-4 text-[14px]">
            <span className="font-mono text-[12px] text-warn">2 GEN create bond</span>
            <p className="mt-1 text-mute">
              The bond returns when the hour settles with a non-empty book. An hour that closes with
              no stakes slashes it.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Button
              disabled={Boolean(reason)}
              reason={reason}
              onClick={() => {
                setErr(null);
                primacy
                  .createHour({ lane: lane!, startsAt: startsAt! })
                  .catch((e: Error) => setErr(e.message));
              }}
            >
              Create hour
            </Button>
            {reason ? <span className="text-[13px] text-mute">{reason}</span> : null}
          </div>
          {err ? <p className="mt-3 text-[13px] text-down">{err}</p> : null}
        </Card>

        <div>
          <MarketTicket market={preview} />
          <p className="mt-3 text-[13px] text-mute">
            Preview only. Pools start empty and the first stake opens the book.
          </p>
        </div>
      </div>
    </>
  );
}
