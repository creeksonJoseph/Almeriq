import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
      <h1 className="text-4xl font-display font-bold text-white">404</h1>
      <p className="text-sm text-white">Page not found.</p>
      <Link
        to="/"
        className="px-5 py-2.5 rounded-full bg-[#C9A15A] text-[#0A0A0B] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all"
      >
        Return Home
      </Link>
    </div>
  );
}
