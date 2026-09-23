import { useState } from "react";
import { Card, PoolBar, SectionLabel, StatusPill } from "./ui";
import { bps, gen, windowLabel } from "@/lib/primacy/format";
import { VENUES, laneById } from "@/lib/primacy/config";
import type { Market } from "@/lib/primacy/types";

export function MarketTicket({ market }: { market: Market }) {
  const [venue, setVenue] = useState(VENUES[0]!.id);
  const lane = laneById(market.lane);
  const total = market.legs.reduce((s, l) => s + l.pool, 0) || 1;

  return (
    <Card className="w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>{lane.name}</SectionLabel>
          <div className="mt-1 font-display text-xl">
            {windowLabel(market.startsAt, market.endsAt)}
          </div>
          <div className="mt-1 text-[13px] text-mute">USDT-M index return, completed UTC hour</div>
        </div>
        <StatusPill state={market.state} />
      </div>

      <div className="mt-6 space-y-4">
        {market.legs.map((leg) => (
          <div key={leg.symbol} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[13px]">{leg.symbol}</span>
              <span className="flex items-baseline gap-4">
                <span className="font-mono text-[13px] text-mute">{gen(leg.pool)} GEN</span>
                <span
                  className={`font-mono text-[13px] ${
                    leg.bps === null ? "text-mute" : leg.bps >= 0 ? "text-up" : "text-down"
                  }`}
                >
                  {bps(leg.bps)}
                </span>
              </span>
            </div>
            <PoolBar share={leg.pool / total} />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-line pt-4">
        {VENUES.map((v) => (
          <button
            key={v.id}
            onClick={() => setVenue(v.id)}
            className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors ${
              venue === v.id ? "bg-ink text-surface" : "bg-surface-2 text-mute hover:text-ink"
            }`}
          >
            {v.label}
          </button>
        ))}
        <span className="ml-auto font-mono text-[11px] text-mute">{market.votes}/3 votes</span>
      </div>
    </Card>
  );
}
