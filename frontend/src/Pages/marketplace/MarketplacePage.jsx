import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MapPin, Zap, Shield, Truck, Layers, Box, Satellite, Sun, ChevronRight, MessageSquare, ShoppingCart } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button, Card, Pill, Skeleton, SkeletonCard, SkeletonText } from "../../components/ui";
import { listMarketplaceListingsApi, createMarketplaceOrderApi, createDealApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  { id: "all", label: "All", icon: "LayoutDashboard", count: 142 },
  { id: "trucks", label: "Trucks", icon: "Truck", count: 28 },
  { id: "satellites", label: "Satellites", icon: "Satellite", count: 12 },
  { id: "generators", label: "Generators", icon: "Zap", count: 18 },
  { id: "excavators", label: "Excavators", icon: "Box", count: 22 },
  { id: "containers", label: "Containers", icon: "Package", count: 15 },
  { id: "solar", label: "Solar Arrays", icon: "Sun", count: 9 },
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
  const filteredProviders = activeCategory === "all"
    ? providers
    : providers.filter(p => (categoryTerms[activeCategory] || [activeCategory]).some(term => (p.category || "").toLowerCase().includes(term)));

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
              <span className="text-label-caps text-text font-semibold">{providers.reduce((sum, p) => sum + (p.nodeCount || 0), 1420)} Nodes</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
            <Shield className="w-4 h-4 text-gold" />
            <div className="flex flex-col">
              <span className="text-label-caps text-[10px] text-white/60 leading-tight">ESCROW POOL</span>
              <span className="text-label-caps text-text font-semibold">99.8% Assurance</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
            <Zap className="w-4 h-4 text-gold" />
            <div className="flex flex-col">
              <span className="text-label-caps text-[10px] text-white/60 leading-tight">ROUTING</span>
              <span className="text-label-caps text-text font-semibold">Turnkey SLA</span>
            </div>
          </div>
        </div>
      </div>

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
              <span className="px-1.5 py-0.2 rounded bg-surface text-[10px] font-mono">{cat.count}</span>
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
            onChat={() => navigate("/messages")}
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
              <img src={galleryImages[galleryIndex]} alt="" className="w-full h-full object-contain" />
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
              {galleryImages.map((img, i) => (
                <button key={i} onClick={() => setGalleryIndex(i)} className={`w-16 h-10 rounded overflow-hidden border-2 ${i === galleryIndex ? "border-gold" : "border-transparent"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
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
  const images = provider.images || [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
  ];

  return (
    <Card className="flex flex-col justify-between p-5 hover:border-gold/60 transition-colors group">
      <div className="flex flex-col gap-3.5">
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
        <p className="text-sm text-white/70 line-clamp-2">{provider.description || `${provider.kind || "Infrastructure"} listing by ${provider.provider_name || "provider"}`}</p>
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