import { useCallback, useEffect, useState } from "react";
import {
  getInvestorProfileApi, listInvestorStartupsApi, listInvestorPortfolioApi,
  createInvestmentApi, updateInvestorPortfolioApi, updateInvestorProfileApi, listInvestorUpdatesApi,
} from "../lib/api";
import { startInvestmentConversationApi } from "../lib/api/conversations";

/** Investor workspace data loading and mutations. */
export function useInvestorWorkspace({ navigate }) {
  const [profile, setProfile] = useState(null);
  const [startups, setStartups] = useState([]);
  const [requests, setRequests] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyPitch, setBusyPitch] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [profileResult, startupResult, requestResult, updateResult] = await Promise.all([
        getInvestorProfileApi().catch((err) => { if (err.status === 404) return null; throw err; }),
        listInvestorStartupsApi(),
        listInvestorPortfolioApi(),
        listInvestorUpdatesApi().catch((err) => { setError(err.message || "Unable to load shared investor updates."); return { items: [] }; }),
      ]);
      setProfile(profileResult ? {
        preferred_payment_methods: ["visa"], notify_deal_updates: true,
        notify_messages: true, ...profileResult,
      } : null);
      setStartups(startupResult?.items || []);
      setRequests(requestResult?.items || []);
      setUpdates(updateResult?.items || []);
      return { profile: profileResult, startups: startupResult?.items || [], requests: requestResult?.items || [], updates: updateResult?.items || [] };
    } catch (err) {
      setError(err.message || "Unable to load your investor workspace.");
      return null;
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveSettings = useCallback(async () => {
    if (!profile) return;
    setSettingsSaving(true); setError(""); setNotice("");
    try {
      const updated = await updateInvestorProfileApi({
        preferred_payment_methods: profile.preferred_payment_methods || [],
        notify_deal_updates: Boolean(profile.notify_deal_updates),
        notify_messages: Boolean(profile.notify_messages),
      });
      setProfile((current) => ({ ...current, ...updated }));
      setNotice("Investor preferences saved.");
    } catch (err) {
      setError(err.message || "Unable to save investor preferences.");
    } finally { setSettingsSaving(false); }
  }, [profile]);

  const openConversation = useCallback(async (investmentId) => {
    try {
      const conversation = await startInvestmentConversationApi(investmentId);
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (err) {
      setError(err.message || "Unable to open this conversation.");
    }
  }, [navigate]);

  const savePortfolio = useCallback(async ({ event, editingInvestment, portfolioForm, setEditingInvestment, setConfirmationStep }) => {
    event.preventDefault();
    if (!editingInvestment) return;
    setError(""); setNotice("");
    if (!Number.isFinite(Number(portfolioForm.investment_amount)) || Number(portfolioForm.investment_amount) <= 0) {
      setError("Enter an investment amount greater than zero."); return;
    }
    if (!portfolioForm.payment_method) { setError("Choose a demo payment method."); return; }
    if (!portfolioForm.signature_data && !editingInvestment.signature_data) {
      setError("Draw your signature before completing the demo confirmation."); return;
    }
    try {
      const updated = await updateInvestorPortfolioApi(editingInvestment.id, {
        investment_amount: Number(portfolioForm.investment_amount),
        current_value: portfolioForm.current_value === "" ? null : Number(portfolioForm.current_value),
        ownership_percent: portfolioForm.ownership_percent === "" ? null : Number(portfolioForm.ownership_percent),
        investment_date: portfolioForm.investment_date || null,
        notes: portfolioForm.notes.trim() || null,
        risk_level: portfolioForm.risk_level,
        payment_method: portfolioForm.payment_method,
        signature_data: portfolioForm.signature_data || editingInvestment.signature_data || null,
      });
      setRequests((items) => items.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      setEditingInvestment(updated);
      setConfirmationStep(5);
      setNotice("Demo deal confirmation completed. No funds were charged or transferred.");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to save this portfolio record.");
    }
  }, []);

  const expressInterest = useCallback(async (pitch) => {
    setBusyPitch(pitch.id); setError(""); setNotice("");
    try {
      const request = await createInvestmentApi({ pitch_id: pitch.id });
      setRequests((current) => [request, ...current]);
      setNotice(`Your interest in ${pitch.title} has been sent to the founder.`);
    } catch (err) {
      setError(err.message || "Unable to send your request.");
    } finally { setBusyPitch(null); }
  }, []);

  return {
    profile, setProfile, startups, requests, setRequests, updates, loading, busyPitch,
    error, setError, notice, setNotice, settingsSaving, load, saveSettings,
    openConversation, savePortfolio, expressInterest,
  };
}
