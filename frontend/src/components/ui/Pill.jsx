const variants = {
  gold: "bg-[#f2ca50]/15 text-[#f2ca50] border-[#f2ca50]/30",
  white: "bg-[#1a1b21] text-[#ffffff] border-[#282a2f]",
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