import { Button } from "./ui";
import { useWallet } from "@/lib/primacy/useWallet";
import { truncate } from "@/lib/primacy/format";

export function ConnectButton() {
  const w = useWallet();

  if (w.wrongChain) {
    return (
      <Button variant="accent" onClick={() => void w.switchChain()} className="h-9 px-4">
        Switch to Studio Next (61997)
      </Button>
    );
  }

  if (w.connected) {
    return (
      <button
        onClick={w.disconnect}
        className="inline-flex h-9 items-center gap-3 rounded-full border border-line bg-surface px-4 font-mono text-[12px] text-ink"
        title="Disconnect"
      >
        <span>{w.balance ?? "0.000"} GEN</span>
        <span className="text-mute">{truncate(w.address)}</span>
      </button>
    );
  }

  return (
    <Button
      onClick={() => void w.connect()}
      disabled={w.connecting}
      reason="Waiting on the wallet prompt"
      className="h-9 px-4"
    >
      {w.connecting ? "Connecting…" : "Connect"}
    </Button>
  );
}
