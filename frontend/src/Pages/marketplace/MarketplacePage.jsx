import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, MapPin, Search, ShieldCheck, SlidersHorizontal, Image as ImageIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button, Card, Pill, Skeleton, SkeletonCard, SkeletonText, EmptyState } from "../../components/ui";
import { listMarketplaceListingsApi, createMarketplaceCheckoutApi, startProviderConversationApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  { id: "all", label: "All listings" },
  { id: "trucks", label: "Transport" },
  { id: "satellites", label: "Satellite and communications" },
  { id: "generators", label: "Power and generators" },
  { id: "excavators", label: "Heavy machinery" },
  { id: "containers", label: "Containers and edge" },
  { id: "solar", label: "Solar and renewable" },
];

const CATEGORY_TERMS = {
  trucks: ["truck", "transport", "logistics"],
  satellites: ["satellite", "communications", "comms"],
  generators: ["generator", "power"],
  excavators: ["excavat", "earthmoving", "machinery"],
  containers: ["container", "edge"],
  solar: ["solar", "renewable"],
};

function getListings(response) {
  const items = response?.items || response?.data?.items || response?.providers || response?.data || response;
  return Array.isArray(items) ? items : [];
}

function matchesCategory(listing, category) {
  if (category === "all") return true;
  const terms = CATEGORY_TERMS[category] || [category];
  const value = String(listing.category || "").toLowerCase() + " " + String(listing.name || "").toLowerCase();
  return terms.some((term) => value.includes(term));
}

