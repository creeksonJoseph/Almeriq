import { useCallback, useEffect, useState } from "react";
import {
  getProviderProfileApi, updateProviderProfileApi, listCoverageRegionsApi,
  updateCoverageRegionsApi, listAssetsApi, createAssetApi, updateAssetApi, deleteAssetApi,
} from "../lib/api";
import { useToast } from "../context/ToastContext";

/** Owns provider onboarding persistence and server synchronization. */
export function useProviderSetupWorkflow({ methods, navigate, coverageToApi, finalSchema, pendingDeletions, setPendingDeletions }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setLoading(true);
      try {
        const allowMissingProfile = (err) => {
          if (err?.status === 404 || err?.response?.status === 404) return null;
          throw err;
        };
        const [profile, coverage, physical, digital] = await Promise.all([
          getProviderProfileApi().catch(allowMissingProfile),
          listCoverageRegionsApi().catch((err) => allowMissingProfile(err) ?? { items: [] }),
          listAssetsApi({ kind: "physical" }).catch((err) => allowMissingProfile(err) ?? { items: [] }),
          listAssetsApi({ kind: "digital" }).catch((err) => allowMissingProfile(err) ?? { items: [] }),
        ]);
        if (!active) return;
        if (profile) {
          methods.setValue("info", {
            name: profile.company_name || profile.trading_name || "",
            location: profile.location || "",
            type: profile.provider_type || "COMPANY",
            about: profile.about || "",
          });
          methods.setValue("preferences", { engagement: profile.engagement_preferences || "" });
        }
        methods.setValue("coverage.regions", (coverage.items || []).map((item) => item.region).map((region) => Object.entries(coverageToApi).find(([, value]) => value === region)?.[0] || region));
        methods.setValue("physicalAssets", (physical.items || physical || []).map((asset) => ({
          id: asset.id, name: asset.name || "", category: asset.category || "",
          quantity: asset.quantity_capacity != null ? String(asset.quantity_capacity) : (asset.specs?.quantity || ""),
          availability: asset.specs?.availability || "",
          rate: asset.price_monthly != null ? String(asset.price_monthly) : (asset.specs?.rate || ""),
        })));
        methods.setValue("digitalAssets", (digital.items || digital || []).map((asset) => ({
          id: asset.id, name: asset.name || "", category: asset.category || "",
          capacity: asset.quantity_capacity != null ? String(asset.quantity_capacity) : (asset.specs?.capacity || ""),
          rate: asset.price_monthly != null ? String(asset.price_monthly) : (asset.specs?.rate || ""),
        })));
      } catch (error) {
        console.error("Failed to load provider setup", error);
        toast.error("Unable to load your provider setup. Please refresh and try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfile();
    return () => { active = false; };
  }, [methods, coverageToApi, toast]);

  const persistAssets = useCallback(async (data) => {
    const toNum = (value) => value != null && value !== "" && !Number.isNaN(Number(String(value).replace(/,/g, ""))) ? Number(String(value).replace(/,/g, "")) : null;
    const saveAsset = async (asset, kind, index, fieldPath) => {
      const payload = {
        name: asset.name, category: asset.category, kind, client_asset_id: asset.client_asset_id,
        quantity_capacity: toNum(kind === "physical" ? asset.quantity : asset.capacity),
        price_monthly: toNum(asset.rate),
        specs: { quantity: asset.quantity || undefined, capacity: asset.capacity || undefined, availability: asset.availability || undefined, rate: asset.rate || undefined },
      };
      if (asset.id) return updateAssetApi(asset.id, payload);
      const saved = await createAssetApi(payload);
      if (saved?.id) methods.setValue(`${fieldPath}.${index}.id`, saved.id);
      if (saved?.client_asset_id) methods.setValue(`${fieldPath}.${index}.client_asset_id`, saved.client_asset_id);
      return saved;
    };
    await Promise.all([
      ...data.physicalAssets.map((asset, index) => saveAsset(asset, "physical", index, "physicalAssets")),
      ...data.digitalAssets.map((asset, index) => saveAsset(asset, "digital", index, "digitalAssets")),
    ]);
  }, [methods]);

  const saveProfileAndCoverage = useCallback(async (data) => {
    await updateProviderProfileApi({
      company_name: data.info.name, provider_type: data.info.type, location: data.info.location,
      about: data.info.about, engagement_preferences: data.preferences?.engagement,
    });
    await updateCoverageRegionsApi(data.coverage.regions.map((region) => coverageToApi[region] || region));
  }, [coverageToApi]);

  const deletePendingAssets = useCallback(async () => {
    const deleted = [];
    const failed = [];
    for (const id of pendingDeletions) {
      try { await deleteAssetApi(id); deleted.push(id); }
      catch (error) { failed.push(id); console.error("Asset deletion failed", error); }
    }
    setPendingDeletions((current) => current.filter((id) => !deleted.includes(id)));
    return { deleted, failed };
  }, [pendingDeletions, setPendingDeletions]);

  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const data = methods.getValues();
      await saveProfileAndCoverage(data);
      await persistAssets(data);
      const { failed } = await deletePendingAssets();
      if (failed.length) toast.error("Some assets could not be deleted. Draft partially saved.");
      else toast.success("Provider setup draft saved.");
    } catch (error) {
      console.error("Provider setup draft save failed", error);
      toast.error("Some draft data failed to save.");
    } finally { setSaving(false); }
  }, [methods, saveProfileAndCoverage, persistAssets, deletePendingAssets, toast]);

  const handleComplete = useCallback(async () => {
    const data = methods.getValues();
    const result = finalSchema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((issue) => methods.setError(issue.path.join("."), { message: issue.message }));
      return;
    }
    setSaving(true);
    try {
      await saveProfileAndCoverage(data);
      await persistAssets(data);
      const { failed } = await deletePendingAssets();
      if (failed.length) {
        toast.error("Some assets could not be deleted. Please retry.");
        return;
      }
      toast.success("Provider profile completed.");
      navigate("/provider/dashboard");
    } catch (error) {
      console.error("Provider setup completion failed", error);
      toast.error(error.message || "Unable to complete provider setup.");
    } finally { setSaving(false); }
  }, [methods, finalSchema, saveProfileAndCoverage, persistAssets, deletePendingAssets, navigate, toast]);

  return { loading, saving, handleSaveDraft, handleComplete };
}
