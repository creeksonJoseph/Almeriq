export default function Stepper({ steps = [], current = 0, className = "" }) {
  const total = steps.length;
  return (
    <div className={`w-full ${className}`}>
      {/* Compact segmented bar below lg */}
      <div className="lg:hidden space-y-2">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>
            Step {Math.min(current + 1, total)} of {total}
          </span>
          <span className="text-text font-medium">{steps[current]}</span>
        </div>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= current ? "bg-gold" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Horizontal bar at lg+ */}
      <ol className="hidden lg:flex items-center w-full">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex-1 flex items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                    done
                      ? "bg-gold border-gold text-bg"
                      : active
                      ? "border-gold text-gold"
                      : "border-border text-white/60"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  className={`text-sm ${
                    active ? "text-text font-medium" : done ? "text-gold" : "text-white/60"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < total - 1 ? (
                <div
                  className={`flex-1 h-px mx-4 ${
                    i < current ? "bg-gold" : "bg-border"
                  }`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}