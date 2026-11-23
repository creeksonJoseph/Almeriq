import React, { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, id, error, className = "", containerClassName = "", ...props },
  ref
) {
  const inputId = id || props.name;
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
        className={`alq-input ${className}`}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
});

export default Input;
