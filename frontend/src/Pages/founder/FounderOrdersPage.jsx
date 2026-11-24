import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Skeleton, SkeletonText } from "../../components/ui";
import { getClientOrderApi, listClientOrdersApi } from "../../lib/api/orders";

const STATUS_STYLES = {
  pending_review: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  confirmed: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  shipped: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  declined: "border-red-500/30 bg-red-500/10 text-red-200",
};

export default function FounderOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listClientOrdersApi({ limit: 50, offset: 0 }).then((result) => {
      if (active) {
        setOrders(result.items || []);
        setOrdersTotal(result.total ?? result.items?.length ?? 0);
      }
    }).catch((err) => {
      if (active) setError(err.response?.data?.detail || err.message || "Unable to load your orders.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retryCount]);

  const loadMoreOrders = async () => {
    if (loadingMore || orders.length >= ordersTotal) return;
    setLoadingMore(true);
    setError("");
    try {
      const result = await listClientOrdersApi({ limit: 50, offset: orders.length });
      setOrders((current) => {
        const seen = new Set(current.map((order) => order.id));
        return [...current, ...(result.items || []).filter((order) => !seen.has(order.id))];
      });
      setOrdersTotal(result.total ?? ordersTotal);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to load more orders.");
    } finally {
      setLoadingMore(false);
    }
  };

  const openOrder = async (order) => {
    setDetailLoading(true); setError("");
    try {
      setSelected(await getClientOrderApi(order.id));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to load order details.");
    } finally { setDetailLoading(false); }
  };

  const formatMoney = (value) => value == null ? "Not available" : Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-text">
      <div className="mx-auto max-w-5xl space-y-6">
        <header><p className="text-xs uppercase tracking-widest text-gold">Founder workspace</p><h1 className="mt-2 font-serif text-3xl">My marketplace orders</h1><p className="mt-2 text-sm text-white/60">Track provider confirmations, dispatch updates and your demo deal records.</p></header>
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {loading ? <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((item) => <Card key={item} className="space-y-3 p-5"><Skeleton className="h-5 w-1/3" /><SkeletonText lines={2} /><div className="flex gap-2"><Skeleton className="h-8 w-24 rounded-xl" /><Skeleton className="h-8 w-24 rounded-xl" /></div></Card>)}</div> : error && orders.length === 0 ? <Card className="space-y-3 p-8 text-center"><p className="font-medium">Could not load your orders</p><p className="text-sm text-white/50">{error}</p><Button onClick={() => setRetryCount((count) => count + 1)}>Retry</Button></Card> : orders.length === 0 ? <Card className="p-8 text-center"><p className="font-medium">No marketplace orders yet</p><p className="mt-2 text-sm text-white/50">Orders you place from marketplace listings will appear here.</p><Button className="mt-4" onClick={() => navigate("/marketplace")}>Browse marketplace</Button></Card> : (
          <div className="space-y-3">
            <p className="text-xs text-white/45">Showing {orders.length} of {ordersTotal} orders</p>
            {orders.map((order) => (
              <Card key={order.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-medium">{order.assetName || order.asset_name || "Marketplace asset"}</h2><span className={`rounded-full border px-2.5 py-1 text-xs capitalize ${STATUS_STYLES[order.status] || STATUS_STYLES.pending_review}`}>{String(order.status || "pending_review").replaceAll("_", " ")}</span></div><p className="mt-1 text-xs text-white/50">{order.order_id} · {order.provider_name || "Infrastructure provider"}</p><p className="mt-2 text-sm text-white/60">Monthly rate: {formatMoney(order.amount ?? order.lease_amount)} · currency not specified · Payment: {order.paymentStatus || "not_started"}</p></div>
                <div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => openOrder(order)}>View timeline</Button>{order.deal_id && <Button size="sm" onClick={() => navigate(`/checkout/${order.deal_id}`)}>View demo deal</Button>}</div>
              </Card>
            ))}
            {orders.length < ordersTotal && <div className="flex justify-center pt-2"><Button variant="ghost" disabled={loadingMore} onClick={loadMoreOrders}>{loadingMore ? "Loading…" : "Load more orders"}</Button></div>}
          </div>
        )}
        {selected && <Card className="space-y-4 border border-gold/25 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-gold">Order timeline</p><h2 className="mt-1 font-serif text-xl">{selected.assetName || selected.asset_name || selected.order_id}</h2></div><Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Close</Button></div>
          {detailLoading ? <div className="space-y-4" aria-busy="true">{[0, 1, 2].map((item) => <div key={item} className="flex gap-3"><Skeleton className="mt-1 h-2 w-2 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-2/3" /></div></div>)}</div> : (selected.events || []).length === 0 ? <p className="text-sm text-white/50">No timeline events have been recorded.</p> : <div className="space-y-4">{[...selected.events].reverse().map((event) => <div key={event.id} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" /><div><p className="text-sm font-medium capitalize">{String(event.event_type || "update").replaceAll("_", " ")}</p>{event.note && <p className="mt-1 text-sm text-white/60">{event.note}</p>}<p className="mt-1 text-xs text-white/40">{event.created_at ? new Date(event.created_at).toLocaleString() : "Time unavailable"}</p></div></div>)}</div>}
          <div className="rounded-lg border border-border bg-surface-2 p-3 text-xs text-white/55">Payments and escrow are not connected. This page tracks order records and provider fulfillment updates only.</div>
        </Card>}
      </div>
    </main>
  );
}
