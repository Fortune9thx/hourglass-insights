import { Link, createFileRoute } from "@tanstack/react-router";
import { Button, Card, SectionLabel } from "@/components/primacy/ui";
import { MarketTicket } from "@/components/primacy/MarketTicket";
import { Footer } from "@/components/primacy/Footer";
import { ConnectButton } from "@/components/primacy/ConnectButton";
import { DemoBanner } from "@/components/primacy/AppShell";
import { MOCK_MARKETS } from "@/lib/primacy/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PRIMACY — which name led the hour" },
      {
        name: "description",
        content:
          "An hourly primacy market on GenLayer. Three comparable instruments, one locked UTC hour, 2-of-3 venue consensus.",
      },
      { property: "og:title", content: "PRIMACY — which name led the hour" },
      {
        property: "og:description",
        content:
          "Three comparable instruments. One UTC hour. Independent venue candles. 2-of-3 consensus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Marketing,
});

const FEATURES = [
  {
    title: "Locked venues",
    body: "Binance, Bitget, Gate. Hosts are hardcoded in the contract. No user-supplied URLs reach settlement.",
  },
  {
    title: "Derived consensus",
    body: "Validators agree on the winner and the vote count, not on raw JSON payloads.",
  },
  {
    title: "Honest instruments",
    body: "Every leg is a USDT-M index return over a completed UTC hour. Not cash equities.",
  },
  {
    title: "Keeper bonds",
    body: "Create posts 2 GEN, settle posts 1 GEN. An hour that closes with an empty book slashes the create bond.",
  },
  {
    title: "Exact refunds",
    body: "An inconclusive hour returns the stake to the wallet that posted it. No fee is taken.",
  },
];

function Marketing() {
  const featured =
    MOCK_MARKETS.find((m) => m.lane === "crypto-equity-proxies" && m.state === "SETTLED") ??
    MOCK_MARKETS[0]!;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <DemoBanner />
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-8">
          <Link to="/" className="font-display text-lg">
            PRIMACY
          </Link>
          <nav className="hidden items-center gap-5 text-sm md:flex">
            <Link to="/app" className="text-mute hover:text-ink">
              Board
            </Link>
            <Link to="/app/lanes" className="text-mute hover:text-ink">
              Lanes
            </Link>
            <Link to="/app/activity" className="text-mute hover:text-ink">
              Docs
            </Link>
          </nav>
          <div className="ml-auto">
            <ConnectButton />
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-12 px-8 py-20 lg:grid-cols-[1fr_460px]">
        <div>
          <h1 className="font-display text-[56px] leading-[1.05] md:text-[68px]">
            Which name led the hour.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] text-mute">
            Three comparable instruments. One UTC hour. Independent venue candles. 2-of-3 consensus.
          </p>
          <div className="mt-8 flex items-center gap-6">
            <Link to="/app">
              <Button>Open the board</Button>
            </Link>
            <Link to="/app/lanes" className="text-sm text-ink underline underline-offset-4">
              Read the constitution
            </Link>
          </div>
        </div>
        <MarketTicket market={featured} />
      </section>

      <section className="bg-band text-band-text">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-8 py-20 lg:grid-cols-2">
          <h2 className="font-display text-[40px] leading-[1.1]">
            A comparative hour is a judgment, not a feed.
          </h2>
          <div>
            <div className="grid grid-cols-3 gap-6 border-b border-band-text/15 pb-8">
              {[
                ["2-of-3", "venues must agree"],
                ["30 min", "minimum lead time"],
                ["2%", "fee on settled winners"],
              ].map(([v, l]) => (
                <div key={v}>
                  <div className="font-display text-[32px]">{v}</div>
                  <div className="mt-1 text-[13px] text-band-text/60">{l}</div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-[15px] text-band-text/65">
              If venues do not agree, the hour is inconclusive and every stake is returned.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-8 py-20">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="flex min-h-[240px] flex-col">
              <h3 className="font-display text-[22px]">{f.title}</h3>
              <p className="mt-3 text-[15px] text-mute">{f.body}</p>
              <Link
                to="/app/lanes"
                className="mt-auto pt-6 text-sm text-ink underline underline-offset-4"
              >
                Constitution
              </Link>
            </Card>
          ))}
          <div className="flex min-h-[240px] flex-col rounded-[20px] bg-band p-6 text-band-text">
            <SectionLabel>
              <span className="text-band-text/50">Keeper</span>
            </SectionLabel>
            <h3 className="mt-3 font-display text-[22px]">Open the next hour</h3>
            <p className="mt-3 text-[15px] text-band-text/60">
              Post a 2 GEN create bond and put the next UTC hour on the board.
            </p>
            <div className="mt-auto pt-6">
              <Link to="/app/create">
                <Button variant="outline" className="border-band-text/25 bg-transparent text-band-text hover:bg-band-text/10">
                  Create hour
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
