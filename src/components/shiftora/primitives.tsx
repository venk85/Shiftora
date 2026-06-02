import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({ children, className, padded = true, hover = false }: { children: ReactNode; className?: string; padded?: boolean; hover?: boolean }) {
  return (
    <div className={cn("bg-surface border border-border rounded-[12px] shadow-card transition-shadow", padded && "p-4", hover && "hover:shadow-card-hover", className)}>
      {children}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("section-label", className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-[22px] flex-wrap">
      <div className="min-w-0">
        <h1 className="text-[20px] font-bold text-text tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-[12px] text-text-muted mt-1">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-2 flex-wrap">{right}</div>}
    </div>
  );
}

type Tone = "blue" | "gold" | "teal" | "violet" | "ok" | "er" | "am" | "muted";

const TONE: Record<Tone, { bg: string; bd: string; tx: string }> = {
  blue:   { bg: "var(--bl)", bd: "var(--bb)", tx: "var(--bt)" },
  gold:   { bg: "var(--gl)", bd: "var(--gb)", tx: "var(--gt)" },
  teal:   { bg: "var(--tll)", bd: "var(--tlb)", tx: "var(--tl)" },
  violet: { bg: "var(--vil)", bd: "var(--vib)", tx: "var(--vi)" },
  ok:     { bg: "var(--okl)", bd: "var(--okb)", tx: "var(--ok)" },
  er:     { bg: "var(--erl)", bd: "rgba(220,38,38,.22)", tx: "var(--er)" },
  am:     { bg: "var(--aml)", bd: "rgba(217,119,6,.22)", tx: "var(--am)" },
  muted:  { bg: "var(--s4)", bd: "var(--bd)", tx: "var(--t2)" },
};

export function Chip({ children, tone = "blue", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  const t = TONE[tone];
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", className)}
      style={{ background: t.bg, color: t.tx, border: `1px solid ${t.bd}` }}
    >
      {children}
    </span>
  );
}

export function Metric({ label, value, sub, tone = "blue", icon }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; icon?: ReactNode }) {
  const t = TONE[tone];
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <SectionLabel>{label}</SectionLabel>
        {icon && (
          <div className="size-7 rounded-md grid place-items-center" style={{ background: t.bg, color: t.tx }}>
            {icon}
          </div>
        )}
      </div>
      <div className="metric-num text-text">{value}</div>
      {sub && <div className="text-[11px] text-text-muted">{sub}</div>}
    </Card>
  );
}

export function ProgressBar({ value, tone = "blue", className }: { value: number; tone?: Tone; className?: string }) {
  const t = TONE[tone];
  return (
    <div className={cn("progress-track", className)}>
      <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: `linear-gradient(90deg, ${t.tx}, var(--vi))` }} />
    </div>
  );
}

export function Btn({ children, variant = "primary", size = "md", className, ...rest }: { children: ReactNode; variant?: "primary" | "ghost" | "outline" | "soft"; size?: "sm" | "md" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  const sz = size === "sm" ? "text-[12px] px-3 py-1.5" : "text-[13px] px-4 py-2";
  const v =
    variant === "primary"
      ? "bg-primary text-white hover:bg-[color:var(--bt)]"
      : variant === "outline"
      ? "border border-border-strong bg-surface hover:bg-surface-3 text-text"
      : variant === "soft"
      ? "bg-primary-soft text-primary-strong hover:bg-[color:var(--bb)]"
      : "text-text-muted hover:text-text hover:bg-surface-3";
  return (
    <button className={cn(base, sz, v, className)} {...rest}>
      {children}
    </button>
  );
}
