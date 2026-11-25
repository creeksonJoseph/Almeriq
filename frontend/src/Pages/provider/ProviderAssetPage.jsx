import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Input, SkeletonText } from "../../components/ui";
import { createAssetApi, getAssetApi, updateAssetApi, uploadAssetMediaApi, deleteAssetMediaApi } from "../../lib/api";

const EMPTY_ASSET = {
  name: "",
  category: "",
  kind: "physical",
  description: "",
  price_monthly: "",
  quantity_capacity: "",
  media: [],
};

export default function ProviderAssetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(EMPTY_ASSET);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [mediaBusy, setMediaBusy] = useState(false);

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
    let createdAssetId = null;
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        kind: form.kind,
        description: form.description.trim() || undefined,
        price_monthly: form.price_monthly === "" ? undefined : Number(form.price_monthly),
        quantity_capacity: form.quantity_capacity === "" ? undefined : Number(form.quantity_capacity),
      };
      const saved = editing ? await updateAssetApi(id, payload) : await createAssetApi(payload);
      const assetId = editing ? Number(id) : saved.id;
      createdAssetId = assetId;
      if (selectedFiles.length) await uploadAssetMediaApi(assetId, selectedFiles);
      navigate("/provider/listings");
    } catch (e) {
      if (!editing && createdAssetId) navigate("/provider/listings/" + createdAssetId + "/edit", { replace: true });
      setError(e.response?.data?.detail || e.message || "Unable to save asset");
    } finally {
      setSaving(false);
    }
  };

  const removeMedia = async (item) => {
    if (!editing || mediaBusy) return;
    setMediaBusy(true);
    setError("");
    try {
      const updated = await deleteAssetMediaApi(id, item.public_id);
      setForm(current => ({ ...current, media: updated.media || [] }));
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Unable to remove media");
    } finally {
      setMediaBusy(false);
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
              <span className="text-xs text-white/55">Leave blank if the price depends on the request. Currency is not recorded yet, so the amount will be shown without a currency unit.</span>
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
          <div className="space-y-3 border-t border-[#282a2f] pt-6">
            <div>
              <h2 className="text-sm font-semibold text-white">Listing photos and videos</h2>
              <p className="mt-1 text-xs text-white/55">Upload up to 10 files. Images: JPG, PNG, WebP or AVIF (10 MB each). Videos: MP4, WebM or MOV (100 MB each). Files are stored in Cloudinary.</p>
            </div>
            {Array.isArray(form.media) && form.media.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {form.media.map((item) => (
                  <div key={item.public_id} className="overflow-hidden rounded-lg border border-[#282a2f] bg-[#0c0e13]">
                    {item.resource_type === "video" ? <video src={item.url} controls className="aspect-video w-full object-cover" /> : <img src={item.url} alt="Listing media" className="aspect-video w-full object-cover" />}
                    <button type="button" disabled={mediaBusy} onClick={() => removeMedia(item)} className="w-full px-2 py-2 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50">Remove</button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))} className="block w-full rounded-lg border border-[#282a2f] bg-[#0c0e13] p-3 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-[#f2ca50] file:px-3 file:py-2 file:font-semibold file:text-[#111318]" />
            {selectedFiles.length > 0 && <p className="text-xs text-white/65">{selectedFiles.length} file(s) selected: {selectedFiles.map(file => file.name).join(", ")}</p>}
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
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
