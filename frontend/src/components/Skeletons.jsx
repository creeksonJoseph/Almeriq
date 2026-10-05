/**
 * components/Skeletons.jsx - §8 skeleton system.
 *
 * Rules:
 *  - Match real dimensions → zero CLS.
 *  - CSS-only pulse animation (no JS).
 *  - One skeleton per major UI region.
 */
import "../Skeletons.css";

export function CardSkeleton({ height = 180 }) {
  return (
    <div
      className="skeleton-pulse"
      style={{ borderRadius: 20, height, width: "100%" }}
      aria-hidden="true"
    />
  );
}

export function GridSkeleton({ count = 4, height = 180 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} height={height} />
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="skeleton-form" aria-hidden="true">
      <div className="skeleton-pulse" style={{ height: 16, width: "30%", marginBottom: 8, borderRadius: 4 }} />
      <div className="skeleton-pulse" style={{ height: 48, width: "100%", marginBottom: 16, borderRadius: 12 }} />
      <div className="skeleton-pulse" style={{ height: 16, width: "30%", marginBottom: 8, borderRadius: 4 }} />
      <div className="skeleton-pulse" style={{ height: 48, width: "100%", marginBottom: 16, borderRadius: 12 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="skeleton-pulse" style={{ height: 48, borderRadius: 12 }} />
        ))}
      </div>
      <div className="skeleton-pulse" style={{ height: 52, width: "100%", borderRadius: 12 }} />
    </div>
  );
}
