import { useCallback, useEffect, useState } from "react";
import {
  createFounderPitchApi,
  deleteFounderPitchApi,
  listFounderInvestmentRequestsApi,
  listFounderPitchesApi,
  updateFounderInvestmentRequestApi,
  updateFounderPitchApi,
  setFounderPitchPublicationApi,
  listFounderInvestorUpdatesApi,
  createFounderInvestorUpdateApi,
  publishFounderInvestorUpdateApi,
} from "../lib/api/founder";
import { startInvestmentConversationApi } from "../lib/api/conversations";

export function useFounderPitches() {
  const [pitches, setPitches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [investorUpdates, setInvestorUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    const [pitchResult, requestResult, updateResult] = await Promise.allSettled([
      listFounderPitchesApi(),
      listFounderInvestmentRequestsApi(),
      listFounderInvestorUpdatesApi(),
    ]);
    if (pitchResult.status === "fulfilled") setPitches(pitchResult.value);
    else setError(pitchResult.reason.message || "Unable to load your pitches.");
    if (requestResult.status === "fulfilled") setRequests(requestResult.value);
    else setError((current) => current || requestResult.reason.message || "Unable to load investor interest.");
    if (updateResult.status === "fulfilled") setInvestorUpdates(updateResult.value);
    else setError((current) => current || updateResult.reason.message || "Unable to load investor updates.");
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const savePitch = useCallback(async (id, payload) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (id) {
        await updateFounderPitchApi(id, payload);
        setNotice("Pitch updated.");
      } else {
        await createFounderPitchApi(payload);
        setNotice("Pitch saved as a draft. Publish it when it is ready.");
      }
      await load({ silent: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to save this pitch.");
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, [load]);

  const saveInvestorUpdate = useCallback(async (payload) => {
    const created = await createFounderInvestorUpdateApi(payload);
    setInvestorUpdates((items) => [created, ...items]);
    setNotice("Investor update saved as a draft.");
    return created;
  }, []);

  const publishInvestorUpdate = useCallback(async (updateId) => {
    const published = await publishFounderInvestorUpdateApi(updateId);
    setInvestorUpdates((items) => items.map((item) => item.id === updateId ? { ...item, ...published } : item));
    setNotice(`Update shared with ${published.notified_investors || 0} interested investor(s).`);
    return published;
  }, []);

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

  const startConversation = useCallback((requestId) => startInvestmentConversationApi(requestId), []);

  const setPitchPublication = useCallback(async (pitchId, publish) => {
    setError("");
    setNotice("");
    try {
      const updated = await setFounderPitchPublicationApi(pitchId, publish);
      setPitches((items) => items.map((item) => item.id === pitchId ? { ...item, ...updated } : item));
      setNotice(publish ? "Pitch is now visible to investors." : "Pitch removed from investor discovery.");
      return updated;
    } catch (requestError) {
      setError(requestError.message || "Unable to change pitch visibility.");
      throw requestError;
    }
  }, []);

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
    pitches, requests, investorUpdates, loading, saving, busyRequestId, error, notice,
    load, savePitch, updateRequest, removePitch, setPitchPublication, saveInvestorUpdate, publishInvestorUpdate, startConversation, setError, setNotice,
  };
}
