import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, StatusPill, SkeletonText, SkeletonCard, DataTable } from "../../components/ui";
import { listOrdersApi, getProviderProfileApi, listAssetsApi, listConversationsApi } from "../../lib/api";

export default function ProviderDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, ordersRes, assetsRes, conversationsRes] = await Promise.all([
          getProviderProfileApi(),
          listOrdersApi(),
          listAssetsApi(),
          listConversationsApi({ limit: 5 }),
        ]);
        setProfile(profileRes);
        setOrders(ordersRes?.items || ordersRes?.data?.items || ordersRes?.orders || ordersRes);
        setAssets(assetsRes?.items || assetsRes?.data?.items || assetsRes?.assets || assetsRes);
        setConversations(conversationsRes?.items || conversationsRes?.data?.items || conversationsRes?.conversations || conversationsRes);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [retryCount]);

  if (loading) {
    return (
      <div className="space-y-8 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="p-6 sm:p-8" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8">
            <Card className="p-6 sm:p-8">
              <SkeletonText lines={6} />
            </Card>
          </div>
          <div className="xl:col-span-4">
            <Card className="p-6 sm:p-8"><SkeletonText lines={8} /></Card>
            <Card className="p-6 sm:p-8"><SkeletonText lines={6} /></Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-center px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-[#f2ca50] mb-4 text-sm sm:text-base">Failed to load dashboard: {error}</p>
          <Button onClick={() => setRetryCount((count) => count + 1)}>Retry</Button>
        </div>
      </div>
    );
  }

  const companyName = profile?.company_name || profile?.trading_name || profile?.name || "your provider account";
  const activeListings = assets?.filter(asset => asset.is_active).length || 0;
  const pendingOrders = orders?.filter(o => o.status?.toLowerCase() === "pending_review").length || 0;
  const pricedOrderCount = orders?.filter((order) => order.lease_amount != null || order.amount != null).length || 0;
  const unreadEnquiries = conversations?.filter(c => c.unread_count > 0).length || 0;
  

  return (
    <div className={`min-h-screen bg-[#0c0e13] text-[#ffffff] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 space-y-10`}>
      {/* Hero Header */}
      <div className="w-full flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8">
        <div className="max-w-3xl">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#ffffff] tracking-tight leading-[1.1]">
            Good morning, <span className="text-[#f2ca50]">{companyName}</span>
          </h1>
          <p className="font-sans text-base text-[#ffffff]/60 mt-2 max-w-2xl leading-relaxed">
            Manage your listings, orders, and client enquiries from one place.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => navigate("/provider/listings/new")}
            className="!border-0 !bg-[#f2ca50] !text-[#0c0e13] hover:!bg-[#e2ba40]"
          >
            Add Asset
          </Button>
        </div>
      </div>

      {/* 4-Stat Metric Cluster */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:bg-[#111318] transition-colors border border-[#282a2f] rounded-xl">
          <div className="flex items-start justify-between">
            <span className="text-xs font-mono text-[#ffffff]/60 uppercase tracking-wider">Active Listings</span>
          </div>
          <div className="mt-4">
            <div className="font-serif text-3xl font-semibold text-[#ffffff] tracking-tight">{activeListings}</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111318] group-hover:bg-[#f2ca50] transition-colors"></div>
        </Card>

        <Card className="p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:bg-[#111318] transition-colors border border-[#282a2f] rounded-xl">
          <div className="flex items-start justify-between">
            <span className="text-xs font-mono text-[#ffffff]/60 uppercase tracking-wider">Open Orders</span>
          </div>
          <div className="mt-4">
            <div className="font-serif text-3xl font-semibold text-[#ffffff] tracking-tight">{orders?.filter(order => !["completed", "declined"].includes(order.status?.toLowerCase())).length || 0}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-[#f2ca50]">
              <span>{pendingOrders} awaiting review</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111318] group-hover:bg-[#f2ca50] transition-colors"></div>
        </Card>

        <Card className="p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:bg-[#111318] transition-colors border border-[#282a2f] rounded-xl">
          <div className="flex items-start justify-between">
            <span className="text-xs font-mono text-[#ffffff]/60 uppercase tracking-wider">Unread Enquiries</span>
          </div>
          <div className="mt-4">
            <div className="font-serif text-3xl font-semibold text-[#ffffff] tracking-tight">{unreadEnquiries}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-[#f2ca50]">
              <span>Unread conversations</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111318] group-hover:bg-[#f2ca50] transition-colors"></div>
        </Card>

        <Card className="p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:bg-[#111318] transition-colors border border-[#282a2f] rounded-xl">
          <div className="flex items-start justify-between">
            <span className="text-xs font-mono text-[#ffffff]/60 uppercase tracking-wider">Orders with a Listed Rate</span>
          </div>
          <div className="mt-4">
            <div className="font-serif text-3xl font-semibold text-[#f2ca50] tracking-tight">{pricedOrderCount}</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111318] group-hover:bg-[#f2ca50] transition-colors"></div>
        </Card>
      </div>

      {/* Main Asymmetric Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10">
        {/* Left Column: Incoming Orders */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-[#ffffff]/60 tracking-wider uppercase flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f2ca50]"></span>
              INCOMING ORDERS &amp; CLIENT CONTRACTS
            </div>
          </div>
          <Card className="p-6 sm:p-8 flex flex-col border border-[#282a2f] rounded-xl bg-[#111318]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-[#282a2f]">
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-xl sm:text-2xl text-[#ffffff] font-medium tracking-tight uppercase">Recent Client Orders</h2>
                <StatusPill status="pending" label={`${pendingOrders} Active`} />
              </div>
              <div className="inline-flex rounded-lg bg-[#111318] p-1 gap-1">
                <Button variant="ghost" size="sm" className="bg-[#1a1b21] text-[#f2ca50] !border-0 px-3 py-1 text-xs" onClick={() => navigate("/provider/orders")}>All</Button>
                <Button variant="ghost" size="sm" className="bg-[#1a1b21] !border-0 px-3 py-1 text-xs" onClick={() => navigate("/provider/orders?status=pending")}>Pending Review</Button>
                <Button variant="ghost" size="sm" className="bg-[#1a1b21] !border-0 px-3 py-1 text-xs" onClick={() => navigate("/provider/orders?status=confirmed")}>Confirmed</Button>
              </div>
            </div>

            <DataTable
              columns={[
                { key: "client", header: "Client Entity", render: (row) => (
                  <div>
                    <div className="font-medium text-[#ffffff]">{row.clientName || "—"}</div>
                    {row.ventureInfo && <div className="text-xs font-mono text-[#ffffff]/60">{row.ventureInfo}</div>}
                  </div>
                )},
                { key: "asset", header: "Allocated Asset", render: (row) => (
                  <div>
                    <div className="text-[#ffffff] font-medium">{row.assetName || "—"}</div>
                    {row.assetDetails && <div className="text-xs font-mono text-white/60">{row.assetDetails}</div>}
                  </div>
                )},
                { key: "amount", header: "Amount", render: (row) => (
                  <span className="font-serif text-lg font-semibold text-[#f2ca50]">{(row.amount || row.lease_amount || 0).toLocaleString()}<span className="text-xs font-mono text-[#ffffff]/60 font-normal">/mo · currency not specified</span></span>
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
              <Link to="/provider/orders" className="text-xs font-mono text-[#f2ca50] hover:text-[#e2ba40] flex items-center gap-1 font-medium">
                View all orders and lease agreements
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: My Listings & Enquiries */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* My Listings */}
          <Card className="p-6 sm:p-8 flex flex-col gap-6 border border-[#282a2f] rounded-xl bg-[#111318]">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-[#ffffff]/60 tracking-wider uppercase flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f2ca50]"></span>
                MY LISTINGS
              </div>
              <span className="text-xs font-mono text-[#f2ca50]">{activeListings} ACTIVE UNITS</span>
            </div>

            {assets?.slice(0, 3).map((asset, i) => (
              <div key={asset.id || i} className="p-3 rounded-lg bg-[#111318] hover:bg-[#1a1b21] transition-colors border border-[#282a2f] flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-sans font-semibold text-[#ffffff]">{asset.name || "—"}</span>
                  <StatusPill status={asset.status?.toLowerCase() || "available"} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#f2ca50] font-mono">{asset.rate || asset.price_monthly || "—"} / mo · currency not specified</span>
                  <Link to={`/provider/listings/${asset.id}/edit`} className="text-xs font-mono text-[#ffffff]/60 hover:text-[#f2ca50]">
                    Edit
                  </Link>
                </div>
              </div>
            ))}

            <Button variant="ghost" className="w-full h-10 mt-1 bg-[#1a1b21] !border-0" onClick={() => navigate("/provider/listings/new")}>
              Add Asset
            </Button>
          </Card>

          {/* Enquiries Feed */}
          <Card className="p-6 sm:p-8 border border-[#282a2f] rounded-xl bg-[#111318]">
            <div className="text-xs font-mono text-[#ffffff]/60 tracking-wider uppercase mb-4 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f2ca50]"></span>
              RECENT ENQUIRIES
            </div>
            <div className="space-y-3">
              {conversations?.slice(0, 3).map((conv, i) => (
                <Link key={conv.id || i} to="/messages" className="block p-3 rounded-lg bg-[#111318] hover:bg-[#1a1b21] transition-colors border border-transparent hover:border-[#282a2f]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-[#f2ca50]">{conv.other_party_name || "—"}</span>
                      <p className="text-xs text-[#ffffff]/60 mt-0.5 line-clamp-1">{conv.last_message_preview || "No messages yet"}</p>
                    </div>
                    <span className="text-[10px] font-mono text-white/60 shrink-0">{conv.last_message_at || ""}</span>
                  </div>
                  {conv.unread_count > 0 && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f2ca50] mt-2" />}
                </Link>
              ))}
              {!conversations?.length && (
                <div className="text-center text-[#ffffff]/60 py-4 text-sm sm:text-base">No enquiries yet.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
