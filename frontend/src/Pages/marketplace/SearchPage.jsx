import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Search, ChevronRight, MapPin, MessageSquare, ShoppingCart } from "lucide-react";
import { Button, Card, Pill, Input, Skeleton, SkeletonCard, SkeletonText } from "../../components/ui";
import { searchMarketplaceApi, listMarketplaceProvidersApi, createMarketplaceOrderApi, createDealApi, startProviderConversationApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const SEARCH_CATEGORIES = [
  { id: "all", label: "All Infrastructure", icon: "LayoutDashboard" },
  { id: "compute", label: "AI Compute / GPUs", icon: "Cpu" },
  { id: "satellites", label: "Satellites / Comms", icon: "Satellite" },
  { id: "power", label: "Power / Generators", icon: "Zap" },
  { id: "excavation", label: "Excavation / Earthmoving", icon: "Box" },
  { id: "transport", label: "Transport / Logistics", icon: "Truck" },
  { id: "containers", label: "Containers / Edge DC", icon: "Package" },
  { id: "solar", label: "Solar / Renewable", icon: "Sun" },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [sortMode, setSortMode] = useState("relevance");
  const [orderingId, setOrderingId] = useState(null);
  const [providers, setProviders] = useState([]);\n  const [providersLoading, setProvidersLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [error, setError] = useState(null);

  const searchForm = useForm({ defaultValues: { query: "" } });
  const watchQuery = searchForm.watch("query");

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await listMarketplaceProvidersApi({ limit: 100 });
        setProviders(res.items || res.providers || []);
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    }
    loadCategories();
  }, []);

  const categoryTerms = {
    compute: ["compute", "gpu", "server", "datacenter", "data center"],
    satellites: ["satellite", "communications", "comms"],
    power: ["power", "generator", "solar"],
    excavation: ["excavat", "earthmoving", "machinery"],
    transport: ["truck", "transport", "logistics"],
    containers: ["container", "edge"],
    solar: ["solar", "renewable"],
  };

  const filterByCategory = (items, category) => category === "all"
    ? items
    : items.filter(item => (categoryTerms[category] || [category]).some(term => ((item.category || "") + " " + (item.name || "")).toLowerCase().includes(term)));

  const runSearch = async (query = watchQuery, category = activeCategory) => {
    setSearchLoading(true);
    setHasSearched(true);
    setError(null);
    try {
      let items = providers;
      if (query.trim()) {
        const searchResponse = await searchMarketplaceApi(query);
        items = searchResponse.items || searchResponse.results || [];
      }
      setResults(filterByCategory(items, category));
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Search failed.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    runSearch(watchQuery, activeCategory);
  };

  const handleCategory = (category) => {
    setActiveCategory(category);
    runSearch("", category);
  };

  const handleChat = async (result) => {
    if (!user) { navigate(`/login?redirect=${encodeURIComponent("/messages")}`); return; }
    try {
      const conversation = await startProviderConversationApi(result.provider_id);
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (e) { setError(e.response?.data?.detail || e.message || "Unable to start conversation."); }
  };

  const handleOrder = async (result) => {
    if (!user) { navigate(`/login?redirect=${encodeURIComponent(`/listings/${result.id}`)}`); return; }
    if (orderingId) return;
    setOrderingId(result.id);
    try {
      const order = await createMarketplaceOrderApi({ asset_id: result.id, allocation: "Requested through search", lease_amount: result.price_monthly });
      const deal = await createDealApi({ order_id: order.id, payment_method: "visa", amount: result.price_monthly || 0 });
      navigate(`/checkout/${deal.id}`);
    } catch (e) { setError(e.response?.data?.detail || e.message || "Unable to start this order."); }
    finally { setOrderingId(null); }
  };

  const sortedResults = [...results].sort((a, b) => {
    if (sortMode === "price_asc") return Number(a.price_monthly || 0) - Number(b.price_monthly || 0);
    if (sortMode === "price_desc") return Number(b.price_monthly || 0) - Number(a.price_monthly || 0);
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Hero Search */}
      <div className="text-center py-12 lg:py-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border mb-6">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
          <span className="text-label-caps text-white/60 uppercase tracking-widest">GLOBAL INFRASTRUCTURE SEARCH</span>
        </div>
        <h1 className="font-serif text-4xl lg:text-5xl font-semibold text-text tracking-tight mb-4">
          Find the infrastructure your venture needs
        </h1>
        <p className="text-white/70 max-w-2xl mx-auto mb-8 text-lg">Search across verified providers for compute, power, transport, and heavy machinery. Filter by category, location, and specs.</p>

        <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
              <Input
                placeholder="Describe your startup's infrastructure needs..."
                className="pl-12 pr-4 py-4 text-lg lg:text-xl"
                {...searchForm.register("query")}
              />
            </div>
            <Button type="submit" disabled={searchLoading} className="h-14 px-8 text-lg shrink-0">
              {searchLoading ? "Searching..." : "Search"}
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-sm text-white/60">
            <span>Popular:</span>
            <button type="button" onClick={() => { searchForm.setValue("query", "64x H100 cluster"); runSearch("64x H100 cluster", activeCategory); }} className="text-gold hover:underline mx-1">H100 Clusters</button>
            <span className="text-border">·</span>
            <button type="button" onClick={() => { searchForm.setValue("query", "Tier-3 datacenter"); runSearch("Tier-3 datacenter", activeCategory); }} className="text-gold hover:underline mx-1">Tier-3 DC</button>
            <span className="text-border">·</span>
            <button type="button" onClick={() => { searchForm.setValue("query", "Excavator lease"); runSearch("Excavator lease", activeCategory); }} className="text-gold hover:underline mx-1">Excavators</button>
            <span className="text-border">·</span>
            <button type="button" onClick={() => { searchForm.setValue("query", "Satellite downlink"); runSearch("Satellite downlink", activeCategory); }} className="text-gold hover:underline mx-1">Satellite</button>
          </div>
        </form>
      </div>

      {/* Category Grid */}
      <div className="mb-8">
        <h2 className="font-serif text-xl font-semibold text-text mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          {SEARCH_CATEGORIES.map(cat => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "primary" : "ghost"}
              className="h-24 flex flex-col items-center justify-center gap-2 text-left px-4"
              onClick={() => { searchForm.setValue("query", ""); handleCategory(cat.id); }}
            >
              <span className="text-sm font-medium">{cat.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      {/* Results */}
      {hasSearched || watchQuery || searchLoading ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold text-text">Results{results.length ? ` (${results.length})` : ""}</h2>
            <div className="flex items-center gap-2">
              <Button variant={sortMode === "relevance" ? "primary" : "ghost"} size="sm" onClick={() => setSortMode("relevance")}>Relevance</Button>
              <Button variant={sortMode === "price_asc" ? "primary" : "ghost"} size="sm" onClick={() => setSortMode("price_asc")}>Price: Low to High</Button>
              <Button variant={sortMode === "price_desc" ? "primary" : "ghost"} size="sm" onClick={() => setSortMode("price_desc")}>Price: High to Low</Button>
            </div>
          </div>

          {searchLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} className="p-5" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/70 mb-4">No results found for "{watchQuery}"</p>
              <Button variant="ghost" onClick={() => { setActiveCategory("all"); searchForm.setValue("query", ""); setHasSearched(false); setResults([]); }}>Clear filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedResults.map(result => (
                <SearchResultCard key={result.id} result={result} onChat={() => handleChat(result)} onOrder={() => handleOrder(result)} ordering={orderingId === result.id} onView={() => navigate(`/listings/${result.id}`)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-white/60">Enter a search query or browse categories above to find infrastructure.</p>
        </div>
      )}

      {/* Featured Providers */}
      {!watchQuery && !searchLoading && (
        <div>
          <h2 className="font-serif text-xl font-semibold text-text mb-4">Featured Providers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {providers.slice(0, 4).map(p => (
              <FeaturedProviderCard key={p.id} provider={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ result, onChat, onOrder, onView, ordering }) {
  return (
    <Card className="flex flex-col justify-between p-5 hover:border-gold/60 transition-colors">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-surface-2 border border-gold/40 text-gold font-serif font-bold text-lg flex items-center justify-center shrink-0">{(result.provider_name || "Provider").slice(0,2).toUpperCase()}</div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5"><h3 className="font-serif text-base font-semibold text-text truncate">{result.provider_name || "Infrastructure provider"}</h3>{result.provider_verified && <span className="text-gold" aria-label="Verified">✓</span>}</div>
              <div className="flex items-center gap-1 text-white/60 text-sm"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{result.provider_location || "Location not provided"}</span></div>
            </div>
          </div>
          <Pill variant="gold" className="shrink-0">{result.status || "available"}</Pill>
        </div>
        <p className="text-sm text-white/70 line-clamp-2">{result.description || "No description provided."}</p>
        <div className="text-xs text-white/60">{result.category} · {result.kind}</div>
        <div className="font-serif text-xl font-semibold text-gold">{result.price_monthly != null ? "$" + Number(result.price_monthly).toLocaleString() + "/mo" : "Price on request"}</div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-border">
        <Button variant="ghost" size="sm" className="py-2 px-1" onClick={onChat}><MessageSquare className="w-4 h-4 mr-1" /><span className="truncate">Chat</span></Button>
        <Button size="sm" className="py-2 px-1" onClick={onOrder} disabled={ordering || result.status !== "available" || !(Number(result.price_monthly) > 0)}><ShoppingCart className="w-4 h-4 mr-1" /><span className="truncate">{ordering ? "Starting..." : "Order"}</span></Button>
        <Button variant="ghost" size="sm" className="py-2 px-1" onClick={onView}><span className="truncate">View</span><ChevronRight className="w-4 h-4 ml-1" /></Button>
      </div>
    </Card>
  );
}

function FeaturedProviderCard({ provider }) {
  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-surface-2 border border-gold/40 text-gold font-serif font-bold text-lg flex items-center justify-center">
          {(provider.name || provider.provider_name)?.slice(0,2).toUpperCase() || "SC"}
        </div>
        <div>
          <h3 className="font-serif text-base font-semibold text-text">{provider.name || provider.provider_name}</h3>
          <div className="flex items-center gap-1 text-white/60 text-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span>{provider.location || provider.provider_location}</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-white/70 line-clamp-2 mb-3">{provider.description || "Verified infrastructure listing"}</p>
      <div className="flex items-center gap-2 mt-auto">
        <Pill variant="gold">{provider.status || "available"}</Pill>
        <span className="text-xs font-mono text-white/60">{provider.category || provider.kind || "Infrastructure"}</span>
      </div>
    </Card>
  );
}