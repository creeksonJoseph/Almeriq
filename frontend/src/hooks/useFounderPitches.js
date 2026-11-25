import { useCallback, useEffect, useState } from "react";
import {
  createFounderPitchApi,
  deleteFounderPitchApi,
  listFounderInvestmentRequestsApi,
  listFounderPitchesApi,
  publishFounderPitchApi,
  unpublishFounderPitchApi,
  updateFounderInvestmentRequestApi,
  updateFounderPitchApi,
} from "../lib/api/founder";
import { startInvestmentConversationApi } from "../lib/api/conversations";

export function useFounderPitches() {
  const [pitches, setPitches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    const [pitchResult, requestResult] = await Promise.allSettled([
      listFounderPitchesApi(),
      listFounderInvestmentRequestsApi(),
    ]);
    if (pitchResult.status === "fulfilled") setPitches(pitchResult.value);
    else setError(pitchResult.reason.message || "Unable to load your pitches.");
    if (requestResult.status === "fulfilled") setRequests(requestResult.value);
    else setError((current) => current || requestResult.reason.message || "Unable to load investor interest.");
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const savePitch = useCallback(async (id, payload) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (id) {
        const wasPublished = pitches.some((pitch) => pitch.id === id && pitch.status === "active");
        await updateFounderPitchApi(id, payload);
        setNotice(wasPublished
          ? "Changes saved as a draft. Publish the pitch again when the updated details are ready."
          : "Pitch updated.");
      } else {
        await createFounderPitchApi(payload);
        setNotice("Draft saved. Review it and publish when it is ready.");
      }
      await load({ silent: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to save this pitch.");
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, [load, pitches]);

  const updateRequest = useCallback(async (requestId, status) => {
    setBusyRequestId(requestId);
    setError("");
    setNotice("");
    try {
      const data = await updateFounderInvestmentRequestApi(requestId, status);
      setRequests((items) => items.map((item) => item.id === requestId ? { ...item, ...data } : item));
      setNotice(`Investor request marked ${status.replaceAll("_", " ")}.`);
      return data;
    } catch (requestError) {
      setError(requestError.message || "Unable to update this investor request.");
      return null;
    } finally {
      setBusyRequestId(null);
    }
  }, []);

  const setPitchPublished = useCallback(async (pitchId, published) => {
    setError("");
    setNotice("");
    try {
      const updated = published
        ? await publishFounderPitchApi(pitchId)
        : await unpublishFounderPitchApi(pitchId);
      setPitches((items) => items.map((item) => item.id === pitchId ? { ...item, ...updated } : item));
      setNotice(published ? "Pitch published to investor discovery." : "Pitch moved back to drafts.");
      return updated;
    } catch (requestError) {
      setError(requestError.message || "Unable to change pitch visibility.");
      throw requestError;
    }
  }, []);

  const startConversation = useCallback((requestId) => startInvestmentConversationApi(requestId), []);

  const removePitch = useCallback(async (pitchId) => {
    setError("");
    setNotice("");
    try {
      await deleteFounderPitchApi(pitchId);
      setPitches((items) => items.filter((item) => item.id !== pitchId));
      setNotice("Pitch deleted.");
    } catch (requestError) {
      setError(requestError.message || "Unable to delete this pitch.");
      throw requestError;
    }
  }, []);

  return {
    pitches, requests, loading, saving, busyRequestId, error, notice,
    load, savePitch, updateRequest, removePitch, setPitchPublished, startConversation, setError, setNotice,
  };
}
