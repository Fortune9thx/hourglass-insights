import { CHAIN_ID, CHAIN_NAME, CONTRACT_ADDRESS } from "@/lib/primacy/config";
import { truncate } from "@/lib/primacy/format";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-3 gap-y-2 px-8 py-8 font-mono text-[12px] text-mute">
        <span className="text-ink">PRIMACY</span>
        <span>·</span>
        <span>{CHAIN_NAME}</span>
        <span>·</span>
        <span>chain {CHAIN_ID}</span>
        <span>·</span>
        <span>state may reset</span>
        <span>·</span>
        <span>contract {truncate(CONTRACT_ADDRESS)}</span>
      </div>
    </footer>
  );
}
