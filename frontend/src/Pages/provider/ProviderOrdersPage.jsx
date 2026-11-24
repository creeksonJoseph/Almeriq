import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download, Plus, Filter, ChevronRight, Search } from "lucide-react";
import { Button, Card, Input, StatusPill, DataTable, Skeleton, SkeletonText, SkeletonCard, Drawer } from "../../components/ui";
import { listOrdersApi, getOrderApi, getProviderOrderSummaryApi } from "../../lib/api";

const C = {
  bg: "#0c0e13",
  surface: "#111318",
  surfaceLow: "#1a1b21",
  surfaceContainer: "#1e2025",
  surfaceHigh: "#282a2f",
  gold: "#f2ca50",
  text: "#ffffff",
  border: "#282a2f",
};

const STATUS_CONFIG = {
  pending: { variant: "gold", label: "Pending" },
  pending_review: { variant: "gold", label: "Pending" },
  declined: { variant: "danger", label: "Declined" },
  confirmed: { variant: "gold", label: "Confirmed" },
  shipped: { variant: "gold", label: "Shipped" },
  completed: { variant: "gold", label: "Completed" },
};

export default function ProviderOrdersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [orderSummary, setOrderSummary] = useState({ total_orders: 0, open_orders: 0, pending_review: 0, confirmed: 0, shipped: 0, completed: 0, declined: 0, priced_orders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialStatus = searchParams.get("status");
  const [activeTab, setActiveTab] = useState(initialStatus === "pending_review" ? "pending" : initialStatus || "all");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
        const [res, summary] = await Promise.all([
          listOrdersApi({ limit: 50, offset: 0 }),
          getProviderOrderSummaryApi(),
        ]);
        if (cancelled) return;
        setOrders(res.items || []);
        setOrdersTotal(res.total ?? res.items?.length ?? 0);
        setOrderSummary(summary);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.detail || e.message || "Unable to load orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadOrders();
    return () => { cancelled = true; };
  }, []);

  const loadMoreOrders = async () => {
    if (loadingMore || orders.length >= ordersTotal) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await listOrdersApi({ limit: 50, offset: orders.length });
      setOrders((current) => {
        const seen = new Set(current.map((order) => order.id));
        return [...current, ...(res.items || []).filter((order) => !seen.has(order.id))];
      });
      setOrdersTotal(res.total ?? ordersTotal);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Unable to load more orders.");
    } finally {
      setLoadingMore(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const statusMatches = activeTab === "all" ||
      (activeTab === "pending" ? order.status?.toLowerCase() === "pending_review" : order.status?.toLowerCase() === activeTab);
    const query = search.toLowerCase();
    const searchMatches = !query ||
      String(order.order_id || order.id || "").toLowerCase().includes(query) ||
      order.clientName?.toLowerCase().includes(query) ||
      order.assetName?.toLowerCase().includes(query);
    return statusMatches && searchMatches;
  });

  const statusTabs = useMemo(() => [
    { value: "all", label: "All", count: orderSummary.total_orders },
    { value: "pending", label: "Pending", count: orderSummary.pending_review },
    { value: "confirmed", label: "Confirmed", count: orderSummary.confirmed },
    { value: "shipped", label: "Shipped", count: orderSummary.shipped },
    { value: "completed", label: "Completed", count: orderSummary.completed },
    { value: "declined", label: "Declined", count: orderSummary.declined },
  ], [orderSummary]);

  const openDrawer = async (order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
    try {
      const detail = await getOrderApi(order.id);
      setSelectedOrder(detail.data || detail.order || detail);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Unable to load order details.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <SkeletonText lines={3} className="max-w-xl" />
          <div className="flex gap-2"><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-32" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="p-6 sm:p-8" />)}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusTabs.map(t => <Skeleton key={t.value} className="h-9 w-28 rounded-lg shrink-0" />)}
        </div>
        <Skeleton className="h-9 w-64" />
        <Card className="p-6 sm:p-8"><SkeletonText lines={10} /></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-center px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-[#f2ca50] mb-4 text-sm sm:text-base">Failed to load orders: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }



  return (
    <div className={`min-h-screen bg-[#0c0e13] text-[#ffffff] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 space-y-10`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 border-b border-[#282a2f]/30 pb-5">
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#ffffff] tracking-tight leading-[1.1]">Orders</h1>
          <p className="font-sans text-base text-[#ffffff]/60 max-w-2xl mt-2 leading-relaxed">
            Review and manage client orders.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-end shrink-0">
          <Button variant="ghost" className="bg-[#1a1b21] !border-0" onClick={() => {
            const rows = filteredOrders.map((order) => [order.id, order.clientName, order.assetName, order.status, order.amount || order.lease_amount].join(","));
            window.open(`data:text/csv;charset=utf-8,${encodeURIComponent(["Order ID,Client,Asset,Status,Amount", ...rows].join("\n"))}`, "_blank");
          }}>
            Export loaded orders
          </Button>
          <Button className="!border-0 !bg-[#f2ca50] !text-[#0c0e13] hover:!bg-[#e2ba40]" disabled={!orders.some(order => order.status?.toLowerCase() === "confirmed")} onClick={() => {
            const nextOrder = orders.find(order => order.status?.toLowerCase() === "confirmed");
            if (nextOrder) navigate(`/provider/orders/${nextOrder.id}/dispatch`);
          }}>
            Manual Dispatch
          </Button>
        </div>
      </div>

      {/* Summary KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard label="Total Orders" value={orderSummary.total_orders} icon="Receipt" />
        <KPICard label="Pending Review" value={orderSummary.pending_review} icon="AlertCircle" highlight />
        <KPICard label="In Transit / Deployed" value={orderSummary.shipped} icon="Truck" />
        <KPICard label="Orders with a Listed Rate" value={orderSummary.priced_orders} icon="Receipt" />
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
                className="h-9 px-3.5 rounded-lg shrink-0 !border-0 bg-[#1a1b21]"
                onClick={() => setActiveTab(tab.value)}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 rounded bg-[#111318] text-xs font-mono">{tab.count}</span>
              </Button>
            ))}
          </div>
          {/* Search Bar & Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffffff]/60 w-4 h-4" />
              <input
                type="text"
                placeholder="Filter by ID, client, or asset..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 bg-[#111318] border border-[#282a2f] pl-9 pr-3 rounded-lg text-sm text-[#ffffff] placeholder:text-[#ffffff]/40 focus:outline-none focus:border-[#f2ca50] transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace: Table + Drawer */}
      <div className="relative w-full flex flex-col xl:flex-row items-start gap-6">
        {/* Primary Table Canvas */}
        <div className="w-full xl:flex-1 rounded-xl border border-[#282a2f] overflow-hidden flex flex-col bg-[#111318]">
          <div className="px-6 py-4 bg-[#111318] border-b border-[#282a2f] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#f2ca50]">Database</span>
              <span className="text-xs font-mono text-[#ffffff]/60 uppercase tracking-wider">Live Order Ledger ({filteredOrders.length} matches · {orders.length} of {ordersTotal} loaded)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#ffffff]/60">
              <span className="w-2 h-2 rounded-full bg-[#f2ca50]"></span>
              <span>Order records</span>
            </div>
          </div>

          <DataTable
            columns={[
              { key: "id", header: "Order ID", render: (row) => (
                <div className="flex items-center gap-1.5 font-mono font-bold text-[#ffffff]">
                  <span>{row.id}</span>
                  {row.status?.toLowerCase() === "pending_review" && <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]"></span>}
                </div>
              )},
              { key: "client", header: "Client / Venture", render: (row) => (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#111318] border border-[#282a2f] text-[#ffffff] text-[11px] font-bold flex items-center justify-center shrink-0">
                    {row.clientName?.split(' ').map(w => w[0]).join('') || "—"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-[#ffffff] truncate">{row.clientName || "—"}</span>
                    <span className="text-xs font-mono text-[#ffffff]/60 truncate">{row.ventureInfo || "—"}</span>
                  </div>
                </div>
              )},
              { key: "asset", header: "Infrastructure Item", render: (row) => (
                <div>
                  <div className="font-medium text-[#ffffff]">{row.assetName || "—"}</div>
                  <div className="text-xs font-mono text-[#ffffff]/60">{row.assetDetails || "—"}</div>
                </div>
              )},
              { key: "allocation", header: "Allocation", render: (row) => (
                <span className="font-mono text-[#ffffff]/60">{row.allocation || "—"}</span>
              )},
              { key: "amount", header: "Lease Amount", render: (row) => (
                <span className="font-mono font-bold text-[#f2ca50] text-sm">{(row.amount || row.lease_amount || 0).toLocaleString()}<span className="text-xs font-normal text-[#ffffff]/60">/mo · currency not specified</span></span>
              )},
              { key: "status", header: "Status", render: (row) => {
                const config = STATUS_CONFIG[row.status?.toLowerCase()] || STATUS_CONFIG.pending;
                return (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium tracking-tight uppercase ${config.variant === "gold" ? "bg-[#f2ca50]/10 text-[#f2ca50] border border-[#f2ca50]/30" : "bg-[#111318] text-[#ffffff]/60 border border-[#282a2f]"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.variant === "gold" ? "bg-[#f2ca50]" : "bg-[#ffffff]/60"}`}></span>
                    {config.label}
                  </span>
                );
              }},
              { key: "timestamp", header: "Timestamp", render: (row) => (
                <span className="font-mono text-[#ffffff]/60 text-[12px]">{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</span>
              )},
              { key: "action", header: "Inspect", render: (row) => (
                <button onClick={() => openDrawer(row)} className="text-[#f2ca50] hover:text-[#e2ba40] p-1">
                  <ChevronRight className="w-5 h-5" />
                </button>
              )},
            ]}
            rows={filteredOrders}
            emptyMessage="No orders found matching your filters."
            rowKey={(row) => row.id}
          />
          {orders.length < ordersTotal && <div className="flex justify-center border-t border-[#282a2f] p-4"><Button variant="ghost" disabled={loadingMore} onClick={loadMoreOrders}>{loadingMore ? "Loading…" : `Load more orders (${orders.length} of ${ordersTotal})`}</Button></div>}
        </div>

        {/* Order Detail Drawer */}
        <Drawer
          open={drawerOpen}
          onClose={() => { setDrawerOpen(false); setSelectedOrder(null); }}
          title="Order Details"
          side="right"
          className="md:w-[520px]"
        >
          {selectedOrder && <OrderDetailDrawer order={selectedOrder} navigate={navigate} />}
        </Drawer>
      </div>
    </div>
  );
}

function KPICard({ label, value, icon, highlight }) {
  const icons = {
    Receipt: "Receipt",
    AlertCircle: "AlertCircle",
    Truck: "Truck",
    Lock: "Lock",
  };
  return (
    <Card className={`p-6 sm:p-8 flex flex-col gap-2 relative overflow-hidden group transition-colors ${highlight ? "border border-[#f2ca50]/40" : "border border-[#282a2f]"}`}>
      <div className="flex items-center justify-between text-[#ffffff]/60 text-xs font-mono uppercase tracking-wider">
        <span>{label}</span>
        <span className="text-[#f2ca50]">{icons[icon]}</span>
      </div>
      <div className="flex items-baseline justify-between mt-2">
        <span className="font-serif text-2xl font-semibold text-[#ffffff]">{value}</span>
      </div>
      <div className="h-1 w-full bg-[#1a1b21] rounded-full overflow-hidden mt-2">
        <div className="h-full bg-[#282a2f] w-1/3 rounded-full"></div>
      </div>
    </Card>
  );
}

function OrderDetailDrawer({ order, navigate }) {
  const statusConfig = STATUS_CONFIG[order.status?.toLowerCase()] || STATUS_CONFIG.pending;

  // Build timeline from order data if available, otherwise show empty state
  const timelineEvents = order.events || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-[#282a2f]">
        <div>
          <div className="flex items-center gap-2 font-mono font-bold text-[#ffffff]">
            <span>{order.order_id || order.id}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.variant === "gold" ? "bg-[#f2ca50]" : "bg-[#f2ca50]"}`}></span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-7 h-7 rounded bg-[#111318] border border-[#f2ca50]/40 text-[#f2ca50] text-[11px] font-bold flex items-center justify-center shrink-0">
              {order.clientName?.split(' ').map(w => w[0]).join('') || "—"}
            </div>
            <div>
              <span className="font-medium text-[#ffffff]">{order.clientName || "—"}</span>
              
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium tracking-tight uppercase ${statusConfig.variant === "gold" ? "bg-[#f2ca50]/10 text-[#f2ca50] border border-[#f2ca50]/30" : "bg-[#f2ca50]/10 text-[#f2ca50] border border-[#f2ca50]/30"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.variant === "gold" ? "bg-[#f2ca50]" : "bg-[#f2ca50]"}`}></span>
          {statusConfig.label}
        </span>
      </div>

      {/* Asset Details */}
      <div className="bg-[#111318] p-4 rounded-lg border border-[#282a2f] space-y-3">
        <div className="font-medium text-[#ffffff]">{order.assetName || "—"}</div>
        <div className="text-sm text-[#ffffff]/60">{order.assetDetails || "—"}</div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#ffffff]/60">Allocation:</span>
          <span className="font-mono text-[#ffffff]">{order.allocation || "—"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#ffffff]/60">Lease Amount:</span>
          <span className="font-mono font-bold text-[#f2ca50]">{(order.amount || order.lease_amount || 0).toLocaleString()}/mo · currency not specified</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#ffffff]/60">Payment status:</span>
          <span className="font-mono text-[#f2ca50]">{order.paymentStatus || "not_started"}</span>
        </div>
      </div>

      {/* Timeline / Events */}
      <div>
        <h3 className="text-xs font-mono text-[#ffffff]/60 uppercase tracking-wider mb-3">ORDER TIMELINE</h3>
        <div className="space-y-4">
          {timelineEvents.length > 0 ? (
            timelineEvents.map((item, i) => (
              <div key={item.id || i} className="flex items-start gap-3 relative">
                <div className="relative flex-shrink-0 w-6">
                  <div className={`w-2 h-2 rounded-full ${item.status === "completed" ? "bg-[#f2ca50]" : item.status === "current" ? "bg-[#f2ca50] animate-pulse" : "bg-[#282a2f]"} relative z-10`}></div>
                  {i < timelineEvents.length - 1 && <div className="absolute left-0.5 top-2 w-0.5 h-full bg-[#282a2f]"></div>}
                </div>
                <div className="flex-1">
                  <div className={`font-medium text-sm ${item.status === "current" ? "text-[#f2ca50]" : item.status === "completed" ? "text-[#ffffff]" : "text-[#ffffff]/60"}`}>{(item.event_type || "update").replaceAll("_", " ")}</div>
                  <div className={`text-xs font-mono ${item.status === "completed" ? "text-[#ffffff]/60" : "text-[#ffffff]/40"}`}>{item.note || ""}</div>
                  <time className="text-xs font-mono text-[#ffffff]/40">{item.created_at ? new Date(item.created_at).toLocaleString() : "Time not available"}</time>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-[#ffffff]/60 py-4 text-sm sm:text-base">No timeline events available.</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-[#282a2f] flex flex-col gap-3">
        {order.status?.toLowerCase() === "pending_review" && (
          <>
            <Button className="w-full" variant="destructive" onClick={() => navigate(`/provider/orders/${order.id}`)}>Decline Order</Button>
            <Button className="w-full" onClick={() => navigate(`/provider/orders/${order.id}`)}>Confirm &amp; Contract</Button>
          </>
        )}
        {order.status?.toLowerCase() === "confirmed" && (
          <Button className="w-full" onClick={() => navigate(`/provider/orders/${order.id}/dispatch`)}>Initiate Dispatch</Button>
        )}
        {order.status?.toLowerCase() === "shipped" && (
          <Button className="w-full" onClick={() => navigate(`/provider/orders/${order.id}`)}>Mark Delivered</Button>
        )}
        <Button variant="ghost" className="w-full bg-[#1a1b21] !border-0" onClick={() => navigate(`/provider/orders/${order.id}`)}>View Waybill</Button>
        <Button variant="ghost" className="w-full bg-[#1a1b21] !border-0" onClick={() => window.print()}>Export Order PDF</Button>
      </div>
    </div>
  );
}
