import { Children, cloneElement } from "react";

const sizeClasses = {
  32: "w-8 h-8 text-xs",
  40: "w-10 h-10 text-sm",
  48: "w-12 h-12 text-base",
  56: "w-14 h-14 text-lg",
  64: "w-16 h-16 text-xl",
};

export function Avatar({ src, alt, name, size = 40, className = "", online = false, ...props }) {

  const getInitials = (str) => {
    if (!str) return "?";
    return str.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={`${sizeClasses[size] || sizeClasses[40]} rounded-full object-cover ring-2 ring-border`}
        />
      ) : (
        <div
          className={`${sizeClasses[size] || sizeClasses[40]} rounded-full bg-gold/10 flex items-center justify-center font-medium text-gold ring-2 ring-border`}
          aria-label={name}
        >
          {getInitials(name)}
        </div>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-gold ring-2 ring-bg"
          aria-label="Online"
        />
      )}
    </div>
  );
}

export function AvatarGroup({ children, maxVisible = 5, className = "", ...props }) {
  const kids = Children.toArray(children);
  const visible = kids.slice(0, maxVisible);
  const rest = kids.length - maxVisible;

  return (
    <div className={`flex -space-x-2 ${className}`} {...props}>
      {visible.map((child, i) =>
        cloneElement(child, { key: child.key || i, className: `relative z-${visible.length - i} ${child.props.className || ""}` })
      )}
      {rest > 0 && (
        <div
          className={`${sizeClasses[40]} rounded-full bg-surface-2 border-2 border-bg flex items-center justify-center text-xs font-medium text-white/60`}
          aria-label={`${rest} more users`}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}