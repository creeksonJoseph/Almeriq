import { useCallback, useEffect, useState } from "react";
import { getCompanyRegistrationGuideApi } from "../lib/api";
import { listLegalFilingsApi, createLegalFilingApi } from "../lib/api/founder";

/** Server state and submission workflow for the founder legal workspace. */
export function useFounderLegalWorkspace({ selectedCountry, filingForm, setFilingForm, showToast }) {
  const [filings, setFilings] = useState([]);
  const [filingLoading, setFilingLoading] = useState(false);
  const [filingSaving, setFilingSaving] = useState(false);
  const [filingError, setFilingError] = useState("");
  const [guide, setGuide] = useState(null);
  const [guideLoading, setGuideLoading] = useState(true);
  const [guideError, setGuideError] = useState(null);

  const loadFilings = useCallback(async () => {
    setFilingLoading(true);
    setFilingError("");
    try { setFilings(await listLegalFilingsApi()); }
    catch (error) { setFilingError(error.message || "Unable to load your registration requests."); }
    finally { setFilingLoading(false); }
  }, []);

  useEffect(() => { loadFilings(); }, [loadFilings]);

  const submitFiling = useCallback(async (event) => {
    event.preventDefault();
    setFilingSaving(true);
    setFilingError("");
    try {
      await createLegalFilingApi({
        ...filingForm,
        company_name: filingForm.filing_type === "company" ? filingForm.company_name.trim() : null,
        entity_type: filingForm.filing_type === "company" ? filingForm.entity_type : null,
        jurisdiction: filingForm.filing_type === "company" ? (filingForm.jurisdiction.trim() || selectedCountry) : null,
        ip_title: filingForm.filing_type === "ip" ? filingForm.ip_title.trim() : null,
        ip_type: filingForm.filing_type === "ip" ? filingForm.ip_type : null,
        ip_description: filingForm.filing_type === "ip" ? filingForm.ip_description.trim() : null,
      });
      await loadFilings();
      setFilingForm((current) => ({ ...current, company_name: "", ip_title: "", ip_description: "" }));
      showToast("Registration intake submitted. This does not file with a government office.", "success");
    } catch (error) {
      setFilingError(error.message || "Unable to submit this registration intake.");
    } finally { setFilingSaving(false); }
  }, [filingForm, selectedCountry, loadFilings, setFilingForm, showToast]);

  const loadGuide = useCallback(async (countryName, forceRefresh = false) => {
    setGuideLoading(true);
    setGuide(null);
    setGuideError(null);
    try {
      const data = await getCompanyRegistrationGuideApi(countryName, forceRefresh);
      return data;
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    let active = true;
    setGuide(null);
    setGuideError(null);
    setGuideLoading(true);
    loadGuide(selectedCountry)
      .then((data) => { if (active) setGuide(data); })
      .catch((error) => {
        if (active) setGuideError(error.message || "Could not load the registration guide right now. Please check your internet connection and click retry.");
      })
      .finally(() => { if (active) setGuideLoading(false); });
    return () => { active = false; };
  }, [selectedCountry, loadGuide]);

  const refreshGuide = useCallback(async () => {
    setGuideLoading(true);
    setGuideError(null);
    try { setGuide(await loadGuide(selectedCountry, true)); }
    catch (error) { setGuideError(error.message || "Could not refresh the registration guide."); }
    finally { setGuideLoading(false); }
  }, [loadGuide, selectedCountry]);

  return {
    filings, filingLoading, filingSaving, filingError, setFilingError, submitFiling, loadFilings,
    guide, guideLoading, guideError, refreshGuide,
  };
}
