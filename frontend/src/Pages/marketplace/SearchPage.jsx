import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button, Card, Pill, Input, SkeletonCard, EmptyState } from "../../components/ui";
import { searchMarketplaceApi, listMarketplaceProvidersApi, createMarketplaceOrderApi, createDealApi, startProviderConversationApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const SEARCH_CATEGORIES = [
  { id: "all", label: "All infrastructure" },
  { id: "compute", label: "AI compute and GPUs" },
  { id: "satellites", label: "Satellites and communications" },
  { id: "power", label: "Power and generators" },
  { id: "excavation", label: "Excavation and earthmoving" },
  { id: "transport", label: "Transport and logistics" },
  { id: "containers", label: "Containers and edge" },
  { id: "solar", label: "Solar and renewable" },
];

const CATEGORY_TERMS = {
  compute: ["compute", "gpu", "server", "datacenter", "data center"],
  satellites: ["satellite", "communications", "comms"],
  power: ["power", "generator", "solar"],
  excavation: ["excavat", "earthmoving", "machinery"],
  transport: ["truck", "transport", "logistics"],
  containers: ["container", "edge"],
  solar: ["solar", "renewable"],
};

function getItems(response) {
  const items = response?.items || response?.results || response?.providers || response?.data || response;
  return Array.isArray(items) ? items : [];
}

export default function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [sortMode, setSortMode] = useState("relevance");
  const [orderingId, setOrderingId] = useState(null);
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [error, setError] = useState("");
  const searchForm = useForm({ defaultValues: { query: new URLSearchParams(location.search).get("q") || "" } });
  const query = searchForm.watch("query");



  useEffect(() => {
    let cancelled = false;
    async function loadProviders() {
      try {
        const response = await listMarketplaceProvidersApi({ limit: 100 });
        if (!cancelled) setProviders(getItems(response));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.detail || err.message || "We could not load providers.");
      } finally {
        if (!cancelled) setProvidersLoading(false);
      }
    }
    loadProviders();
    return () => { cancelled = true; };
  }, []);

  const filterByCategory = (items, category) => {
    if (category === "all") return items;
    const terms = CATEGORY_TERMS[category] || [category];
    return items.filter((item) => {
      const value = (String(item.category || "") + " " + String(item.name || "")).toLowerCase();
      return terms.some((term) => value.includes(term));
    });
  };

  const runSearch = async (searchTerm = query, category = activeCategory) => {
    setSearchLoading(true);
    setHasSearched(true);
    setError("");
    try {
      let items = providers;
      if (searchTerm.trim()) {
        const response = await searchMarketplaceApi(searchTerm.trim());
        items = getItems(response);
      }
      setResults(filterByCategory(items, category));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const initialQuery = new URLSearchParams(location.search).get("q") || "";
    searchForm.setValue("query", initialQuery);
    if (initialQuery && providers.length && !hasSearched) {
      setHasSearched(true);
      runSearch(initialQuery, activeCategory);
    } else if (!initialQuery && !hasSearched) {
      setResults([]);
    }
  }, [location.search, providers, hasSearched]);

  const handleSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    navigate({ pathname: "/search", search: params.toString() ? "?" + params.toString() : "" }, { replace: true });
    runSearch(query, activeCategory);
  };

  const handleCategory = (category) => {
    setActiveCategory(category);
    runSearch(query, category);
  };

  const handleChat = async (result) => {
    if (!user) {
      navigate("/login?redirect=" + encodeURIComponent("/messages"));
      return;
    }
    try {
      const conversation = await startProviderConversationApi(result.provider_id);
      navigate("/messages?conversation=" + conversation.id);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to start a conversation.");
    }
  };

  const handleOrder = async (result) => {
    if (!user) {
      navigate("/login?redirect=" + encodeURIComponent("/listings/" + result.id));
      return;
    }
    if (orderingId) return;
    setOrderingId(result.id);
    setError("");
    try {
      const order = await createMarketplaceOrderApi({
        asset_id: result.id,
        allocation: "Requested through search",
        lease_amount: result.price_monthly,
      });
      const deal = await createDealApi({ order_id: order.id, payment_method: "visa", amount: result.price_monthly || 0 });
      navigate("/checkout/" + deal.id);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to start this order.");
    } finally {
      setOrderingId(null);
    }
  };

  const sortedResults = useMemo(() => [...results].sort((a, b) => {
    if (sortMode === "price_asc") return Number(a.price_monthly || 0) - Number(b.price_monthly || 0);
    if (sortMode === "price_desc") return Number(b.price_monthly || 0) - Number(a.price_monthly || 0);
    return 0;
  }), [results, sortMode]);

  const popularSearches = ["GPU compute", "Datacenter", "Excavator lease", "Satellite services"];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Marketplace search</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-text sm:text-4xl">Search for the right infrastructure.</h1>
        <p className="text-sm leading-6 text-white/70 sm:text-base">Search by asset, category or provider. Narrow your results and compare available listings.</p>
      </header>

      <section className="space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <Input
            aria-label="Search infrastructure"
            placeholder="What does your business need?"
            className="min-h-12 text-base"
            {...searchForm.register("query")}
          />
          <Button type="submit" disabled={searchLoading} className="shrink-0 sm:min-w-32">{searchLoading ? "Searching..." : "Search"}</Button>
        </form>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-white/60">Popular searches</span>
          {popularSearches.map((term) => (
            <button key={term} type="button" onClick={() => { searchForm.setValue("query", term); navigate("/search?q=" + encodeURIComponent(term), { replace: true }); runSearch(term, activeCategory); }}
              className="rounded-lg bg-surface px-3 py-2 text-text transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-gold">{term}</button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-serif text-xl font-semibold text-text">Categories</h2>
          <p className="mt-1 text-sm text-white/60">Filter results by the type of infrastructure.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {SEARCH_CATEGORIES.map((category) => {
            const active = activeCategory === category.id;
            const count = category.id === "all" ? providers.length : filterByCategory(providers, category.id).length;
            return (
              <button key={category.id} type="button" onClick={() => handleCategory(category.id)} aria-pressed={active}
                className={"min-h-10 shrink-0 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold " + (active ? "bg-gold text-bg" : "bg-surface text-text hover:bg-surface-2")}>
                {category.label}<span className={"ml-2 text-xs " + (active ? "text-bg/70" : "text-white/50")}>{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {error && <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

      {hasSearched ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-text">Search results</h2>
              <p className="mt-1 text-sm text-white/60">{results.length} matching {results.length === 1 ? "listing" : "listings"}</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <span>Sort by</span>
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} className="alq-input min-h-10 w-auto">
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </label>
          </div>
          {searchLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{[...Array(6)].map((_, index) => <SkeletonCard key={index} className="p-5" />)}</div>
          ) : sortedResults.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {sortedResults.map((result) => <SearchResultCard key={result.id} result={result} ordering={orderingId === result.id}
                onChat={() => handleChat(result)} onOrder={() => handleOrder(result)} onView={() => navigate("/listings/" + result.id)} />)}
            </div>
          ) : (
            <EmptyState title="No matching listings" description="Try a different search or choose another category." actionLabel="Clear search" onAction={() => { searchForm.setValue("query", ""); setActiveCategory("all"); setResults([]); setHasSearched(false); navigate("/search", { replace: true }); }} />
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-text">Featured providers</h2>
            <p className="mt-1 text-sm text-white/60">Explore providers and their available infrastructure.</p>
          </div>
          {providersLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
              {[0, 1, 2, 3].map((item) => <SkeletonCard key={item} className="p-5" />)}
            </div>
          ) : providers.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {providers.slice(0, 8).map((provider) => <FeaturedProviderCard key={provider.id} provider={provider} onView={() => navigate("/listings/" + provider.id)} />)}
            </div>
          ) : (
            <EmptyState title="No providers to show yet" description="New provider listings will appear here when they become available." />
          )}
        </section>
      )}
    </main>
  );
}

function SearchResultCard({ result, onChat, onOrder, onView, ordering }) {
  const available = String(result.status || "available").toLowerCase() === "available";
  return (
    <Card className="flex h-full flex-col gap-4 p-5 transition-colors hover:border-gold/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-gold">{result.category || result.kind || "Infrastructure"}</p>
          <h3 className="mt-1 font-serif text-lg font-semibold text-text">{result.name || "Infrastructure listing"}</h3>
          <p className="mt-1 text-sm text-white/70">{result.provider_name || "Infrastructure provider"}</p>
        </div>
        <Pill variant={available ? "gold" : "white"} className="shrink-0 capitalize">{result.status || "Available"}</Pill>
      </div>
      <div className="flex items-center gap-2 text-sm text-white/70"><MapPin size={14} className="shrink-0 text-gold" /><span>{result.provider_location || "Location not provided"}</span></div>
      <p className="line-clamp-2 min-h-12 text-sm leading-6 text-white/80">{result.description || "Contact the provider for more information."}</p>
      <div className="mt-auto border-t border-border pt-4">
        <p className="text-xs text-white/60">Monthly price</p>
        <p className="mt-1 font-serif text-xl font-semibold text-gold">{result.price_monthly != null ? "$" + Number(result.price_monthly).toLocaleString() + " / month" : "Price on request"}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" size="sm" onClick={onView}>View details</Button>
        <Button size="sm" onClick={onOrder} disabled={ordering || !available || !(Number(result.price_monthly) > 0)}>{ordering ? "Starting..." : "Order"}</Button>
      </div>
      <Button variant="ghost" size="sm" onClick={onChat}>Contact provider</Button>
    </Card>
  );
}

function FeaturedProviderCard({ provider, onView }) {
  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold/10 font-serif text-sm font-semibold text-gold">
          {(provider.name || provider.provider_name || "AL").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-medium text-text">{provider.name || provider.provider_name || "Infrastructure provider"}</h3>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-white/60"><MapPin size={12} className="shrink-0" />{provider.location || provider.provider_location || "Location not provided"}</p>
        </div>
      </div>
      <p className="line-clamp-2 text-sm leading-5 text-white/70">{provider.description || "Infrastructure provider"}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <Pill variant="white">{provider.category || provider.kind || "Provider"}</Pill>
        <Button size="sm" variant="ghost" onClick={onView}>View listings</Button>
      </div>
    </Card>
  );
}
