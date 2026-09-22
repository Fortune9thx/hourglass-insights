export function utcHourLabel(ts: number): string {
  const d = new Date(ts);
  const h = d.getUTCHours().toString().padStart(2, "0");
  return `${h}:00`;
}

export function windowLabel(startsAt: number, endsAt: number): string {
  return `${utcHourLabel(startsAt)}–${utcHourLabel(endsAt)} UTC`;
}

export function dayLabel(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function stampLabel(ts: number): string {
  const d = new Date(ts);
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  return `${dayLabel(ts)} ${hh}:${mm}`;
}

export function gen(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function bps(n: number | null): string {
  if (n === null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)} bps`;
}

export function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function truncate(addr: string | null, head = 6, tail = 4): string {
  if (!addr) return "0x…";
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function countdown(msLeft: number): string {
  if (msLeft <= 0) return "00:00";
  const total = Math.floor(msLeft / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (v: number) => v.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
