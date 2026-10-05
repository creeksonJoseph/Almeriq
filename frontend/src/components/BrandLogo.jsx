/**
 * components/BrandLogo.jsx - Shared brand identity component.
 *
 * The "Network A" mark:
 *   - Bold geometric A built from SVG <line> and <circle> primitives (no <text>).
 *   - Three node dots at the A's natural convergence points: apex + both crossbar ends.
 *   - Scales cleanly from favicon (16px) to large display (200px) with no artifacts.
 *   - Color: Champagne Gold (#f2ca50) on any dark background.
 */

const GOLD = "#f2ca50";

/**
 * BrandLogo
 *
 * @param {object}  props
 * @param {number}  [props.size=28]       - Height/width of the SVG mark in pixels.
 * @param {boolean} [props.showName=true] - Whether to render the "ALIMERIQ" wordmark beside the mark.
 * @param {string}  [props.href="#"]      - The href for the anchor wrapper.
 * @param {string}  [props.className=""] - Extra classes for the anchor wrapper.
 */
export default function BrandLogo({ size = 28, showName = true, href = "#", className = "" }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2.5 sm:gap-3 group no-underline ${className}`}
      style={{ textDecoration: "none" }}
      aria-label="ALIMERIQ - Home"
    >
      {/* ── The Network A SVG Mark ─────────────────────────────────── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        aria-hidden="true"
        focusable="false"
        style={{ display: "block", flexShrink: 0 }}
      >
        {/* Left leg */}
        <line x1="5" y1="39" x2="22" y2="5" stroke={GOLD} strokeWidth="4.5" strokeLinecap="round" />
        {/* Right leg */}
        <line x1="39" y1="39" x2="22" y2="5" stroke={GOLD} strokeWidth="4.5" strokeLinecap="round" />
        {/* Crossbar - sits at golden-ratio height */}
        <line x1="12.5" y1="27" x2="31.5" y2="27" stroke={GOLD} strokeWidth="3.5" strokeLinecap="round" />
        {/* Node: apex (primary convergence point) */}
        <circle cx="22" cy="5" r="3.2" fill={GOLD} />
        {/* Node: crossbar left endpoint */}
        <circle cx="12.5" cy="27" r="2.4" fill={GOLD} />
        {/* Node: crossbar right endpoint */}
        <circle cx="31.5" cy="27" r="2.4" fill={GOLD} />
      </svg>

      {/* ── Wordmark ───────────────────────────────────────────────── */}
      {showName && (
        <span
          className="font-serif tracking-tight text-white font-semibold group-hover:text-[#f2ca50] transition-colors duration-200"
          style={{ fontSize: "clamp(0.95rem, 2vw, 1.2rem)", letterSpacing: "-0.01em" }}
        >
          ALIMERIQ
        </span>
      )}
    </a>
  );
}
