import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { MarketState } from "@/lib/primacy/types";

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return <div className={cn("card-surface", padded && "p-6", className)}>{children}</div>;
}

type Variant = "primary" | "accent" | "ghost" | "outline";

export function Button({
  variant = "primary",
  reason,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; reason?: string | undefined }) {
  const base =
    "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const styles: Record<Variant, string> = {
    primary: "bg-ink text-surface hover:bg-ink/90",
    accent: "bg-accent text-surface hover:bg-accent/90",
    ghost: "bg-transparent text-ink hover:bg-ink/5",
    outline: "border border-line bg-surface text-ink hover:bg-surface-2",
  };
  return (
    <button
      {...props}
      title={props.disabled ? reason : props.title}
      className={cn(base, styles[variant], className)}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-ink outline-none placeholder:text-mute focus:border-accent focus:ring-0",
        className,
      )}
    />
  );
}

export function StatusPill({ state }: { state: MarketState }) {
  const map: Record<MarketState, string> = {
    OPEN: "bg-accent-soft text-accent",
    UPCOMING: "bg-paper text-mute",
    SETTLED: "bg-up-soft text-up",
    INCONCLUSIVE: "bg-warn-soft text-warn",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 font-mono text-[11px] tracking-wide uppercase",
        map[state],
      )}
    >
      {state}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-ink/[0.06]", className)} />;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-mute">{children}</div>
  );
}

export function Metric({
  label,
  value,
  sub,
  children,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card className="flex flex-col justify-between gap-4">
      <SectionLabel>{label}</SectionLabel>
      <div>
        <div className="font-display text-[28px] leading-none">{value}</div>
        {sub ? <div className="mt-2 text-sm text-mute">{sub}</div> : null}
      </div>
      {children}
    </Card>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  return (
    <div className="flex h-10 items-end gap-[3px]">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-[2px] bg-accent"
          style={{ height: `${Math.max(12, v * 100)}%`, opacity: 0.4 + v * 0.3 }}
        />
      ))}
    </div>
  );
}

export function PoolBar({ share }: { share: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper">
      <div
        className="h-full rounded-full bg-accent"
        style={{ width: `${Math.max(2, share * 100)}%`, opacity: 0.55 }}
      />
    </div>
  );
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
