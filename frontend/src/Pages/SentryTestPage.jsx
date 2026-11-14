import { useEffect } from "react";

export default function SentryTestPage() {
  useEffect(() => {
    throw new Error("Sentry test error - ALIMERIQ frontend Sentry wiring verified");
  }, []);

  return <div>Triggering Sentry test error…</div>;
}
