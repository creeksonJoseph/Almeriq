/**
 * hooks/useWaitlist.js - stateful logic for the waitlist form.
 *
 * Separates data-fetching / mutation logic from the presentational component.
 * Draft autosave: persists in-progress form to localStorage (§13).
 */
import { useState, useCallback, useEffect } from "react";
import { postWaitlist, putWaitlist } from "../lib/api";

const DRAFT_KEY = "alimeriq_waitlist_draft";

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { full_name: "", email: "", role: "" };
    const parsed = JSON.parse(raw);
    return {
      full_name: parsed.full_name ? parsed.full_name.trim() : "",
      email: parsed.email ? parsed.email.trim().toLowerCase().replace(/\s+/g, "") : "",
      role: parsed.role || "",
    };
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
  const [status, setStatus] = useState("idle");            // idle|loading|success|already_registered|conflict_prompt|edit_mode|updating|updated|error
  const [serverError, setServerError] = useState("");
  const [existingUser, setExistingUser] = useState(null);  // { full_name, email, role }

  // §13 - draft autosave on every change (debounced at 500ms)
  useEffect(() => {
    if (status === "success" || status === "updated") return;
    const t = setTimeout(() => saveDraft(form), 500);
    return () => clearTimeout(t);
  }, [form, status]);

  const setField = useCallback(
    (key) => (e) => {
      let val = e.target.value;
      if (key === "email") {
        val = val.toLowerCase().replace(/\s+/g, "");
      }
      setForm((f) => ({ ...f, [key]: val }));
    },
    []
  );

  const setRole = useCallback(
    (role) => setForm((f) => ({ ...f, role: f.role === role ? "" : role })),
    []
  );

  const blur = useCallback(
    (key) => () => {
      setTouched((t) => ({ ...t, [key]: true }));
      setForm((f) => {
        if (key === "email") {
          return { ...f, email: f.email.trim().toLowerCase().replace(/\s+/g, "") };
        }
        if (key === "full_name") {
          return { ...f, full_name: f.full_name.trim().replace(/\s+/g, " ") };
        }
        return f;
      });
    },
    []
  );

  const cleanEmail = form.email.trim().toLowerCase().replace(/\s+/g, "");
  const cleanName = form.full_name.trim().replace(/\s+/g, " ");

  const canSubmit =
    cleanName.length >= 2 && cleanEmail.includes("@") && form.role;

  const submit = useCallback(
    async (e) => {
      e?.preventDefault();
      const cEmail = form.email.trim().toLowerCase().replace(/\s+/g, "");
      const cName = form.full_name.trim().replace(/\s+/g, " ");
      if (cName.length < 2 || !cEmail.includes("@") || !form.role || status === "loading") return;

      setStatus("loading");
      setServerError("");

      try {
        await postWaitlist({
          full_name: cName,
          email: cEmail,
          role: form.role,
        });
        clearDraft();
        setStatus("success");
      } catch (err) {
        if (err.status === 409) {
          const detail = err.detail;
          if (detail && typeof detail === "object") {
            setExistingUser(detail.existing || null);
            if (detail.code === "ALREADY_REGISTERED_DIFFERENT") {
              setStatus("conflict_prompt");
              return;
            }
          }
          // Same details or fallback 409
          if (detail && typeof detail === "object" && detail.existing) {
            setExistingUser(detail.existing);
          }
          setStatus("already_registered");
        } else {
          setServerError(err.message || "Something went wrong. Please try again.");
          setStatus("error");
        }
      }
    },
    [form, status]
  );

  const updateSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      const cEmail = form.email.trim().toLowerCase().replace(/\s+/g, "");
      const cName = form.full_name.trim().replace(/\s+/g, " ");
      if (cName.length < 2 || !cEmail.includes("@") || !form.role || status === "updating") return;

      setStatus("updating");
      setServerError("");

      try {
        await putWaitlist({
          full_name: cName,
          email: cEmail,
          role: form.role,
        });
        clearDraft();
        setStatus("updated");
      } catch (err) {
        setServerError(err.message || "Failed to update waitlist details. Please try again.");
        setStatus("edit_mode");
      }
    },
    [form, status]
  );

  const startEdit = useCallback(() => {
    setStatus("edit_mode");
    setServerError("");
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setServerError("");
    setExistingUser(null);
  }, []);

  return {
    form,
    touched,
    status,
    serverError,
    existingUser,
    canSubmit,
    setField,
    setRole,
    blur,
    submit,
    updateSubmit,
    startEdit,
    reset,
  };
}
