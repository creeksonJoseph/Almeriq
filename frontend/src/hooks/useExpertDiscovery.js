import { useCallback, useEffect, useState } from "react";
import { createExpertRequestApi, listExpertsApi, listFounderExpertRequestsApi } from "../lib/api/expert";

export function useExpertDiscovery() {
  const [experts, setExperts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [expertsResult, requestsResult] = await Promise.allSettled([
      listExpertsApi(),
      listFounderExpertRequestsApi(),
    ]);
    if (expertsResult.status === "fulfilled") {
      setExperts(expertsResult.value?.items || []);
    } else {
      setError(expertsResult.reason.message || "Unable to load expert profiles.");
    }
    if (requestsResult.status === "fulfilled") {
      setRequests(requestsResult.value?.items || []);
    } else {
      setError((current) => current || requestsResult.reason.message || "Unable to load advisory requests.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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

  return { experts, requests, loading, error, notice, sendRequest, setError, setNotice };
}
