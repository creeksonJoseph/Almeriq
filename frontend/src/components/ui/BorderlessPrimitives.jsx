/**
 * StatStrip
 * A seamless multi-metric ribbon using hairline column dividers instead of boxed cards.
 */
export function StatStrip({ items = [], className = "" }) {
  if (!items.length) return null;

  return (
    <div
      className={`grid w-full overflow-hidden rounded-xl border border-border bg-surface/40 divide-y sm:divide-y-0 sm:divide-x divide-border ${
        items.length === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : items.length === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : items.length === 4
          ? "grid-cols-2 sm:grid-cols-4"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      } ${className}`}
    >
      {items.map((it, idx) => (
        <div key={idx} className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              {it.label}
            </span>
            {it.badge && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${it.badgeColor || "bg-surface-2 text-text"}`}>
                {it.badge}
              </span>
            )}
          </div>
          <div className="mt-2">
            <p className={`font-serif text-2xl sm:text-3xl font-semibold tracking-tight ${it.valueColor || "text-text"}`}>
              {it.value}
            </p>
            {it.subtext && (
              <p className="mt-1 text-xs text-white/60 leading-relaxed">
                {it.subtext}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * EditorialSection
 * Replaces chunky 4-sided cards with clean typographic hierarchy and subtle hairline dividers.
 */
export function EditorialSection({
  title,
  icon: Icon,
  iconClass = "text-gold",
  badge,
  badgeClass = "bg-surface-2 text-white/60",
  children,
  className = "",
  actions,
}) {
  return (
    <section className={`py-4 ${className}`}>
      <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={17} className={`shrink-0 ${iconClass}`} />}
          <h3 className="font-semibold text-text text-base tracking-tight">{title}</h3>
          {badge && (
            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${badgeClass}`}>
              {badge}
            </span>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="text-sm text-white/70 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

/**
 * ExecutiveBanner
 * Minimalist callout with left accent rule, replacing heavy alert boxes.
 */
export function ExecutiveBanner({
  verdict,
  rationale,
  tone = "gold", // "gold" | "neutral"
  kicker = "Intelligence Verdict",
  className = "",
  aside,
}) {
const accentBorder = {
    gold: "border-l-4 border-gold bg-gradient-to-r from-gold/10 via-gold/5 to-transparent",
    neutral: "border-l-4 border-border bg-surface/40",
  }[tone] || "border-l-4 border-gold bg-gradient-to-r from-gold/10 to-transparent";

  const textColor = {
    gold: "text-gold",
    neutral: "text-white/60",
  }[tone] || "text-gold";

  return (
    <div className={`rounded-r-xl border-y border-r border-border py-4 px-5 sm:px-6 ${accentBorder} ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">{kicker}</p>
          <p className={`font-serif text-xl sm:text-2xl font-bold tracking-tight ${textColor}`}>{verdict}</p>
          {rationale && <p className="mt-1.5 text-xs sm:text-sm text-white/70 leading-relaxed">{rationale}</p>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </div>
  );
}

/**
 * TimelineFlow
 * Elegant connected vertical timeline for roadmaps and process steps.
 */
export function TimelineFlow({ steps = [], className = "" }) {
  if (!steps.length) return null;

  return (
    <div className={`relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border ${className}`}>
      {steps.map((st, i) => (
        <div key={i} className="relative group">
          {/* Node marker */}
          <div className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-bg">
            <div className={`h-1.5 w-1.5 rounded-full ${st.active ? "bg-gold" : "bg-white/30"} group-hover:scale-125 transition-transform`} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold">
                {st.phase || `Step ${i + 1}`}
              </span>
              <h4 className="text-sm sm:text-base font-semibold text-text">{st.title}</h4>
            </div>
            {st.duration && (
              <span className="text-[11px] font-mono text-white/60 bg-surface-2 px-2.5 py-0.5 rounded-full">
                {st.duration}
              </span>
            )}
          </div>

          {st.description && (
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-3xl mb-3">
              {st.description}
            </p>
          )}

          {st.deliverables && st.deliverables.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {st.deliverables.map((d, di) => (
                <span
                  key={di}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-text"
                >
                  <span className="text-gold text-[10px]">✓</span> {d}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}