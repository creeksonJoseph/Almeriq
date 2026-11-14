import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Download, Truck, CheckCircle, XCircle, AlertCircle, FileText, MapPin, DollarSign, Clock, Shield, ExternalLink } from "lucide-react";
import { Button, Card, StatusPill, Drawer, Skeleton, SkeletonText } from "../../components/ui";
import { getOrderApi, getWaybillApi, confirmOrderApi, declineOrderApi, shipOrderApi } from "../../lib/api";

const STATUS_STEPS = [
  { key: "created", label: "Order Created", icon: FileText },
  { key: "escrow", label: "Escrow Funded", icon: Shield },
  { key: "review", label: "Provider Review", icon: AlertCircle },
  { key: "confirmed", label: "Confirmed & Contracted", icon: CheckCircle },
  { key: "dispatched", label: "Dispatched", icon: Truck },
  { key: "delivered", label: "Delivered & Verified", icon: CheckCircle },
];

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
      if (action === "confirm") await confirmOrderApi(id);
      else if (action === "decline") await declineOrderApi(id, "Provider declined");
      else if (action === "ship") await shipOrderApi(id, { trackingNumber: `TRK-${Date.now()}` });
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
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Orders
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

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === (order.currentStep || "review"));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => window.history.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Orders
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
              <span className={`w-2 h-2 rounded-full ${statusConfig.color.replace("text-", "bg-")}`}></span>
              {statusConfig.label}
            </span>
            <span className="text-white/60 text-sm">Escrow: {order.escrowStatus || "Funded"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={loadWaybill}>
            <FileText className="w-4 h-4 mr-1" /> Waybill
          </Button>
          <Button variant="ghost">
            <Download className="w-4 h-4 mr-1" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <Card className="p-5">
        <h3 className="text-label-caps text-white/60 uppercase tracking-wider mb-4">ORDER TIMELINE</h3>
        <div className="space-y-4">
          {STATUS_STEPS.map((step, i) => {
            const isCompleted = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const isFuture = i > currentStepIndex;
            const stepData = order.timeline?.[step.key];
            return (
              <div key={step.key} className="flex items-start gap-3 relative">
                <div className="relative flex-shrink-0 w-6">
                  <div className={`w-2 h-2 rounded-full relative z-10 ${isCompleted ? "bg-gold" : isCurrent ? "bg-gold animate-pulse" : "bg-border"}`}></div>
                  {i < STATUS_STEPS.length - 1 && <div className="absolute left-0.5 top-2 w-0.5 h-full bg-border"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <step.icon className={`w-4 h-4 shrink-0 ${isCompleted ? "text-gold" : isCurrent ? "text-gold" : "text-white/60"}`} />
                    <span className={`font-medium text-sm ${isCompleted ? "text-text" : isCurrent ? "text-gold" : "text-white/60"}`}>{step.label}</span>
                  </div>
                  <div className={`text-label-caps text-[10px] ml-6 ${isCompleted ? "text-white/60" : isCurrent ? "text-gold/70" : "text-white/40"}`}>
                    {stepData ? stepData.time : isFuture ? "—" : "Processing..."}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Order Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client & Asset */}
        <Card className="p-5 space-y-4">
          <h3 className="text-label-caps text-white/60 uppercase tracking-wider">CLIENT & ASSET</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-surface-2 border border-border text-text text-sm font-bold flex items-center justify-center shrink-0">
              {order.clientName?.split(' ').map(w => w[0]).join('') || "AD"}
            </div>
            <div>
              <span className="font-semibold text-text">{order.clientName}</span>
              <div className="text-sm text-white/60">{order.clientVenture || "YC W24 · Tier-1 Verified"}</div>
            </div>
          </div>
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-sm font-medium text-text">{order.assetName}</span>
                <div className="text-xs text-white/60">{order.assetSpecs || "CAT 336 Next-Gen Excavator · 6-mo operational lease"}</div>
              </div>
              <span className="font-mono font-semibold text-gold shrink-0">${order.amount}/mo</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-white/60">Allocation:</span> <span className="font-mono text-text ml-2">{order.allocation || "3x 36-ton units"}</span></div>
              <div><span className="text-white/60">Location:</span> <span className="font-mono text-text ml-2">{order.location || "Yard Bay 12"}</span></div>
              <div><span className="text-white/60">Telemetry:</span> <span className="flex items-center gap-1 text-gold font-medium ml-2"><span className="w-1.5 h-1.5 rounded-full bg-gold"></span> Active</span></div>
              <div><span className="text-white/60">Escrow:</span> <span className="font-mono text-text ml-2">{order.escrowId || "0x8892...B39F"}</span></div>
            </div>
          </div>
        </Card>

        {/* Financial Summary */}
        <Card className="p-5 space-y-4">
          <h3 className="text-label-caps text-white/60 uppercase tracking-wider">FINANCIAL SUMMARY</h3>
          <div className="space-y-3 bg-surface-2 p-4 rounded-lg border border-border">
            <div className="flex justify-between text-sm"><span className="text-white/60">Monthly Lease Rate</span><span className="font-mono text-gold">${order.amount}/mo</span></div>
            <div className="flex justify-between text-sm"><span className="text-white/60">Lease Duration</span><span className="font-mono text-text">{order.duration || "6 months"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-white/60">Escrow Deposit</span><span className="font-mono text-gold">${order.escrowAmount || "87,000"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-white/60">Platform Fee (2%)</span><span className="font-mono text-white/60">${(order.amount * 0.02).toLocaleString()}/mo</span></div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold text-text">Total Commitment</span>
              <span className="font-serif text-xl font-semibold text-gold">${((order.amount * 6) + order.escrowAmount).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg border border-border text-sm text-white/60">
            <Shield className="w-5 h-5 text-gold shrink-0" />
            <span>Funds held in 100% bonded ALIMERIQ multi-sig escrow until delivery confirmation and telemetry handshake at node {order.nodeId || "#BJ-H100-NODE09"}.</span>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <Card className="p-5">
        <h3 className="text-label-caps text-white/60 uppercase tracking-wider mb-4">ACTIONS</h3>
        <div className="flex flex-wrap gap-3">
          {order.status === "PENDING" && (
            <>
              <Button onClick={() => handleAction("confirm")} disabled={actionLoading === "confirm"}>
                <CheckCircle className="w-4 h-4 mr-1" /> Confirm & Contract
              </Button>
              <Button variant="destructive" onClick={() => handleAction("decline")} disabled={actionLoading === "decline"}>
                <XCircle className="w-4 h-4 mr-1" /> Decline Order
              </Button>
            </>
          )}
          {order.status === "CONFIRMED" && (
            <Button onClick={() => handleAction("ship")} disabled={actionLoading === "ship"}>
              <Truck className="w-4 h-4 mr-1" /> Initiate Dispatch
            </Button>
          )}
          {order.status === "SHIPPED" && (
            <Button onClick={() => handleAction("deliver")} disabled={actionLoading === "deliver"}>
              <CheckCircle className="w-4 h-4 mr-1" /> Mark Delivered
            </Button>
          )}
          <Button variant="ghost" onClick={loadWaybill}>
            <FileText className="w-4 h-4 mr-1" /> View Waybill
          </Button>
          <Button variant="ghost">
            <ExternalLink className="w-4 h-4 mr-1" /> Open in Marketplace
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
              <div className="font-mono text-sm text-gold">{waybill.trackingNumber || `TRK-${order.id.slice(-6)}`}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-white/60">Carrier:</span> <span className="font-mono ml-2">{waybill.carrier || "ALIMERIQ Logistics"}</span></div>
                <div><span className="text-white/60">Status:</span> <span className="font-mono ml-2 text-gold">{waybill.status || "In Transit"}</span></div>
                <div><span className="text-white/60">Pickup:</span> <span className="font-mono ml-2">{waybill.pickupTime || "Oct 25 · 08:00 UTC"}</span></div>
                <div><span className="text-white/60">Est. Delivery:</span> <span className="font-mono ml-2">{waybill.eta || "Oct 28 · 18:00 UTC"}</span></div>
                <div className="col-span-2"><span className="text-white/60">Route:</span> <span className="font-mono ml-2 block">{waybill.route || "Yard Bay 12 → Client Site, Austin TX"}</span></div>
                <div className="col-span-2"><span className="text-white/60">GPS:</span> <span className="font-mono ml-2 block text-gold">{waybill.gps || "30.2672° N, 97.7431° W (Live)"}</span></div>
              </div>
              <Button className="w-full" variant="ghost">Download Waybill PDF</Button>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-white/60">Loading waybill...</div>
          )}
        </div>
      </Drawer>
    </div>
  );
}