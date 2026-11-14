import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Download, DollarSign, MessageSquare, TrendingUp, ExternalLink, ChevronRight } from "lucide-react";
import { Button, Card, StatusPill, Skeleton, SkeletonText, SkeletonCard, DataTable } from "../../components/ui";
import { listOrdersApi, getProviderProfileApi, listAssetsApi, listConversationsApi } from "../../lib/api";

export default function ProviderDashboardPage() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profileRes, ordersRes, assetsRes, conversationsRes] = await Promise.all([
          getProviderProfileApi(),
          listOrdersApi({ limit: 5, status: "PENDING,CONFIRMED" }),
          listAssetsApi({ limit: 3 }),
          listConversationsApi({ limit: 5 }),
        ]);
        setProfile(profileRes);
        setOrders(ordersRes.data || ordersRes.orders || ordersRes);
        setAssets(assetsRes.data || assetsRes.assets || assetsRes);
        setConversations(conversationsRes.data || conversationsRes.conversations || conversationsRes);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="p-5" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8">
            <Card className="p-5">
              <SkeletonText lines={6} />
            </Card>
          </div>
          <div className="xl:col-span-4">
            <Card className="p-5"><SkeletonText lines={8} /></Card>
            <Card className="p-5"><SkeletonText lines={6} /></Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-center">
        <div>
          <p className="text-gold mb-4">Failed to load dashboard: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const companyName = profile?.name || "Your Company";
  const activeListings = assets?.length || 0;
  const pendingOrders = orders?.filter(o => o.status === "PENDING").length || 0;
  const totalRevenue = orders?.reduce((sum, o) => sum + (Number(o.lease_amount) || Number(o.amount) || 0), 0) || 0;
  const unreadEnquiries = conversations?.filter(c => c.unread_count > 0).length || 0;
  const highPriorityEnquiries = conversations?.filter(c => c.priority === "high" && c.unread_count > 0).length || 0;

  return (
    <div className="space-y-8">
      {/* Top Ambient Context Bar */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-label-caps text-white/60 font-medium tracking-widest">
          <span className="inline-block w-2 h-2 rounded-full bg-gold"></span>
          <span>OVERVIEW // PROVIDER DASHBOARD</span>
          <span className="text-border font-normal">/</span>
          <span className="text-gold font-semibold">CORE CLUSTER // LIVE</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-white/60">
          <span className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
            GATEWAY: EU-WEST-1A
          </span>
          <span className="text-border">|</span>
          <span>LATENCY: 14ms</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="w-full flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8">
        <div className="max-w-3xl">
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-text tracking-tight">
            Good morning, <span className="text-gold">{companyName}</span>
          </h1>
          <p className="font-sans text-base text-white/60 mt-2 max-w-2xl leading-relaxed">
            Here is what is happening across your physical fleet and compute clusters today. {activeListings} active listings operational with zero telemetry anomalies.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="ghost" className="h-10 px-4">
            <Download className="w-4 h-4 mr-1" /> Export Report
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-1" /> + Add Asset
          </Button>
        </div>
      </div>

      {/* 4-Stat Metric Cluster */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 flex flex-col justify-between relative overflow-hidden group hover:bg-surface transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-label-caps text-white/60 uppercase tracking-wider">Active Listings</span>
            <span className="p-2 rounded bg-surface text-gold group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="font-serif text-3xl font-semibold text-text tracking-tight">{activeListings}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-white/60">
              <span className="text-gold font-medium">—</span>
              <span>indexed this month</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface group-hover:bg-gold transition-colors"></div>
        </Card>

        <Card className="p-5 flex flex-col justify-between relative overflow-hidden group hover:bg-surface transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-label-caps text-white/60 uppercase tracking-wider">Open Orders</span>
            <span className="p-2 rounded bg-surface text-gold group-hover:scale-105 transition-transform">
              <ExternalLink className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="font-serif text-3xl font-semibold text-text tracking-tight">{orders?.length || 0}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-gold">
              <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
              <span>{pendingOrders} awaiting review</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface group-hover:bg-gold transition-colors"></div>
        </Card>

        <Card className="p-5 flex flex-col justify-between relative overflow-hidden group hover:bg-surface transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-label-caps text-white/60 uppercase tracking-wider">Unread Enquiries</span>
            <span className="p-2 rounded bg-surface text-gold group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="font-serif text-3xl font-semibold text-text tracking-tight">{unreadEnquiries}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-gold">
              <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
              <span>{highPriorityEnquiries} high priority</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface group-hover:bg-gold transition-colors"></div>
        </Card>

        <Card className="p-5 flex flex-col justify-between relative overflow-hidden group hover:bg-surface transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-label-caps text-white/60 uppercase tracking-wider">Revenue This Month</span>
            <span className="p-2 rounded bg-surface text-gold group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="font-serif text-3xl font-semibold text-gold tracking-tight">${totalRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-gold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>—</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface group-hover:bg-gold transition-colors"></div>
        </Card>
      </div>

      {/* Main Asymmetric Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10">
        {/* Left Column: Incoming Orders */}
        <div className="xl:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-label-caps text-white/60 tracking-wider uppercase flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold"></span>
              INCOMING ORDERS & CLIENT CONTRACTS
            </div>
            <span className="text-xs font-mono text-border">UPDATED: REAL-TIME</span>
          </div>
          <Card className="p-5 md:p-6 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-border">
              <div className="flex items-center gap-3">
                <h2 className="text-label-caps text-text font-semibold uppercase tracking-wider">Recent Client Orders</h2>
                <StatusPill status="pending" label={`${pendingOrders} Active`} />
              </div>
              <div className="inline-flex rounded-lg bg-surface p-1 gap-1">
                <Button variant="ghost" size="sm" className="bg-surface-2 text-gold border-gold/30 px-3 py-1 text-xs">All</Button>
                <Button variant="ghost" size="sm" className="px-3 py-1 text-xs">Pending Review</Button>
                <Button variant="ghost" size="sm" className="px-3 py-1 text-xs">Confirmed</Button>
              </div>
            </div>

            <DataTable
              columns={[
                { key: "client", header: "Client Entity", render: (row) => (
                  <div>
                    <div className="font-medium text-text">{row.clientName || "—"}</div>
                    <div className="text-xs font-mono text-white/60">—</div>
                  </div>
                )},
                { key: "asset", header: "Allocated Asset", render: (row) => (
                  <div>
                    <div className="text-text font-medium">{row.assetName || "—"}</div>
                    <div className="text-xs font-mono text-border">—</div>
                  </div>
                )},
                { key: "amount", header: "Amount", render: (row) => (
                  <span className="font-serif text-lg font-semibold text-gold">${(row.amount || row.lease_amount || 0).toLocaleString()}<span className="text-xs font-mono text-white/60 font-normal">/mo</span></span>
                )},
                { key: "status", header: "Status", render: (row) => (
                  <StatusPill status={row.status?.toLowerCase() || "pending"} />
                )},
                { key: "action", header: "Action", render: (row) => (
                  <Link to={`/provider/orders/${row.id}`}>
                    <Button size="sm" className="h-8 px-4">Review</Button>
                  </Link>
                )},
              ]}
              rows={orders?.slice(0, 4) || []}
              emptyMessage="No orders found."
              rowKey={(row) => row.id}
            />

            <div className="pt-4 mt-4 flex items-center justify-between">
              <Link to="/provider/orders" className="text-label-caps text-gold hover:text-gold-soft flex items-center gap-1 font-medium">
                View all orders and lease agreements
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: My Listings & Enquiries */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* My Listings */}
          <Card className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-label-caps text-white/60 tracking-wider uppercase flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold"></span>
                MY LISTINGS
              </div>
              <span className="text-xs font-mono text-gold">{activeListings} ACTIVE UNITS</span>
            </div>

            {assets?.slice(0, 3).map((asset, i) => (
              <div key={asset.id || i} className="p-3 rounded-lg bg-surface hover:bg-surface-2 transition-colors flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-sans font-semibold text-text">{asset.name || "—"}</span>
                  <StatusPill status={asset.status?.toLowerCase() || "available"} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gold font-mono">${asset.rate || asset.price_monthly || "—"}/mo</span>
                  <Link to={`/provider/listings/${asset.id}/preview`} className="text-label-caps text-white/60 hover:text-gold flex items-center gap-0.5">
                    <ExternalLink className="w-3.5 h-3.5" /> Edit
                  </Link>
                </div>
              </div>
            ))}

            <Button variant="ghost" className="w-full h-10 mt-1">
              <Plus className="w-4 h-4 mr-1" /> + Add Asset
            </Button>
          </Card>

          {/* Enquiries Feed */}
          <Card className="p-5">
            <div className="text-label-caps text-white/60 tracking-wider uppercase mb-4 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold"></span>
              RECENT ENQUIRIES
            </div>
            <div className="space-y-3">
              {conversations?.slice(0, 3).map((conv, i) => (
                <Link key={conv.id || i} to="/messages" className="block p-3 rounded-lg bg-surface hover:bg-surface-2 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-label-caps text-gold">{conv.other_party_name || "—"}</span>
                      <p className="text-xs text-white/60 mt-0.5 line-clamp-1">{conv.last_message_preview || "No messages yet"}</p>
                    </div>
                    <span className="text-[10px] font-mono text-border shrink-0">{conv.last_message_at || "—"}</span>
                  </div>
                  {conv.unread_count > 0 && <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold mt-2" />}
                </Link>
              ))}
              {!conversations?.length && (
                <div className="text-center text-white/60 py-4">No enquiries yet.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}