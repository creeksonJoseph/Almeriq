import { useCallback, useEffect, useState } from "react";
import { getExpertProfileApi, listExpertRequestsApi, updateExpertRequestApi } from "../lib/api/expert";
import { startAdvisoryConversationApi } from "../lib/api/conversations";

export function useExpertDashboard() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setError("");
    setProfileLoading(true);
    setRequestsLoading(true);

    getExpertProfileApi()
      .then((data) => setProfile(data || null))
      .catch((requestError) => {
        if (requestError.status !== 404) {
          setError(requestError.message || "Unable to load your expert profile.");
        } else {
          setProfile(null);
        }
      })
      .finally(() => setProfileLoading(false));

    listExpertRequestsApi()
      .then((data) => setRequests(data?.items || []))
      .catch((requestError) => {
        setError((current) => current || requestError.message || "Unable to load advisory requests.");
      })
      .finally(() => setRequestsLoading(false));
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
      return null;
    } finally {
      setBusyId(null);
    }
  }, []);

  const openConversation = useCallback((requestId) => startAdvisoryConversationApi(requestId), []);

  return {
    profile, requests, profileLoading, requestsLoading, openConversation,
    error, notice, busyId, load, updateRequest, setError,
  };
}
