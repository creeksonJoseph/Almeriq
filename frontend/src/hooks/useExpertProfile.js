import { useCallback, useEffect, useState } from "react";
import { getExpertProfileApi, saveExpertProfileApi } from "../lib/api/expert";

export function useExpertProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProfile(await getExpertProfileApi());
    } catch (requestError) {
      if (requestError.status !== 404) {
        setError(requestError.message || "Unable to load your profile.");
      }
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (payload) => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const data = await saveExpertProfileApi(payload);
      setProfile(data);
      setSaved(true);
      return data;
    } catch (requestError) {
      setError(requestError.message || "Unable to save your profile.");
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  return { profile, loading, saving, error, saved, save, setError, setSaved };
}
