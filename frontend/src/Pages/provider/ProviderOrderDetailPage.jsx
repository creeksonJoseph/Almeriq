import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, Download, Truck, CheckCircle, XCircle, AlertCircle, FileText, MapPin, DollarSign, Clock } from "lucide-react";
import { Button, Card, StatusPill, Drawer, Skeleton, SkeletonText } from "../../components/ui";
import { getOrderApi, getWaybillApi, updateOrderStatusApi } from "../../lib/api";

export default function ProviderOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [waybill, setWaybill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [waybillOpen, setWaybillOpen] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      setLoading(true);
      try {
        const res = await getOrderApi(id);
        setOrder(res.data || res.order || res);
      } catch (e) {
        console.error("Failed to load order", e);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      if (action === "confirm") await updateOrderStatusApi(id, "confirmed");
      else if (action === "decline") await updateOrderStatusApi(id, "declined");
      else if (action === "deliver") await updateOrderStatusApi(id, "completed");
      const res = await getOrderApi(id);
      setOrder(res.data || res.order || res);
    } catch (e) {
      console.error("Action failed", e);
    } finally {
      setActionLoading(null);
    }
  };

  const loadWaybill = async () => {
    try {
      const res = await getWaybillApi(id);
      setWaybill(res.data || res.waybill || res);
      setWaybillOpen(true);
    } catch (e) {
      console.error("Failed to load waybill", e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <SkeletonText lines={3} className="max-w-xl" />
        <SkeletonCard className="p-5" />
        <SkeletonCard className="p-5" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-center">
        <p className="text-gold">Order not found</p>
<Button variant="ghost" className="mt-4" onClick={() => window.history.back()}>
  Back to Orders
</Button>
      </div>
    );
  }

  const statusConfig = {
    pending: { variant: "gold", label: "Pending Review", color: "text-gold", bg: "bg-gold/10", border: "border-gold/30" },
    confirmed: { variant: "gold", label: "Confirmed", color: "text-gold", bg: "bg-gold/10", border: "border-gold/30" },
    shipped: { variant: "gold", label: "Shipped / In Transit", color: "text-gold", bg: "bg-gold/10", border: "border-gold/30" },
    completed: { variant: "gold", label: "Completed", color: "text-gold", bg: "bg-gold/10", border: "border-gold/30" },
    declined: { variant: "gold", label: "Declined", color: "text-gold", bg: "bg-gold/10", border: "border-gold/30" },
  }[order.status?.toLowerCase()] || { variant: "gold", label: "Pending Review", color: "text-gold", bg: "bg-gold/10", border: "border-gold/30" };

  const timeline = [...(order.events || [])].reverse();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
<Button variant="ghost" size="sm" className="mb-2" onClick={() => window.history.back()}>
  Back to Orders
</Button>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
              <span className={`w-2 h-2 rounded-full ${statusConfig.color.replace("text-", "bg-")}`}></span>
              {statusConfig.label}
            </span>
            <span className="text-white/60 text-sm">Payment: {order.paymentStatus || "not_started"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
<Button variant="ghost" onClick={loadWaybill}>
  Waybill
</Button>
<Button variant="ghost" className="bg-[#1a1b21] !border-0" onClick={() => window.print()}>
  Export PDF
</Button>
        </div>
      </div>

      {/* Actual order event history */}
      <Card className="p-5">
        <h3 className="text-label-caps text-white/60 uppercase tracking-wider mb-4">ORDER TIMELINE</h3>
        {timeline.length === 0 ? <p className="text-sm text-white/50">No order events have been recorded yet.</p> : (
          <div className="space-y-4">
            {timeline.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text">{(event.event_type || "update").replaceAll("_", " ")}</div>
                  {event.note && <p className="mt-1 text-sm text-white/60">{event.note}</p>}
                  <time className="mt-1 block text-xs text-white/40">{event.created_at ? new Date(event.created_at).toLocaleString() : "Time not available"}</time>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {/* Order Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client & Asset */}
        <Card className="p-5 space-y-4">
          <h3 className="text-label-caps text-white/60 uppercase tracking-wider">CLIENT & ASSET</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-surface-2 border border-border text-text text-sm font-bold flex items-center justify-center shrink-0">
              {order.clientName?.split(' ').map(w => w[0]).join('') || "—"}
            </div>
            <div>
              <span className="font-semibold text-text">{order.clientName}</span>
              
            </div>
          </div>
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-sm font-medium text-text">{order.assetName}</span>
                <div className="text-xs text-white/60">{order.assetDetails || "No asset description provided."}</div>
              </div>
              <span className="font-mono font-semibold text-gold shrink-0">${order.amount}/mo</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-white/60">Allocation:</span> <span className="font-mono text-text ml-2">{order.allocation || "Not specified"}</span></div>
              <div><span className="text-white/60">Location:</span> <span className="font-mono text-text ml-2">{order.providerLocation || "Not provided"}</span></div>
              <div><span className="text-white/60">Telemetry:</span> {order.telemetryUrl ? <a href={order.telemetryUrl} target="_blank" rel="noreferrer" className="ml-2 text-gold hover:underline">Open telemetry</a> : <span className="ml-2 text-white/60">Not provided</span>}</div>
              
            </div>
          </div>
        </Card>

        {/* Financial Summary */}
        <Card className="p-5 space-y-4">
          <h3 className="text-label-caps text-white/60 uppercase tracking-wider">ORDER VALUE & PAYMENT STATUS</h3>
          <div className="space-y-3 bg-surface-2 p-4 rounded-lg border border-border">
            <div className="flex justify-between text-sm"><span className="text-white/60">Monthly Lease Rate</span><span className="font-mono text-gold">${order.amount}/mo</span></div>
            <div className="flex justify-between text-sm"><span className="text-white/60">Payment method</span><span className="font-mono text-text">{order.paymentMethod || "Not selected"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-white/60">Payment status</span><span className="font-mono text-gold">{order.paymentStatus || "not_started"}</span></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg border border-border text-sm text-white/60">
            <Shield className="w-5 h-5 text-gold shrink-0" />
            <span>This order is stored in the database. No payment has been collected and no escrow is active.</span>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <Card className="p-5">
        <h3 className="text-label-caps text-white/60 uppercase tracking-wider mb-4">ACTIONS</h3>
        <div className="flex flex-wrap gap-3">
          {order.status?.toLowerCase() === "pending_review" && (
            <>
              <Button onClick={() => handleAction("confirm")} disabled={actionLoading === "confirm"}>
                <CheckCircle className="w-4 h-4 mr-1" /> Confirm & Contract
              </Button>
              <Button variant="destructive" onClick={() => handleAction("decline")} disabled={actionLoading === "decline"}>
                <XCircle className="w-4 h-4 mr-1" /> Decline Order
              </Button>
            </>
          )}
          {order.status?.toLowerCase() === "confirmed" && (
            <Button onClick={() => window.location.assign(`/provider/orders/${id}/dispatch`)} disabled={actionLoading === "ship"}>
              <Truck className="w-4 h-4 mr-1" /> Initiate Dispatch
            </Button>
          )}
          {order.status?.toLowerCase() === "shipped" && (
            <Button onClick={() => handleAction("deliver")} disabled={actionLoading === "deliver"}>
              <CheckCircle className="w-4 h-4 mr-1" /> Mark Delivered
            </Button>
          )}
<Button variant="ghost" onClick={loadWaybill}>
  View Waybill
</Button>
        </div>
      </Card>

      {/* Waybill Drawer */}
      <Drawer
        open={waybillOpen}
        onClose={() => setWaybillOpen(false)}
        title="Waybill Details"
        side="right"
        className="md:w-[520px]"
      >
        <div className="space-y-4">
          {waybill ? (
            <>
              {waybill.trackingNumber && <div className="font-mono text-sm text-gold">{waybill.trackingNumber}</div>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {waybill.carrier && <div><span className="text-white/60">Carrier:</span> <span className="font-mono ml-2">{waybill.carrier}</span></div>}
                {waybill.status && <div><span className="text-white/60">Status:</span> <span className="font-mono ml-2 text-gold">{waybill.status}</span></div>}
                {waybill.pickupTime && <div><span className="text-white/60">Pickup:</span> <span className="font-mono ml-2">{waybill.pickupTime}</span></div>}
                {waybill.eta && <div><span className="text-white/60">Est. Delivery:</span> <span className="font-mono ml-2">{waybill.eta}</span></div>}
                {waybill.route && <div className="col-span-2"><span className="text-white/60">Route:</span> <span className="font-mono ml-2 block">{waybill.route}</span></div>}
                {waybill.gps && <div className="col-span-2"><span className="text-white/60">GPS:</span> <span className="font-mono ml-2 block text-gold">{waybill.gps}</span></div>}
              </div>
              <Button className="w-full bg-[#1a1b21] !border-0" variant="ghost" onClick={() => window.print()}>Download Waybill PDF</Button>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-white/60">Loading waybill...</div>
          )}
        </div>
      </Drawer>
    </div>
  );
}