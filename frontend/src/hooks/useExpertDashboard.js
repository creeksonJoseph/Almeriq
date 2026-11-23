import { useCallback, useEffect, useState } from "react";
import { getExpertProfileApi, listExpertRequestsApi, updateExpertRequestApi } from "../lib/api/expert";

export function useExpertDashboard() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [profileResult, requestResult] = await Promise.allSettled([
      getExpertProfileApi(),
      listExpertRequestsApi(),
    ]);
    if (profileResult.status === "fulfilled") setProfile(profileResult.value || null);
    else if (profileResult.reason.status !== 404) {
      setError(profileResult.reason.message || "Unable to load your expert profile.");
    }
    if (requestResult.status === "fulfilled") {
      setRequests(requestResult.value?.items || []);
    } else {
      setError((current) => current || requestResult.reason.message || "Unable to load advisory requests.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateRequest = useCallback(async (id, status) => {
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const data = await updateExpertRequestApi(id, status);
      setRequests((items) => items.map((item) => item.id === id ? { ...item, ...data } : item));
      setNotice(`Request updated to ${status}.`);
      return data;
    } catch (requestError) {
      setError(requestError.message || "Unable to update request.");
      throw requestError;
    } finally {
      setBusyId(null);
    }
  }, []);

  return { profile, requests, loading, error, notice, busyId, load, updateRequest, setError };
}
