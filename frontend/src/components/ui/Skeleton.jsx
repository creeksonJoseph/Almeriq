export default function Skeleton({ className = "", style }) {
  return (
    <div
      className={`animate-pulse bg-surface-2 rounded-lg ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-surface-2 rounded h-3"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`bg-surface border border-transparent rounded-2xl p-4 space-y-3 ${className}`} aria-hidden="true">
      <div className="animate-pulse bg-surface-2 rounded h-4 w-1/3" />
      <div className="animate-pulse bg-surface-2 rounded h-24 w-full" />
      <div className="animate-pulse bg-surface-2 rounded h-3 w-2/3" />
    </div>
  );
}
