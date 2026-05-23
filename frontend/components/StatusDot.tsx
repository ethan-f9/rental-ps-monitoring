"use client";

type StatusDotProps = {
  tone?: "active" | "idle" | "danger" | "warning" | "neutral";
  label?: string;
};

const toneClassName: Record<NonNullable<StatusDotProps["tone"]>, string> = {
  active: "bg-cyan-400 shadow-[0_0_10px_rgba(0,255,240,0.8)]",
  idle: "bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]",
  danger: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]",
  warning: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]",
  neutral: "bg-zinc-500"
};

export function StatusDot({ tone = "neutral", label }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-zinc-400">
      <span className={`h-2.5 w-2.5 rounded-full ${toneClassName[tone]}`} />
      {label}
    </span>
  );
}
