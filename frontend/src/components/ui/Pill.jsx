const variants = {
  gold: "bg-gold/15 text-gold border-gold/30",
  white: "bg-white/10 text-white border-white/20",
};

export default function Pill({ variant = "gold", className = "", children, ...props }) {
  const styles = variants[variant] || variants.gold;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}