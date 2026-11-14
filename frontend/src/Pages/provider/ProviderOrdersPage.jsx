import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Download, Plus, Search, Filter, ChevronRight } from "lucide-react";
import { Button, Card, StatusPill, DataTable, Skeleton, SkeletonCard, SkeletonText, Drawer } from "../../components/ui";
import { listOrdersApi } from "../../lib/api";

const STATUS_CONFIG = {
  pending: { variant: "gold", label: "Pending" },
  confirmed: { variant: "gold", label: "Confirmed" },
  shipped: { variant: "gold", label: "Shipped" },
  completed: { variant: "gold", label: "Completed" },
};

export default function ProviderOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const res = await listOrdersApi({ status: activeTab !== "all" ? activeTab.toUpperCase() : undefined });
        setOrders(res?.items || res.data?.items || res.data || res.orders || res);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [activeTab]);

  const filteredOrders = orders.filter(o =>
    o.id?.toLowerCase().includes(search.toLowerCase()) ||
    o.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    o.assetName?.toLowerCase().includes(search.toLowerCase())
  );

  const statusTabs = useMemo(() => [
    { value: "all", label: "All", count: orders.length },
    { value: "pending", label: "Pending", count: orders.filter(o => o.status === "PENDING").length },
    { value: "confirmed", label: "Confirmed", count: orders.filter(o => o.status === "CONFIRMED").length },
    { value: "shipped", label: "Shipped", count: orders.filter(o => o.status === "SHIPPED").length },
    { value: "completed", label: "Completed", count: orders.filter(o => o.status === "COMPLETED").length },
  ], [orders]);

  const openDrawer = (order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <SkeletonText lines={3} className="max-w-xl" />
          <div className="flex gap-2"><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-32" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="p-4" />)}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusTabs.map(t => <Skeleton key={t.value} className="h-9 w-28 rounded-lg shrink-0" />)}
        </div>
        <Skeleton className="h-9 w-64" />
        <Card className="p-5"><SkeletonText lines={10} /></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-center">
        <p className="text-gold">Failed to load orders: {error}</p>
      </div>
    );
  }

  const escrowVolume = orders.reduce((sum, o) => sum + (Number(o.lease_amount) || Number(o.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Screen Meta & Top Utility Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 border-b border-border/30 pb-5">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
            <span className="text-label-caps text-border uppercase tracking-widest">LEASE CONTRACTS & ESCROW FULFILLMENT // VERIFIED TENANTS</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-text tracking-tight">Orders</h1>
          <p className="font-sans text-base text-white/70 max-w-2xl">Manage verified startup equipment reservations, escrow settlements, and lease lifecycle.</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-end shrink-0">
          <Button variant="ghost">
            <Download className="w-4 h-4 mr-1 text-border" />
            <span>EXPORT CSV</span>
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            <span>MANUAL DISPATCH</span>
          </Button>
        </div>
      </div>

      {/* Summary KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard label="Total Orders" value={orders.length} trend="+3 this wk" trendColor="text-gold" icon="Receipt" />
        <KPICard label="Pending Review" value={orders.filter(o => o.status === "PENDING").length} trend="Action Req" trendColor="text-gold" icon="AlertCircle" highlight />
        <KPICard label="In Transit / Deployed" value={orders.filter(o => o.status === "SHIPPED").length} trend="GPS Ping OK" trendColor="text-gold" icon="Truck" />
        <KPICard label="Escrow Vault Volume" value={escrowVolume > 0 ? `$${escrowVolume.toLocaleString()}` : "—"} trend="100% Bonded" trendColor="text-gold" icon="Lock" />
      </div>

      {/* Filtering, Tabs & Search Toolbar */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0" id="orderStatusTabs">
            {statusTabs.map(tab => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "primary" : "ghost"}
                size="sm"
                className="h-9 px-3.5 rounded-lg shrink-0"
                onClick={() => setActiveTab(tab.value)}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 rounded bg-surface text-xs font-mono">{tab.count}</span>
              </Button>
            ))}
          </div>
          {/* Search Bar & Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-border w-4 h-4" />
              <input
                type="text"
                placeholder="Filter by ID, client, or asset..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 bg-surface border border-border pl-9 pr-3 rounded-lg text-sm text-text placeholder:text-white/40 focus:outline-none focus:border-gold transition-colors"
              />
            </div>
            <Button variant="ghost">
              <Filter className="w-4 h-4 mr-1 text-border" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Workspace: Table + Drawer */}
      <div className="relative w-full flex flex-col xl:flex-row items-start gap-5">
        {/* Primary Table Canvas */}
        <div className="w-full xl:flex-1 rounded-xl bg-surface border border-border overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-surface-2 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gold">Database</span>
              <span className="text-label-caps text-border uppercase tracking-wider font-semibold">Live Order Ledger ({filteredOrders.length} Records)</span>
            </div>
            <div className="flex items-center gap-2 text-label-caps text-border">
              <span className="w-2 h-2 rounded-full bg-gold"></span>
              <span>ESCROW BRIDGE ACTIVE</span>
            </div>
          </div>

          <DataTable
            columns={[
              { key: "id", header: "Order ID", render: (row) => (
                <div className="flex items-center gap-1.5 font-mono font-bold text-text">
                  <span>{row.id}</span>
                  {row.status === "PENDING" && <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>}
                </div>
              )},
              { key: "client", header: "Client / Venture", render: (row) => (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-surface-2 border border-border text-text text-[11px] font-bold flex items-center justify-center shrink-0">
                    {row.clientName?.split(' ').map(w => w[0]).join('') || "—"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-text truncate">{row.clientName || "—"}</span>
                    <span className="text-label-caps text-[10px] text-white/60 truncate">{row.ventureInfo || "—"}</span>
                  </div>
                </div>
              )},
              { key: "asset", header: "Infrastructure Item", render: (row) => (
                <div>
                  <div className="font-medium text-text">{row.assetName || "—"}</div>
                  <div className="text-label-caps text-[10px] text-white/60">{row.assetDetails || "—"}</div>
                </div>
              )},
              { key: "allocation", header: "Allocation", render: (row) => (
                <span className="font-mono text-white/60">{row.allocation || "—"}</span>
              )},
              { key: "amount", header: "Lease Amount", render: (row) => (
                <span className="font-mono font-bold text-gold text-sm">${(row.amount || row.lease_amount || 0).toLocaleString()}<span className="text-xs font-normal text-white/60">/mo</span></span>
              )},
              { key: "status", header: "Status", render: (row) => {
                const config = STATUS_CONFIG[row.status?.toLowerCase()] || STATUS_CONFIG.pending;
                return (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-caps text-[11px] ${config.variant === "gold" ? "bg-gold/10 text-gold border border-gold/30" : "bg-surface-2 text-white/60 border border-border"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.variant === "gold" ? "bg-gold" : "bg-white/60"}`}></span>
                    {config.label}
                  </span>
                );
              }},
              { key: "timestamp", header: "Timestamp", render: (row) => (
                <span className="font-mono text-white/60 text-[12px]">{row.timestamp || "—"}</span>
              )},
              { key: "action", header: "Inspect", render: (row) => (
                <button onClick={() => openDrawer(row)} className="text-gold hover:text-gold-soft p-1">
                  <ChevronRight className="w-5 h-5" />
                </button>
              )},
            ]}
            rows={filteredOrders}
            emptyMessage="No orders found matching your filters."
            rowKey={(row) => row.id}
          />
        </div>

        {/* Order Detail Drawer */}
        <Drawer
          open={drawerOpen}
          onClose={() => { setDrawerOpen(false); setSelectedOrder(null); }}
          title="Order Details"
          side="right"
          className="md:w-[520px]"
        >
          {selectedOrder && <OrderDetailDrawer order={selectedOrder} />}
        </Drawer>
      </div>
    </div>
  );
}

function KPICard({ label, value, trend, trendColor, icon, highlight }) {
  const icons = {
    Receipt: "Receipt",
    AlertCircle: "AlertCircle",
    Truck: "Truck",
    Lock: "Lock",
  };
  return (
    <Card className={`p-4 flex flex-col gap-2 relative overflow-hidden group transition-colors ${highlight ? "border border-gold/40" : "border border-border"}`}>
      <div className="flex items-center justify-between text-white/60 text-label-caps text-[11px] uppercase">
        <span>{label}</span>
        <span className="text-gold">{icons[icon]}</span>
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <span className="font-serif text-2xl font-semibold text-text">{value}</span>
        <span className={`text-label-caps text-[10px] ${trendColor} flex items-center gap-0.5`}>
          <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
          {trend}
        </span>
      </div>
      <div className="h-1 w-full bg-surface-2 rounded-full overflow-hidden">
        <div className="h-full bg-border w-1/3 rounded-full"></div>
      </div>
    </Card>
  );
}

function OrderDetailDrawer({ order }) {
  const statusConfig = STATUS_CONFIG[order.status?.toLowerCase()] || STATUS_CONFIG.pending;

  // Build timeline from order data if available, otherwise show empty state
  const timelineEvents = order.events || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 font-mono font-bold text-text">
            <span>{order.id}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.variant === "gold" ? "bg-gold" : "bg-gold"}`}></span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-7 h-7 rounded bg-surface-2 border border-gold/40 text-gold text-[11px] font-bold flex items-center justify-center shrink-0">
              {order.clientName?.split(' ').map(w => w[0]).join('') || "—"}
            </div>
            <div>
              <span className="font-medium text-text">{order.clientName || "—"}</span>
              <div className="text-label-caps text-[10px] text-white/60">{order.ventureInfo || "—"}</div>
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-caps text-[11px] ${statusConfig.variant === "gold" ? "bg-gold/10 text-gold border border-gold/30" : "bg-gold/10 text-gold border border-gold/30"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.variant === "gold" ? "bg-gold" : "bg-gold"}`}></span>
          {statusConfig.label}
        </span>
      </div>

      {/* Asset Details */}
      <div className="bg-surface-2 p-4 rounded-lg border border-border space-y-3">
        <div className="font-medium text-text">{order.assetName || "—"}</div>
        <div className="text-sm text-white/70">{order.assetDetails || "—"}</div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">Allocation:</span>
          <span className="font-mono text-text">{order.allocation || "—"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">Lease Amount:</span>
          <span className="font-mono font-bold text-gold">${(order.amount || order.lease_amount || 0).toLocaleString()}/mo</span>
        </div>
      </div>

      {/* Timeline / Events */}
      <div>
        <h3 className="text-label-caps text-white/60 uppercase tracking-wider mb-3">ORDER TIMELINE</h3>
        <div className="space-y-4">
          {timelineEvents.length > 0 ? (
            timelineEvents.map((item, i) => (
              <div key={item.id || i} className="flex items-start gap-3 relative">
                <div className="relative flex-shrink-0 w-6">
                  <div className={`w-2 h-2 rounded-full ${item.status === "completed" ? "bg-gold" : item.status === "current" ? "bg-gold animate-pulse" : "bg-border"} relative z-10`}></div>
                  {i < timelineEvents.length - 1 && <div className="absolute left-0.5 top-2 w-0.5 h-full bg-border"></div>}
                </div>
                <div className="flex-1">
                  <div className={`font-medium text-sm ${item.status === "current" ? "text-gold" : item.status === "completed" ? "text-text" : "text-white/70"}`}>{item.event}</div>
                  <div className={`text-label-caps text-[10px] ${item.status === "completed" ? "text-white/70" : "text-white/40"}`}>{item.time}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-white/60 py-4">No timeline events available.</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-border flex flex-col gap-3">
        {order.status === "PENDING" && (
          <>
            <Button className="w-full" variant="destructive">Decline Order</Button>
            <Button className="w-full">Confirm & Contract</Button>
          </>
        )}
        {order.status === "CONFIRMED" && (
          <Button className="w-full">Initiate Dispatch</Button>
        )}
        {order.status === "SHIPPED" && (
          <Button className="w-full">Mark Delivered</Button>
        )}
        <Button variant="ghost" className="w-full">View Waybill</Button>
        <Button variant="ghost" className="w-full">Export Order PDF</Button>
      </div>
    </div>
  );
}