import React, { forwardRef } from "react";

const Textarea = forwardRef(function Textarea(
  { label, id, error, className = "", containerClassName = "", ...props },
  ref
) {
  const textareaId = id || props.name;
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label ? (
        <label htmlFor={textareaId} className="text-xs font-semibold text-text">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        className={`alq-textarea ${className}`}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
});

export default Textarea;
