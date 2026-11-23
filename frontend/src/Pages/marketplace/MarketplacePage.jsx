import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, MapPin, ShieldCheck, ChevronLeft, ChevronRight, X, Box, Package
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Button, Card, Pill, Skeleton, SkeletonText } from "../../components/ui";
import {
  listMarketplaceListingsApi,
  createMarketplaceCheckoutApi,
  startProviderConversationApi
} from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  { id: "all", label: "All infrastructure" },
  { id: "compute", label: "AI compute" },
  { id: "satellites", label: "Satellites" },
  { id: "power", label: "Power and generators" },
  { id: "excavation", label: "Excavation" },
  { id: "transport", label: "Transport" },
  { id: "containers", label: "Containers" },
  { id: "solar", label: "Solar" },
];

const CATEGORY_TERMS = {
  compute: ["compute", "gpu", "server", "datacenter", "data center"],
  satellites: ["satellite", "communications", "comms"],
  power: ["power", "generator"],
  excavation: ["excavat", "earthmoving", "machinery"],
  transport: ["truck", "transport", "logistics"],
  containers: ["container", "edge"],
  solar: ["solar", "renewable"],
};

function MarketplaceSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8" aria-label="Loading marketplace" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-10 w-2/3 max-w-xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => <Skeleton key={item} className="h-20 rounded-xl" />)}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl sm:w-36" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {CATEGORIES.slice(0, 6).map((category) => <Skeleton key={category.id} className="h-9 w-28 shrink-0 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <Card key={item} className="space-y-4 p-4">
            <Skeleton className="aspect-[16/9] w-full rounded-lg" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
            </div>
            <SkeletonText lines={2} />
            <Skeleton className="h-6 w-1/3" />
            <div className="flex gap-2 border-t border-border pt-4"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 flex-1" /></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [providers, setProviders] = useState([]);
  const [orderingId, setOrderingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [filters, setFilters] = useState({ location: "", kind: "all", minPrice: "", maxPrice: "" });
  const [sortMode, setSortMode] = useState("featured");
  const galleryTouchStart = useRef(null);
  const searchForm = useForm({ defaultValues: { query: "" } });
  const query = searchForm.watch("query");

  useEffect(() => {
    let active = true;
    async function loadListings() {
      setLoading(true);
      setError("");
      try {
        const response = await listMarketplaceListingsApi({ limit: 50 });
        const items = response.items || response.data?.items || response.providers || response.data || response || [];
        if (active) setProviders(Array.isArray(items) ? items : []);
      } catch (exception) {
        if (active) setError(exception.response?.data?.detail || exception.message || "Unable to load marketplace listings.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadListings();
    return () => { active = false; };
  }, []);

  const filteredProviders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const items = providers.filter((provider) => {
      const categoryMatch = activeCategory === "all" ||
        (CATEGORY_TERMS[activeCategory] || [activeCategory]).some((term) =>
          String(provider.category || "").toLowerCase().includes(term) ||
          String(provider.name || provider.provider_name || "").toLowerCase().includes(term)
        );
      const searchMatch = !normalizedQuery ||
        [provider.name, provider.provider_name, provider.category, provider.description, provider.provider_location]
          .some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
      const locationMatch = !filters.location ||
        String(provider.provider_location || provider.location || "").toLowerCase().includes(filters.location.toLowerCase());
      const kindMatch = filters.kind === "all" || provider.kind === filters.kind;
      const price = Number(provider.price_monthly || 0);
      const minMatch = filters.minPrice === "" || price >= Number(filters.minPrice);
      const maxMatch = filters.maxPrice === "" || price <= Number(filters.maxPrice);
      return categoryMatch && searchMatch && locationMatch && kindMatch && minMatch && maxMatch;
    });

    return [...items].sort((a, b) => {
      if (sortMode === "price_low") return Number(a.price_monthly || 0) - Number(b.price_monthly || 0);
      if (sortMode === "price_high") return Number(b.price_monthly || 0) - Number(a.price_monthly || 0);
      if (sortMode === "name") return String(a.name || a.provider_name || "").localeCompare(String(b.name || b.provider_name || ""));
      return 0;
    });
  }, [providers, activeCategory, query, filters, sortMode]);

  const handleOrder = async (listing) => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/listings/${listing.id}`)}`);
      return;
    }
    if (orderingId) return;
    setOrderingId(listing.id);
    setError("");
    try {
      const checkout = await createMarketplaceCheckoutApi({
        asset_id: listing.id,
        allocation: "Requested through marketplace",
        payment_method: "visa",
      });
      if (!checkout?.deal?.id) throw new Error("Checkout could not be started. Please try again.");
      navigate(`/checkout/${checkout.deal.id}`);
    } catch (exception) {
      setError(exception.response?.data?.detail || exception.message || "Unable to start this order.");
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
    } catch (exception) {
      setError(exception.response?.data?.detail || exception.message || "Unable to start a conversation.");
    }
  };

  const openGallery = (images, index = 0) => {
    setGalleryImages(images);
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const resetFilters = () => {
    setFilters({ location: "", kind: "all", minPrice: "", maxPrice: "" });
    searchForm.setValue("query", "");
    setActiveCategory("all");
    setSortMode("featured");
  };

  const handleGalleryKeyDown = (event) => {
    if (event.key === "Escape") setGalleryOpen(false);
    if (event.key === "ArrowRight" && galleryImages.length > 1) setGalleryIndex((index) => (index + 1) % galleryImages.length);
    if (event.key === "ArrowLeft" && galleryImages.length > 1) setGalleryIndex((index) => (index - 1 + galleryImages.length) % galleryImages.length);
  };

  if (loading) return <MarketplaceSkeleton />;

  const verifiedCount = providers.filter((provider) => provider.verified || provider.provider_verified).length;
  const physicalCount = providers.filter((provider) => provider.kind === "physical").length;
  const digitalCount = providers.filter((provider) => provider.kind === "digital").length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-5">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Almeriq marketplace</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">Infrastructure for your next move.</h1>
          <p className="max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
            Find the equipment, compute and infrastructure your business needs. Compare providers, review listings and start a conversation.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MarketplaceStat label="Active listings" value={providers.length} detail="Available across the marketplace" />
          <MarketplaceStat label="Verified providers" value={verifiedCount} detail="Provider profiles marked as verified" />
          <MarketplaceStat label="Infrastructure types" value={`${physicalCount} physical / ${digitalCount} digital`} detail="Across physical and digital assets" />
        </div>
      </header>

      <section className="space-y-4" aria-label="Search and filter listings">
        <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" aria-hidden="true" />
            <input
              {...searchForm.register("query")}
              aria-label="Search infrastructure listings"
              placeholder="Search by asset, category, provider or location"
              className="alq-input h-12 pl-11"
            />
          </div>
          <Button type="button" variant="ghost" className="h-12 shrink-0" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}>
            {filtersOpen ? "Hide filters" : "Filters"}
          </Button>
        </form>

        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Marketplace categories">
          {CATEGORIES.map((category) => {
            const count = category.id === "all" ? providers.length : providers.filter((provider) =>
              (CATEGORY_TERMS[category.id] || [category.id]).some((term) => String(provider.category || "").toLowerCase().includes(term))
            ).length;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={activeCategory === category.id}
                className={`min-h-10 shrink-0 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${activeCategory === category.id ? "bg-gold text-bg" : "bg-surface text-white hover:bg-surface-2"}`}
              >
                {category.label}<span className="ml-2 font-mono text-xs opacity-70">{count}</span>
              </button>
            );
          })}
        </nav>

        {filtersOpen && (
          <div className="grid grid-cols-1 gap-4 rounded-xl bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-2 text-sm text-white">
              <span>Location</span>
              <input value={filters.location} onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))} className="alq-input" placeholder="Enter a location" />
            </label>
            <label className="space-y-2 text-sm text-white">
              <span>Infrastructure type</span>
              <select value={filters.kind} onChange={(event) => setFilters((current) => ({ ...current, kind: event.target.value }))} className="alq-input">
                <option value="all">All types</option><option value="physical">Physical</option><option value="digital">Digital</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-white">
              <span>Minimum monthly price</span>
              <input type="number" min="0" value={filters.minPrice} onChange={(event) => setFilters((current) => ({ ...current, minPrice: event.target.value }))} className="alq-input" placeholder="No minimum" />
            </label>
            <label className="space-y-2 text-sm text-white">
              <span>Maximum monthly price</span>
              <input type="number" min="0" value={filters.maxPrice} onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))} className="alq-input" placeholder="No maximum" />
            </label>
            <div className="flex items-end sm:col-span-2 lg:col-span-4">
              <Button variant="ghost" onClick={resetFilters}>Reset filters</Button>
            </div>
          </div>
        )}
      </section>

      {error && <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Explore listings</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-white">Available infrastructure</h2>
            <p className="mt-1 text-sm text-white/70">{filteredProviders.length} {filteredProviders.length === 1 ? "listing" : "listings"} match your filters.</p>
          </div>
          <label className="flex items-center gap-3 text-sm text-white">
            <span>Sort by</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} className="alq-input w-auto min-w-40">
              <option value="featured">Featured</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option><option value="name">Provider name</option>
            </select>
          </label>
        </div>

        {filteredProviders.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onChat={() => handleChat(provider)}
                onOrder={() => handleOrder(provider)}
                ordering={orderingId === provider.id}
                onView={() => navigate(`/listings/${provider.id}`)}
                onImageClick={openGallery}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-surface px-6 py-14 text-center">
            <Box className="mx-auto h-8 w-8 text-gold" aria-hidden="true" />
            <h3 className="mt-4 font-serif text-xl text-white">No listings found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/70">Try a different search or clear some filters to see more infrastructure.</p>
            <Button variant="ghost" className="mt-5" onClick={resetFilters}>Clear filters</Button>
          </div>
        )}
      </section>

      {galleryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Listing media gallery"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setGalleryOpen(false)}
          onKeyDown={handleGalleryKeyDown}
          tabIndex={-1}
        >
          <div className="relative w-full max-w-5xl space-y-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between text-sm text-white">
              <span>{galleryIndex + 1} of {galleryImages.length}</span>
              <button type="button" onClick={() => setGalleryOpen(false)} className="rounded-lg p-2 text-white hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-gold" aria-label="Close gallery"><X size={20} /></button>
            </div>
            <div
              className="flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-surface"
              onTouchStart={(event) => { galleryTouchStart.current = event.touches?.[0]?.clientX ?? null; }}
              onTouchEnd={(event) => {
                if (galleryTouchStart.current == null || galleryImages.length < 2) return;
                const delta = event.changedTouches?.[0]?.clientX - galleryTouchStart.current;
                if (Math.abs(delta) > 45) setGalleryIndex((index) => (index + (delta < 0 ? 1 : -1) + galleryImages.length) % galleryImages.length);
                galleryTouchStart.current = null;
              }}
            >
              {galleryImages[galleryIndex]?.resource_type === "video"
                ? <video src={galleryImages[galleryIndex].url} controls className="h-full w-full object-contain" />
                : <img src={galleryImages[galleryIndex]?.url} alt="Listing media" className="h-full w-full object-contain" />}
            </div>
            {galleryImages.length > 1 && (
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setGalleryIndex((index) => (index - 1 + galleryImages.length) % galleryImages.length)} className="rounded-lg bg-surface p-3 text-white hover:bg-surface-2" aria-label="Previous image"><ChevronLeft size={20} /></button>
                <div className="flex gap-2 overflow-x-auto">
                  {galleryImages.map((item, index) => (
                    <button key={item.public_id || index} type="button" onClick={() => setGalleryIndex(index)} className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${index === galleryIndex ? "border-gold" : "border-border"}`} aria-label={`View media ${index + 1}`}>
                      {item.resource_type === "video" ? <video src={item.url} className="h-full w-full object-cover" /> : <img src={item.url} alt="" className="h-full w-full object-cover" />}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setGalleryIndex((index) => (index + 1) % galleryImages.length)} className="rounded-lg bg-surface p-3 text-white hover:bg-surface-2" aria-label="Next image"><ChevronRight size={20} /></button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function MarketplaceStat({ label, value, detail }) {
  return (
    <Card className="space-y-2 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{label}</p>
      <p className="font-serif text-2xl font-semibold text-gold">{value}</p>
      <p className="text-xs text-white/70">{detail}</p>
    </Card>
  );
}

function ProviderCard({ provider, onChat, onOrder, onView, ordering, onImageClick }) {
  const media = provider.media || [];
  const cover = media[0];
  const name = provider.name || provider.provider_name || "Infrastructure provider";
  const location = provider.provider_location || provider.location || "Location not provided";
  const available = String(provider.status || "available").toLowerCase() === "available";
  const canOrder = available && Number(provider.price_monthly) > 0;

  return (
    <Card className="flex h-full flex-col p-4 transition-colors hover:bg-surface-2">
      <button
        type="button"
        className="relative mb-4 flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-lg bg-surface-2 text-left"
        onClick={() => cover && onImageClick(media, 0)}
        disabled={!cover}
        aria-label={cover ? "Open listing media gallery" : "No listing media available"}
      >
        {cover ? (
          cover.resource_type === "video"
            ? <video src={cover.url} className="h-full w-full object-cover" muted playsInline />
            : <img src={cover.url} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/70"><Box className="h-8 w-8 text-gold" /><span className="text-xs">No listing image</span></div>
        )}
        {media.length > 1 && <span className="absolute bottom-2 right-2 rounded-md bg-bg/90 px-2 py-1 text-xs text-white">{media.length} files</span>}
      </button>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-serif text-lg font-semibold text-white">{name}</h3>
              {(provider.verified || provider.provider_verified) && <ShieldCheck className="h-4 w-4 shrink-0 text-gold" aria-label="Verified provider" />}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70"><MapPin size={14} aria-hidden="true" /><span className="truncate">{location}</span></p>
          </div>
          <Pill variant="gold" className="shrink-0">{provider.status || "Available"}</Pill>
        </div>

        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-white/80">{provider.description || "The provider has not added a description yet."}</p>

        <div className="flex flex-wrap gap-2">
          {(provider.tags || [provider.category, provider.kind]).filter(Boolean).slice(0, 3).map((tag, index) => <Pill key={index} variant="white">{tag}</Pill>)}
        </div>

        <div className="mt-auto border-t border-border pt-4">
          <p className="text-xs text-white/70">Monthly price</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-gold">{provider.price_monthly != null ? `$${Number(provider.price_monthly).toLocaleString()}` : "Price on request"}<span className="font-sans text-sm font-normal text-white/70">{provider.price_monthly != null ? " / month" : ""}</span></p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" size="sm" className="px-2" onClick={onView}>View</Button>
        <Button type="button" variant="ghost" size="sm" className="px-2" onClick={onChat}>Contact</Button>
        <Button type="button" size="sm" className="px-2" onClick={onOrder} disabled={!canOrder || ordering}>{ordering ? "Starting" : "Order"}</Button>
      </div>
    </Card>
  );
}
