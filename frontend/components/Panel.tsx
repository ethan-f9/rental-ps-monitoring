import clsx from "clsx";

type PanelProps = {
  title?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function Panel({ title, eyebrow, action, className, children }: PanelProps) {
  return (
    <section className={clsx("rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]", className)}>
      {(title || eyebrow || action) && (
        <header className="mb-4 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            {eyebrow ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300">{eyebrow}</p>
            ) : null}
            {title ? <h2 className="text-lg font-semibold text-white">{title}</h2> : null}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
