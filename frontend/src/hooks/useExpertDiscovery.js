import { useCallback, useEffect, useState } from "react";
import { useDataCache } from "./useDataCache";
import { useAuth } from "../context/AuthContext";
import {
  createExpertRequestApi,
  listExpertsCachedApi,
  listFounderExpertRequestsApi,
} from "../lib/api/expert";
import { startAdvisoryConversationApi } from "../lib/api/conversations";

export function useExpertDiscovery() {
  const { user } = useAuth();
  const cacheKey = user?.id ? `private:experts:${user.id}` : null;
  const {
    data: expertResponse,
    loading: expertsLoading,
    error: expertsError,
  } = useDataCache(cacheKey, listExpertsCachedApi, { enabled: Boolean(user?.id) });
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const experts = expertResponse?.items || [];

  useEffect(() => {
    let active = true;
    listFounderExpertRequestsApi()
      .then((data) => {
        if (active) setRequests(data?.items || []);
      })
      .catch((requestError) => {
        if (active) setRequestsError(requestError.message || "Unable to load your advisory requests.");
      })
      .finally(() => {
        if (active) setRequestsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const openConversation = useCallback((requestId) => startAdvisoryConversationApi(requestId), []);

  const sendRequest = useCallback(async (expertUserId, payload) => {
    setError("");
    setNotice("");
    try {
      const data = await createExpertRequestApi(expertUserId, payload);
      setRequests((items) => [data, ...items]);
      setNotice("Your advisory request was sent.");
      return data;
    } catch (requestError) {
      setError(requestError.message || "Unable to send your request.");
      throw requestError;
    }
  }, []);

  return {
    experts,
    requests,
    expertsLoading,
    requestsLoading,
    error: error || expertsError || requestsError,
    notice,
    sendRequest,
    openConversation,
    setError,
    setNotice,
  };
}
