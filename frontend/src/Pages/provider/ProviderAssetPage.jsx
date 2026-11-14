import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Input, SkeletonText } from "../../components/ui";
import { createAssetApi, getAssetApi, updateAssetApi } from "../../lib/api";

const EMPTY_ASSET = {
  name: "",
  category: "",
  kind: "physical",
  description: "",
  price_monthly: "",
  quantity_capacity: "",
};

export default function ProviderAssetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(EMPTY_ASSET);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    getAssetApi(id)
      .then((res) => setForm({ ...EMPTY_ASSET, ...(res.data || res.asset || res) }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [editing, id]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        kind: form.kind,
        description: form.description.trim() || undefined,
        price_monthly: form.price_monthly === "" ? undefined : Number(form.price_monthly),
        quantity_capacity: form.quantity_capacity === "" ? undefined : Number(form.quantity_capacity),
      };
      if (editing) await updateAssetApi(id, payload);
      else await createAssetApi(payload);
      navigate("/provider/listings");
    } catch (e) {
      setError(e.message || "Unable to save asset");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto"><SkeletonText lines={8} /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-text">{editing ? "Edit asset" : "Add asset"}</h1>
        <p className="text-sm text-white/60 mt-2">Enter the details clients need to evaluate this listing.</p>
      </div>
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm text-white/70">Asset name<Input required value={form.name} onChange={updateField("name")} /></label>
          <label className="block text-sm text-white/70">Category<Input required value={form.category} onChange={updateField("category")} /></label>
          <label className="block text-sm text-white/70">Asset type
            <select value={form.kind} onChange={updateField("kind")} className="alq-input mt-1">
              <option value="physical">Physical</option>
              <option value="digital">Digital</option>
            </select>
          </label>
          <label className="block text-sm text-white/70">Description
            <textarea value={form.description} onChange={updateField("description")} rows={4} className="alq-input mt-1 resize-y" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm text-white/70">Monthly price<Input type="number" min="0" value={form.price_monthly} onChange={updateField("price_monthly")} /></label>
            <label className="block text-sm text-white/70">Quantity / capacity<Input type="number" min="0" value={form.quantity_capacity} onChange={updateField("quantity_capacity")} /></label>
          </div>
          {error && <p className="text-sm text-gold">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" className="bg-[#1a1b21] !border-0" onClick={() => navigate("/provider/listings")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Create asset"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
