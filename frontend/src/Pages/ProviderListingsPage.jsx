import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Filter, Search, MoreVertical, Trash2, Edit, Activity, ExternalLink, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button, Card, Input, Pill, StatusPill, DataTable, Skeleton, SkeletonCard } from "../components/ui";
import { AssetCard } from "../components/AssetCard";
import { AssetGrid } from "../components/AssetGrid";
import { listAssetsApi, deleteAssetApi } from "../lib/api";

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
        setAssets(res.data || res.assets || res);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAssets();
  }, []);

  const filteredAssets = assets.filter(a => {
    const matchesCategory = filter.category === "all" || a.type === filter.category;
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
      console.error("Delete failed", e);
    }
  };

  const confirmDelete = (assetId) => {
    if (window.confirm("Are you sure you want to delete this asset? This action cannot be undone.")) {
      handleDelete(assetId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} className="p-5" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-center">
        <p className="text-gold">Failed to load listings: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/60 mb-1 font-medium">
            ASSET MANAGEMENT // INFRASTRUCTURE FLEET & CLUSTERS
          </div>
          <h1 className="font-serif text-3xl font-semibold text-text leading-tight">My listings</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            <span>Add asset</span>
          </Button>
        </div>
      </div>

      {/* Filter & Control Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8 pb-5 border-b border-border">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Tabs */}
          <div className="inline-flex p-1 bg-surface-2 rounded-lg border border-border">
            {CATEGORIES.map(cat => (
              <Button
                key={cat.value}
                variant={filter.category === cat.value ? "primary" : "ghost"}
                size="sm"
                className="px-3.5 py-1.5 rounded-md text-xs font-medium"
                onClick={() => setFilter(f => ({ ...f, category: cat.value }))}
              >
                {cat.label} ({assets.filter(a => cat.value === "all" || a.type === cat.value).length})
              </Button>
            ))}
          </div>

          {/* Status dropdown */}
          <div className="relative inline-block text-xs">
            <select
              value={filter.status}
              onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
              className="appearance-none bg-surface-2 border border-border hover:border-border text-text pl-3 pr-8 py-2 rounded-lg font-medium cursor-pointer focus:outline-none focus:border-gold transition-colors"
            >
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-white/60">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Search Field */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/60">
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
        <div className="flex items-center gap-4 text-xs text-white/60 self-end lg:self-center">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gold"></span>
            <span className="font-mono text-[11px] text-gold">14 NODES PINGING</span>
          </div>
          <span className="text-white/40">|</span>
          <span className="font-mono text-[11px] tracking-wide text-white/60">ORBIT SYNCH: 100%</span>
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