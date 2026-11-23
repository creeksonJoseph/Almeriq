import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Input, SkeletonText } from "../../components/ui";
import { getOrderApi, dispatchOrderApi } from "../../lib/api";

export default function ProviderDispatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({ waybill_url: "", tracking_number: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrderApi(id)
      .then(result => setOrder(result.data || result.order || result))
      .catch(e => setError(e.message || "Unable to load order"))
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await dispatchOrderApi(id, {
        waybill_url: form.waybill_url.trim(),
        tracking_number: form.tracking_number.trim() || undefined,
      });
      navigate(`/provider/orders/${id}`);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Unable to dispatch order");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto"><SkeletonText lines={5} /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-text">Dispatch order</h1>
        <p className="text-sm text-white/60 mt-2">{order?.status === "confirmed" ? "Add the shipment details before marking this order as shipped." : "Only confirmed orders can be dispatched."}</p>
      </div>
      {order && <Card className="p-5"><p className="font-medium text-text">{order.asset_name || order.assetName || "Order"} </p><p className="text-sm text-white/60 mt-1">{order.order_id || order.id}</p></Card>}
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm text-white/70">Waybill URL<Input required type="url" value={form.waybill_url} onChange={e => setForm({ ...form, waybill_url: e.target.value })} /></label>
          <label className="block text-sm text-white/70">Tracking number<Input value={form.tracking_number} onChange={e => setForm({ ...form, tracking_number: e.target.value })} /></label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" className="bg-[#1a1b21] !border-0" onClick={() => navigate(`/provider/orders/${id}`)}>Cancel</Button>
            <Button type="submit" disabled={saving || order?.status !== "confirmed"}>{saving ? "Dispatching..." : "Dispatch order"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
