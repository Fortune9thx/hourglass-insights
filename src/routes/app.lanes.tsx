import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/primacy/AppShell";
import { Card, SectionLabel } from "@/components/primacy/ui";
import { CONSTITUTION, LANES } from "@/lib/primacy/config";

export const Route = createFileRoute("/app/lanes")({
  head: () => ({
    meta: [
      { title: "Lanes and constitution — PRIMACY" },
      {
        name: "description",
        content: "Instrument classes, locked venues and the eleven settlement rules of PRIMACY.",
      },
      { property: "og:title", content: "Lanes and constitution — PRIMACY" },
      { property: "og:description", content: "Instrument classes, locked venues, settlement rules." },
    ],
  }),
  component: Lanes,
});

function Lanes() {
  return (
    <>
      <PageHeader title="Lanes" sub="Instrument class, symbols and venues per lane." />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {LANES.map((lane) => (
          <Card key={lane.id}>
            <SectionLabel>Lane</SectionLabel>
            <h2 className="mt-1 font-display text-[24px]">{lane.name}</h2>
            <p className="mt-2 text-[15px] text-mute">{lane.instrumentClass}</p>
            <dl className="mt-6 space-y-3 border-t border-line pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Symbols</dt>
                <dd className="font-mono text-[13px]">{lane.symbols.join(" · ")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Venues</dt>
                <dd className="font-mono text-[13px]">{lane.venues.join(" · ")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Session</dt>
                <dd className="font-mono text-[13px]">{lane.session}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>

      <Card className="mt-5">
        <SectionLabel>Constitution</SectionLabel>
        <ol className="mt-4 space-y-3">
          {CONSTITUTION.map((rule, i) => (
            <li key={rule} className="flex gap-4 text-[15px]">
              <span className="font-mono text-[12px] text-mute">
                {(i + 1).toString().padStart(2, "0")}
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}
