import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Plus, Filter, Search, ChevronDown } from "lucide-react";
import { Button, Card, Input, Pill, StatusPill, DataTable, Skeleton, SkeletonCard } from "../../components/ui";
import { AssetCard } from "../../components/AssetCard";
import { AssetGrid } from "../../components/AssetGrid";
import { listAssetsApi, deleteAssetApi } from "../../lib/api";

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

const CATEGORIES = [
  { value: "all", label: "All", icon: "LayoutDashboard" },
  { value: "physical", label: "Physical", icon: "Truck" },
  { value: "digital", label: "Digital", icon: "Server" },
];

const STATUSES = [
  { value: "all", label: "Status: All" },
  { value: "available", label: "Status: Available" },
  { value: "reserved", label: "Status: Reserved" },
  { value: "unavailable", label: "Status: Unavailable" },
];

const ProviderListingsPage = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ category: "all", status: "all", search: "" });
  const [viewMode, setViewMode] = useState("grid");

  const searchForm = useForm({ defaultValues: { search: "" } });
  const watchSearch = searchForm.watch("search");

  useEffect(() => {
    async function loadAssets() {
      setLoading(true);
      try {
        const res = await listAssetsApi();
        setAssets(res?.items || res.data?.items || res.data || res.assets || res);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAssets();
  }, []);

  const filteredAssets = assets.filter(a => {
    const matchesCategory = filter.category === "all" || a.kind === filter.category;
    const matchesStatus = filter.status === "all" || a.status?.toLowerCase() === filter.status;
    const matchesSearch = a.name?.toLowerCase().includes(watchSearch.toLowerCase()) ||
      a.category?.toLowerCase().includes(watchSearch.toLowerCase()) ||
      a.serial?.toLowerCase().includes(watchSearch.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleDelete = async (assetId) => {
    try {
      await deleteAssetApi(assetId);
      setAssets(prev => prev.filter(a => a.id !== assetId));
    } catch (e) {
      setError(e.message);
    }
  };

  const confirmDelete = (assetId) => {
    if (window.confirm("Are you sure you want to delete this asset? This action cannot be undone.")) {
      handleDelete(assetId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} className="p-6 sm:p-8" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-center px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-[#f2ca50] mb-4 text-sm sm:text-base">Failed to load listings: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0c0e13] text-[#ffffff] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 space-y-10`}>
      {/* Top Action & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#ffffff] tracking-tight leading-[1.1]">My listings</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate("/provider/listings/new")} className="!border-0 !bg-[#f2ca50] !text-[#0c0e13] hover:!bg-[#e2ba40]">
            Add asset
          </Button>
        </div>
      </div>

      {/* Filter & Control Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8 pb-5 border-b border-[#282a2f]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Tabs */}
          <div className="inline-flex p-1 bg-[#111318] rounded-lg border border-[#282a2f]">
            {CATEGORIES.map(cat => (
              <Button
                key={cat.value}
                variant={filter.category === cat.value ? "primary" : "ghost"}
                size="sm"
                className={`!border-0 px-3.5 py-1.5 rounded-md text-xs font-medium ${
                  filter.category === cat.value
                    ? "!bg-[#f2ca50] !text-[#0c0e13] hover:!bg-[#e2ba40]"
                    : "!bg-transparent !text-[#ffffff]/70 hover:!bg-[#1a1b21] hover:!text-[#ffffff]"
                }`}
                onClick={() => setFilter(f => ({ ...f, category: cat.value }))}
              >
                {cat.label} ({cat.value === "all" ? assets.length : assets.filter(a => a.kind === cat.value).length})
              </Button>
            ))}
          </div>

          {/* Status dropdown */}
          <div className="relative inline-block text-xs">
            <select
              value={filter.status}
              onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
              className="appearance-none bg-[#111318] border border-[#282a2f] hover:border-[#282a2f] text-[#ffffff] pl-3 pr-8 py-2 rounded-lg font-medium cursor-pointer focus:outline-none focus:border-[#f2ca50] transition-colors"
            >
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#ffffff]/60">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Search Field */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#ffffff]/60">
              <Search className="w-4 h-4" />
            </div>
            <Input
              placeholder="Search by serial, asset name, or spec..."
              className="pl-9 pr-3 py-2 text-xs"
              {...searchForm.register("search")}
            />
          </div>
        </div>

        {/* Right: Telemetry Link & Counters */}
        <div className="flex items-center gap-4 text-xs text-[#ffffff]/60 self-end lg:self-center">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#f2ca50]"></span>
            <span className="font-mono text-[11px] text-[#f2ca50]">{assets.length} assets</span>
          </div>
        </div>
      </div>

      {/* Asset Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
        <AssetGrid
          assets={filteredAssets}
          onDelete={confirmDelete}
          onClearFilters={() => setFilter({ category: "all", status: "all", search: "" })}
        />
      </div>

    </div>
  );
};

export default ProviderListingsPage;
