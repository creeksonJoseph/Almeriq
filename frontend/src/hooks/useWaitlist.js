/**
 * hooks/useWaitlist.js - stateful logic for the waitlist form.
 *
 * Separates data-fetching / mutation logic from the presentational component.
 * Draft autosave: persists in-progress form to localStorage (§13).
 */
import { useState, useCallback, useEffect } from "react";
import { postWaitlist } from "../lib/api";

const DRAFT_KEY = "alimeriq_waitlist_draft";

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : { full_name: "", email: "", role: "" };
  } catch {
    return { full_name: "", email: "", role: "" };
  }
}

function saveDraft(draft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* quota */ }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

export function useWaitlist() {
  const [form, setForm] = useState(loadDraft);             // restored from localStorage
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle");            // idle|loading|success|duplicate|error
  const [serverError, setServerError] = useState("");

  // §13 - draft autosave on every change (debounced at 500ms)
  useEffect(() => {
    if (status === "success") return;                      // don't save after submit
    const t = setTimeout(() => saveDraft(form), 500);
    return () => clearTimeout(t);
  }, [form, status]);

  const setField = useCallback(
    (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    []
  );

  const setRole = useCallback(
    (role) => setForm((f) => ({ ...f, role: f.role === role ? "" : role })),
    []
  );

  const blur = useCallback(
    (key) => () => setTouched((t) => ({ ...t, [key]: true })),
    []
  );

  const canSubmit =
    form.full_name.trim().length >= 2 && form.email.includes("@") && form.role;

  const submit = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!canSubmit || status === "loading") return;

      setStatus("loading");
      setServerError("");

      try {
        await postWaitlist({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          role: form.role,
        });
        clearDraft();                    // §13 - clear after successful submit
        setStatus("success");
      } catch (err) {
        if (err.status === 409) {
          setStatus("duplicate");
        } else {
          setServerError(err.message || "Something went wrong. Please try again.");
          setStatus("error");
        }
      }
    },
    [form, canSubmit, status]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setServerError("");
  }, []);

  return { form, touched, status, serverError, canSubmit, setField, setRole, blur, submit, reset };
}
