import React, { forwardRef } from "react";

const Select = forwardRef(function Select(
  { label, id, error, className = "", containerClassName = "", children, ...props },
  ref
) {
  const selectId = id || props.name;
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label ? (
        <label htmlFor={selectId} className="text-xs font-semibold text-text">
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        className={`alq-select ${className}`}
        aria-invalid={error ? "true" : undefined}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
});

export default Select;
