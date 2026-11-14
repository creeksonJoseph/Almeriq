import React from "react";
import { Link as RouterLink } from "react-router-dom";

export function Link({ to, href, external = false, className = "", children, ...props }) {
  if (external && href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 text-gold hover:text-gold/80 underline-offset-2 hover:underline ${className}`}
        {...props}
      >
        {children}
      </a>
    );
  }

  if (to) {
    return (
      <RouterLink
        to={to}
        className={`inline-flex items-center gap-1.5 text-gold hover:text-gold/80 underline-offset-2 hover:underline ${className}`}
        {...props}
      >
        {children}
      </RouterLink>
    );
  }

  if (href) {
    return (
      <RouterLink
        to={href}
        className={`inline-flex items-center gap-1.5 text-gold hover:text-gold/80 underline-offset-2 hover:underline ${className}`}
        {...props}
      >
        {children}
      </RouterLink>
    );
  }

  return (
    <span className={className} {...props}>
      {children}
    </span>
  );
}