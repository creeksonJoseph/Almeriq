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
    <div className="w-full space-y-8 px-6 py-8 sm:px-8 lg:px-10">
      <div className="max-w-3xl text-left">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2ca50]">
          Provider listing
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-text">
          {editing ? "Edit asset" : "Add asset"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Enter the details clients need to understand and evaluate this listing.
        </p>
      </div>
      <Card className="border-[#282a2f] bg-[#13141b] p-6 sm:p-8 lg:p-10">
        <form onSubmit={submit} className="space-y-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-7 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-white">Asset name</span>
              <span className="text-xs text-white/55">Use a clear name clients will recognize.</span>
              <Input required value={form.name} onChange={updateField("name")} className="!border-[#282a2f] focus:!border-[#f2ca50]" />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-white">Category</span>
              <span className="text-xs text-white/55">Choose the main category for this listing.</span>
              <Input required value={form.category} onChange={updateField("category")} className="!border-[#282a2f] focus:!border-[#f2ca50]" />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-white">Asset type</span>
              <span className="text-xs text-white/55">Tell clients whether this is physical or digital.</span>
              <select value={form.kind} onChange={updateField("kind")} className="alq-input !border-[#282a2f] focus:!border-[#f2ca50]">
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-white">Monthly price</span>
              <span className="text-xs text-white/55">Leave blank if the price depends on the request.</span>
              <Input type="number" min="0" value={form.price_monthly} onChange={updateField("price_monthly")} className="!border-[#282a2f] focus:!border-[#f2ca50]" />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-white">Quantity / capacity</span>
              <span className="text-xs text-white/55">Add the available amount or service capacity.</span>
              <Input type="number" min="0" value={form.quantity_capacity} onChange={updateField("quantity_capacity")} className="!border-[#282a2f] focus:!border-[#f2ca50]" />
            </div>
            <div className="flex flex-col gap-2 lg:col-span-2">
              <span className="text-sm font-semibold text-white">Description</span>
              <span className="text-xs text-white/55">Explain what clients receive, where it is available, and any important limits.</span>
              <textarea value={form.description} onChange={updateField("description")} rows={6} className="alq-input !border-[#282a2f] focus:!border-[#f2ca50] resize-y" />
            </div>
          </div>
          {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
          <div className="flex flex-col-reverse justify-end gap-3 border-t border-[#282a2f] pt-6 sm:flex-row">
            <Button type="button" variant="ghost" className="bg-[#1a1b21] !border-0" onClick={() => navigate("/provider/listings")}>Cancel</Button>
            <Button
              type="submit"
              disabled={saving}
              className="!bg-[#f2ca50] !text-[#111318] hover:!bg-[#e2ba40]"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create asset"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
