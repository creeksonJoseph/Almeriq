import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MapPin, Zap, Shield, Truck, Layers, Box, Satellite, Sun, ChevronRight, MessageSquare, ShoppingCart } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button, Card, Pill, Skeleton, SkeletonCard, SkeletonText } from "../../components/ui";
import { listMarketplaceListingsApi, createMarketplaceOrderApi, createDealApi, startProviderConversationApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  { id: "all", label: "All", icon: "LayoutDashboard" },
  { id: "trucks", label: "Trucks", icon: "Truck" },
  { id: "satellites", label: "Satellites", icon: "Satellite" },
  { id: "generators", label: "Generators", icon: "Zap" },
  { id: "excavators", label: "Excavators", icon: "Box" },
  { id: "containers", label: "Containers", icon: "Package" },
  { id: "solar", label: "Solar Arrays", icon: "Sun" },
];

const ICONS = {
  LayoutDashboard: "⬜",
  Truck: "🚛",
  Satellite: "🛰️",
  Zap: "⚡",
  Box: "📦",
  Package: "📦",
  Sun: "☀️",
};

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [providers, setProviders] = useState([]);
  const [orderingId, setOrderingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({ location: "", kind: "all", minPrice: "", maxPrice: "" });

  const searchForm = useForm({ defaultValues: { query: "" } });
  const watchQuery = searchForm.watch("query");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await listMarketplaceListingsApi({ limit: 50 });
        setProviders(res.items || res.data?.items || res.providers || res.data || res);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categoryTerms = {
    trucks: ["truck", "transport", "logistics"],
    satellites: ["satellite", "communications", "comms"],
    generators: ["generator", "power"],
    excavators: ["excavat", "earthmoving", "machinery"],
    containers: ["container", "edge"],
    solar: ["solar", "renewable"],
  };
  const filteredProviders = providers.filter(provider => {
    const categoryMatch = activeCategory === "all" || (categoryTerms[activeCategory] || [activeCategory]).some(term => (provider.category || "").toLowerCase().includes(term));
    const query = watchQuery.trim().toLowerCase();
    const searchMatch = !query || [provider.name, provider.provider_name, provider.category, provider.description, provider.provider_location].some(value => String(value || "").toLowerCase().includes(query));
    const locationMatch = !advancedFilters.location || (provider.provider_location || "").toLowerCase().includes(advancedFilters.location.toLowerCase());
    const kindMatch = advancedFilters.kind === "all" || provider.kind === advancedFilters.kind;
    const price = Number(provider.price_monthly || 0);
    const minMatch = advancedFilters.minPrice === "" || price >= Number(advancedFilters.minPrice);
    const maxMatch = advancedFilters.maxPrice === "" || price <= Number(advancedFilters.maxPrice);
    return categoryMatch && searchMatch && locationMatch && kindMatch && minMatch && maxMatch;
  });

  const handleOrder = async (listing) => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/listings/${listing.id}`)}`);
      return;
    }
    if (orderingId) return;
    setOrderingId(listing.id);
    setError(null);
    try {
      const order = await createMarketplaceOrderApi({
        asset_id: listing.id,
        allocation: "Requested through marketplace",
        lease_amount: listing.price_monthly,
      });
      const deal = await createDealApi({
        order_id: order.id,
        payment_method: "visa",
        amount: listing.price_monthly || 0,
      });
      navigate(`/checkout/${deal.id}`);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Unable to start this order.");
    } finally {
      setOrderingId(null);
    }
  };

  const handleChat = async (listing) => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent("/messages")}`);
      return;
    }
    try {
      const conversation = await startProviderConversationApi(listing.provider_id);
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Unable to start conversation.");
    }
  };

  const handleImageClick = (images, index) => {
    setGalleryImages(images);
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonText lines={4} className="max-w-2xl" />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map(c => <Skeleton key={c.id} className="h-10 w-32 rounded-lg shrink-0" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} className="p-5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Command & Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
            <span className="text-label-caps text-white/60 uppercase tracking-widest">GLOBAL PEER-TO-PEER INFRASTRUCTURE NETWORK // VERIFIED HARDTECH & COMPUTE PROVIDERS</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-text tracking-tight font-bold">Infrastructure, ready when you are</h1>
          <p className="font-sans text-base text-white/70 max-w-2xl">Rent or buy the physical and digital infrastructure your company needs, from verified providers worldwide.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
            <span className="text-gold">🌐</span>
            <div className="flex flex-col">
              <span className="text-label-caps text-[10px] text-white/60 leading-tight">ACTIVE FLEET</span>
              <span className="text-label-caps text-text font-semibold">{providers.length} Listings</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
            <Shield className="w-4 h-4 text-gold" />
            <div className="flex flex-col">
              <span className="text-label-caps text-[10px] text-white/60 leading-tight">CHECKOUT</span>
              <span className="text-label-caps text-text font-semibold">Simulated</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
            <Zap className="w-4 h-4 text-gold" />
            <div className="flex flex-col">
              <span className="text-label-caps text-[10px] text-white/60 leading-tight">ROUTING</span>
              <span className="text-label-caps text-text font-semibold">Provider media</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
          <input {...searchForm.register("query")} placeholder="Search listings, categories or providers" className="alq-input w-full pl-10" aria-label="Search marketplace listings" />
        </div>
        <Button type="button" variant="ghost" onClick={() => setFiltersOpen(open => !open)} className="shrink-0">
          <Filter className="mr-2 h-4 w-4" /> {filtersOpen ? "Hide filters" : "Advanced filters"}
        </Button>
      </div>
      {filtersOpen && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-xs text-white/60">Provider location
            <input value={advancedFilters.location} onChange={e => setAdvancedFilters(current => ({ ...current, location: e.target.value }))} className="alq-input w-full" placeholder="e.g. Nairobi" />
          </label>
          <label className="space-y-1 text-xs text-white/60">Asset type
            <select value={advancedFilters.kind} onChange={e => setAdvancedFilters(current => ({ ...current, kind: e.target.value }))} className="alq-input w-full">
              <option value="all">All types</option><option value="physical">Physical</option><option value="digital">Digital</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-white/60">Minimum monthly price
            <input type="number" min="0" value={advancedFilters.minPrice} onChange={e => setAdvancedFilters(current => ({ ...current, minPrice: e.target.value }))} className="alq-input w-full" placeholder="No minimum" />
          </label>
          <label className="space-y-1 text-xs text-white/60">Maximum monthly price
            <input type="number" min="0" value={advancedFilters.maxPrice} onChange={e => setAdvancedFilters(current => ({ ...current, maxPrice: e.target.value }))} className="alq-input w-full" placeholder="No maximum" />
          </label>
        </div>
      )}

      {/* Horizontal Scroll Filter Chips */}
      <div className="w-full pb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2" id="categoryChips">
          {CATEGORIES.map(cat => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "primary" : "ghost"}
              className="shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-lg"
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="text-lg">{ICONS[cat.icon] || "📦"}</span>
              <span className="hidden sm:inline">{cat.label}</span>
              <span className="px-1.5 py-0.2 rounded bg-surface text-[10px] font-mono">{cat.id === "all" ? providers.length : providers.filter(p => (categoryTerms[cat.id] || [cat.id]).some(term => (p.category || "").toLowerCase().includes(term))).length}</span>
            </Button>
          ))}
          <div className="h-4 w-px bg-border shrink-0 mx-1"></div>
          <Button variant="ghost" className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-dashed border-border">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Advanced Filters</span>
          </Button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-gold/40 bg-surface p-4 text-sm text-gold">{error}</div>}

      {/* Marketplace listings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProviders.map(provider => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onChat={() => handleChat(provider)}
            onOrder={() => handleOrder(provider)}
            ordering={orderingId === provider.id}
            onView={() => navigate(`/listings/${provider.id}`)}
            onImageClick={handleImageClick}
          />
        ))}
        {!filteredProviders.length && <div className="col-span-full rounded-xl border border-border p-8 text-center text-white/60">No infrastructure listings match this category yet.</div>}
      </div>

      {/* Gallery Modal */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center" onClick={() => setGalleryOpen(false)}>
          <div className="relative max-w-4xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              {galleryImages[galleryIndex]?.resource_type === "video"
                ? <video src={galleryImages[galleryIndex].url} controls className="w-full h-full object-contain" />
                : <img src={galleryImages[galleryIndex]?.url} alt="" className="w-full h-full object-contain" />}
            </div>
            {galleryImages.length > 1 && (
              <>
                <button onClick={() => setGalleryIndex(i => (i - 1 + galleryImages.length) % galleryImages.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white" aria-label="Previous">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={() => setGalleryIndex(i => (i + 1) % galleryImages.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white" aria-label="Next">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <button onClick={() => setGalleryOpen(false)} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white" aria-label="Close">✕</button>
            <div className="flex justify-center gap-2 p-4">
              {galleryImages.map((item, i) => (
                <button key={item.public_id || i} onClick={() => setGalleryIndex(i)} className={`w-16 h-10 rounded overflow-hidden border-2 ${i === galleryIndex ? "border-gold" : "border-transparent"}`}>
                  {item.resource_type === "video" ? <video src={item.url} className="w-full h-full object-cover" /> : <img src={item.url} alt="" className="w-full h-full object-cover" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderCard({ provider, onChat, onOrder, onView, ordering }) {
  const media = provider.media || [];
  const cover = media[0];

  return (
    <Card className="flex flex-col justify-between p-5 hover:border-gold/60 transition-colors group">
      <div className="flex flex-col gap-3.5">
        {cover && (
          <button type="button" className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-2 text-left" onClick={() => onImageClick(media, 0)} aria-label="Open listing media gallery">
            {cover.resource_type === "video"
              ? <video src={cover.url} className="h-full w-full object-cover" muted playsInline />
              : <img src={cover.url} alt={provider.name || provider.provider_name || "Infrastructure listing"} className="h-full w-full object-cover" />}
            {media.length > 1 && <span className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-1 text-xs text-white">+{media.length - 1} media</span>}
          </button>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-surface-2 border border-gold/40 text-gold font-serif font-bold text-lg flex items-center justify-center shrink-0">
              {(provider.provider_name || provider.name || "AL").slice(0,2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif text-base font-semibold text-text truncate group-hover:text-gold transition-colors">{provider.name || provider.provider_name}</h3>
                {(provider.verified || provider.provider_verified) && <span className="text-gold" aria-label="Verified Provider">✓</span>}
              </div>
              <div className="flex items-center gap-1 text-white/60 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{provider.location || provider.provider_location || "Location not provided"}</span>
              </div>
            </div>
          </div>
          <Pill variant="gold" className="shrink-0">{provider.status || "available"}</Pill>
        </div>
        <p className="text-sm text-white/70 line-clamp-2">{provider.description || "No description provided."}</p>
        <div className="font-serif text-xl font-semibold text-gold">{provider.price_monthly != null ? "$" + Number(provider.price_monthly).toLocaleString() + "/mo" : "Price on request"}</div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(provider.tags || [provider.category, provider.kind]).filter(Boolean).slice(0, 2).map((tag, i) => (
            <Pill key={i} variant="white" className="truncate max-w-full">{tag}</Pill>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-border">
        <Button variant="ghost" size="sm" className="py-2 px-1" onClick={onChat}>
          <MessageSquare className="w-4 h-4 mr-1" />
          <span className="truncate">Chat</span>
        </Button>
        <Button size="sm" className="py-2 px-1" onClick={onOrder} disabled={ordering || provider.status !== "available"}>
          <ShoppingCart className="w-4 h-4 mr-1" />
          <span className="truncate">{ordering ? "Starting..." : "Order"}</span>
        </Button>
        <Button variant="ghost" size="sm" className="py-2 px-1" onClick={onView}>
          <span className="truncate">View</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}