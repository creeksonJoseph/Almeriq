import React, { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, id, error, className = "", containerClassName = "", ...props },
  ref
) {
  const inputId = id || props.name;
  const base =
    "w-full rounded-xl border bg-surface-2 px-3 py-2.5 text-sm text-text placeholder:text-white/40 outline-none transition-colors min-h-[44px]";
  const border = error
    ? "border-gold focus:border-gold focus:ring-1 focus:ring-gold"
    : "border-border focus:border-gold focus:ring-1 focus:ring-gold";
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label ? (
        <label htmlFor={inputId} className="text-xs font-semibold text-text">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={`${base} ${border} ${className}`}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
      {error ? <p className="text-xs text-gold">{error}</p> : null}
    </div>
  );
});

export default Input;