import React from "react";

const variants = {
  primary:
    "bg-gold text-bg hover:opacity-90 focus-visible:outline-gold",
  ghost:
    "bg-transparent border border-[#2b2b31] text-text hover:bg-surface-2 focus-visible:outline-gold",
  destructive:
    "bg-gold/20 text-gold border border-gold/40 hover:bg-gold/30 focus-visible:outline-gold",
  icon:
    "bg-transparent border border-[#2b2b31] text-text hover:bg-surface-2 p-0 aspect-square focus-visible:outline-gold",
};

export default function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  disabled = false,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 min-h-[44px] text-sm font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = variants[variant] || variants.primary;
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