function formatPrice(value) {
  if (value == null || value === "") return "Price on request";
  return "$" + Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }) + " / month";
}

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [orderingId, setOrderingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryTouchStart = useRef(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ location: "", kind: "all", minPrice: "", maxPrice: "" });
  const searchForm = useForm({ defaultValues: { query: "" } });
  const query = searchForm.watch("query");

  useEffect(() => {
    let cancelled = false;
    async function loadListings() {
      setLoading(true);
      setError("");
      try {
        const response = await listMarketplaceListingsApi({ limit: 50 });
        if (!cancelled) setListings(getListings(response));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.detail || err.message || "We could not load marketplace listings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadListings();
    return () => { cancelled = true; };
  }, []);

  const visibleListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return listings.filter((listing) => {
      const categoryMatch = matchesCategory(listing, activeCategory);
      const searchable = [listing.name, listing.provider_name, listing.category, listing.description, listing.provider_location]
        .map((value) => String(value || "").toLowerCase()).join(" ");
      const queryMatch = !normalizedQuery || searchable.includes(normalizedQuery);
      const locationMatch = !filters.location || String(listing.provider_location || "").toLowerCase().includes(filters.location.toLowerCase());
      const kindMatch = filters.kind === "all" || String(listing.kind || "").toLowerCase() === filters.kind;
      const price = Number(listing.price_monthly || 0);
      const minMatch = filters.minPrice === "" || price >= Number(filters.minPrice);
      const maxMatch = filters.maxPrice === "" || price <= Number(filters.maxPrice);
      return categoryMatch && queryMatch && locationMatch && kindMatch && minMatch && maxMatch;
    });
  }, [listings, activeCategory, query, filters]);

  const activeFilterCount = [filters.location, filters.kind !== "all" ? filters.kind : "", filters.minPrice, filters.maxPrice]
    .filter(Boolean).length;

  const handleOrder = async (listing) => {
    if (!user) {
      navigate("/login?redirect=" + encodeURIComponent("/listings/" + listing.id));
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
      navigate("/checkout/" + checkout.deal.id);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to start this order.");
    } finally {
      setOrderingId(null);
    }
  };

  const handleChat = async (listing) => {
    if (!user) {
      navigate("/login?redirect=" + encodeURIComponent("/messages"));
      return;
    }
    try {
      const conversation = await startProviderConversationApi(listing.provider_id);
      navigate("/messages?conversation=" + conversation.id);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to start a conversation.");
    }
  };

  const openGallery = (images, index = 0) => {
    setGalleryImages(images || []);
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const changeGallery = (direction) => {
    setGalleryIndex((index) => (index + direction + galleryImages.length) % galleryImages.length);
  };

  const handleGalleryTouchStart = (event) => {
    galleryTouchStart.current = event.touches?.[0]?.clientX ?? null;
  };

  const handleGalleryTouchEnd = (event) => {
    if (galleryTouchStart.current == null || galleryImages.length < 2) return;
    const delta = (event.changedTouches?.[0]?.clientX ?? galleryTouchStart.current) - galleryTouchStart.current;
    if (Math.abs(delta) > 45) changeGallery(delta < 0 ? 1 : -1);
    galleryTouchStart.current = null;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <SkeletonText lines={3} className="max-w-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex gap-2 overflow-hidden">{CATEGORIES.map((category) => <Skeleton key={category.id} className="h-10 w-36 shrink-0 rounded-lg" />)}</div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{[...Array(6)].map((_, index) => <SkeletonCard key={index} className="p-5" />)}</div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Almeriq marketplace</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-text sm:text-4xl">Find the infrastructure your business needs.</h1>
          <p className="max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
            Browse equipment, compute, power, transport and other services from infrastructure providers.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold"><ImageIcon size={18} /></div>
            <div>
              <p className="text-xs font-medium text-white/60">Available listings</p>
              <p className="text-xl font-semibold text-text">{listings.length}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold"><ShieldCheck size={18} /></div>
            <div>
              <p className="text-xs font-medium text-white/60">Checkout</p>
              <p className="text-xl font-semibold text-text">Demo flow</p>
            </div>
          </Card>
        </div>
      </header>

      <section aria-label="Search and filter listings" className="space-y-4">
        <form onSubmit={searchForm.handleSubmit(() => {})} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <input {...searchForm.register("query")} aria-label="Search marketplace listings" placeholder="Search by asset, provider or location" className="alq-input min-h-12 w-full pl-10" />
          </div>
          <Button type="button" variant="ghost" onClick={() => setFiltersOpen((open) => !open)} className="shrink-0">
            {filtersOpen ? "Hide filters" : "Filters" + (activeFilterCount ? " (" + activeFilterCount + ")" : "")}
          </Button>
        </form>

        {filtersOpen && (
          <Card className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1.5 text-sm text-text">
              <span className="font-medium">Provider location</span>
              <input value={filters.location} onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))} className="alq-input w-full" placeholder="Enter a location" />
            </label>
            <label className="space-y-1.5 text-sm text-text">
              <span className="font-medium">Asset type</span>
              <select value={filters.kind} onChange={(event) => setFilters((current) => ({ ...current, kind: event.target.value }))} className="alq-input w-full">
                <option value="all">All types</option><option value="physical">Physical</option><option value="digital">Digital</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm text-text">
              <span className="font-medium">Minimum monthly price</span>
              <input type="number" min="0" value={filters.minPrice} onChange={(event) => setFilters((current) => ({ ...current, minPrice: event.target.value }))} className="alq-input w-full" placeholder="No minimum" />
            </label>
            <label className="space-y-1.5 text-sm text-text">
              <span className="font-medium">Maximum monthly price</span>
              <input type="number" min="0" value={filters.maxPrice} onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))} className="alq-input w-full" placeholder="No maximum" />
            </label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2 xl:col-span-4">
              <Button variant="ghost" onClick={() => setFilters({ location: "", kind: "all", minPrice: "", maxPrice: "" })}>Clear filters</Button>
              <p className="text-xs text-white/60">Filters update the listings as you change them.</p>
            </div>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-text">Browse by category</h2>
            <p className="mt-1 text-sm text-white/60">Choose the type of infrastructure you need.</p>
          </div>
          <p className="shrink-0 text-xs text-white/60">{visibleListings.length} results</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((category) => {
            const count = category.id === "all" ? listings.length : listings.filter((listing) => matchesCategory(listing, category.id)).length;
            const active = activeCategory === category.id;
            return (
              <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} aria-pressed={active}
                className={"min-h-10 shrink-0 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold " + (active ? "bg-gold text-bg" : "bg-surface text-text hover:bg-surface-2")}>
                {category.label}<span className={"ml-2 text-xs " + (active ? "text-bg/70" : "text-white/50")}>{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {error && <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-text">Available infrastructure</h2>
            <p className="mt-1 text-sm text-white/60">Compare listings and contact providers directly.</p>
          </div>
          <p className="text-xs text-white/60">{visibleListings.length} {visibleListings.length === 1 ? "listing" : "listings"}</p>
        </div>
        {visibleListings.length ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleListings.map((listing) => (
              <MarketplaceListingCard key={listing.id} listing={listing} ordering={orderingId === listing.id}
                onView={() => navigate("/listings/" + listing.id)} onChat={() => handleChat(listing)} onOrder={() => handleOrder(listing)}
                onImageClick={openGallery} />
            ))}
          </div>
        ) : (
          <EmptyState title="No listings found" description="Try another category or remove some filters to see more infrastructure." actionLabel="Clear all filters" onAction={() => { setActiveCategory("all"); searchForm.setValue("query", ""); setFilters({ location: "", kind: "all", minPrice: "", maxPrice: "" }); }} />
        )}
      </section>

      {galleryOpen && galleryImages.length > 0 && (
        <div role="dialog" aria-modal="true" aria-label="Listing media gallery" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setGalleryOpen(false)} onKeyDown={(event) => { if (event.key === "Escape") setGalleryOpen(false); if (event.key === "ArrowLeft") changeGallery(-1); if (event.key === "ArrowRight") changeGallery(1); }}>
          <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-surface-2" onTouchStart={handleGalleryTouchStart} onTouchEnd={handleGalleryTouchEnd}>
              {galleryImages[galleryIndex]?.resource_type === "video"
                ? <video src={galleryImages[galleryIndex].url} controls className="h-full w-full object-contain" />
                : <img src={galleryImages[galleryIndex]?.url} alt="Listing media" className="h-full w-full object-contain" />}
            </div>
            <button type="button" onClick={() => setGalleryOpen(false)} aria-label="Close gallery" className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text"><X size={18} /></button>
            {galleryImages.length > 1 && (
              <>
                <button type="button" onClick={() => changeGallery(-1)} aria-label="Previous image" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white"><ChevronLeft size={20} /></button>
                <button type="button" onClick={() => changeGallery(1)} aria-label="Next image" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white"><ChevronRight size={20} /></button>
                <p className="mt-3 text-center text-sm text-white/70">{galleryIndex + 1} of {galleryImages.length}</p>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function MarketplaceListingCard({ listing, ordering, onView, onChat, onOrder, onImageClick }) {
  const media = Array.isArray(listing.media) ? listing.media : [];
  const cover = media[0];
  const available = String(listing.status || "available").toLowerCase() === "available";
  const providerName = listing.provider_name || listing.name || "Infrastructure provider";
  const category = listing.category || listing.kind || "Infrastructure";

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-colors hover:border-gold/50">
      <button type="button" onClick={() => media.length && onImageClick(media, 0)} disabled={!media.length}
        aria-label={media.length ? "Open listing images" : "No listing images available"}
        className={"relative aspect-[16/9] w-full overflow-hidden bg-surface-2 text-left " + (media.length ? "cursor-zoom-in" : "cursor-default")}>
        {cover?.resource_type === "video"
          ? <video src={cover.url} muted playsInline className="h-full w-full object-cover" />
          : cover?.url
            ? <img src={cover.url} alt={listing.name || "Infrastructure listing"} className="h-full w-full object-cover" />
            : <div className="flex h-full flex-col items-center justify-center gap-2 text-white/50"><ImageIcon size={24} /><span className="text-xs">No listing image</span></div>}
        {media.length > 1 && <span className="absolute bottom-3 right-3 rounded-md bg-black/75 px-2 py-1 text-xs text-white">{media.length} photos</span>}
      </button>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-gold">{category}</p>
            <h3 className="mt-1 line-clamp-2 font-serif text-lg font-semibold text-text">{listing.name || category}</h3>
          </div>
          <Pill variant={available ? "gold" : "white"} className="shrink-0 capitalize">{listing.status || "Available"}</Pill>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <MapPin size={14} className="shrink-0 text-gold" />
          <span className="truncate">{listing.provider_location || "Location not provided"}</span>
        </div>
        <div className="min-h-[3rem]">
          <p className="line-clamp-2 text-sm leading-6 text-white/80">{listing.description || "Contact the provider for more information about this listing."}</p>
        </div>
        <div className="mt-auto border-t border-border pt-4">
          <p className="text-xs text-white/60">Monthly price</p>
          <p className="mt-1 font-serif text-xl font-semibold text-gold">{formatPrice(listing.price_monthly)}</p>
          <p className="mt-1 text-xs text-white/60">Provided by <span className="text-white/80">{providerName}</span></p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" onClick={onView}>View details</Button>
          <Button size="sm" onClick={onOrder} disabled={ordering || !available || !(Number(listing.price_monthly) > 0)}>{ordering ? "Starting..." : "Order"}</Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onChat} className="w-full">Contact provider</Button>
      </div>
    </Card>
  );
}
