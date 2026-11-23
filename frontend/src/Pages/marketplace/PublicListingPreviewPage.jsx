import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, CheckCircle, Shield, Truck } from "lucide-react";
import { Button, Card, StatusPill, Skeleton, SkeletonText } from "../../components/ui";
import { getMarketplaceListingApi, createMarketplaceCheckoutApi, startProviderConversationApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function PublicListingPreviewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [shareMessage, setShareMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [dealLoading, setDealLoading] = useState(false);

  useEffect(() => {
    async function loadListing() {
      setLoading(true);
      try {
        const listingRes = await getMarketplaceListingApi(id);
        setListing(listingRes.data || listingRes.listing || listingRes);

      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadListing();
  }, [id]);

  const handleOrder = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/listings/${id}`)}`);
      return;
    }
    setDealLoading(true);
    try {
      const checkout = await createMarketplaceCheckoutApi({
        asset_id: Number(id),
        allocation: "Requested through marketplace",
        payment_method: "visa",
      });
      if (!checkout?.deal?.id) {
        throw new Error("Checkout could not be started. Please try again.");
      }
      navigate(`/checkout/${checkout.deal.id}`);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Unable to start this order.");
    } finally {
      setDealLoading(false);
    }
  };

  const media = listing?.media || [];
  const activeMedia = media[galleryIndex];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <SkeletonText lines={3} className="max-w-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <SkeletonText lines={4} />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-center">
        <p className="text-gold">Listing not found</p>
        <Link to="/marketplace" className="text-gold hover:underline mt-4 inline-block">← Back to Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link to="/marketplace" className="text-white/60 hover:text-gold text-sm flex items-center gap-1 mb-2">
            <ChevronLeft className="w-4 h-4" /> Back to Marketplace
          </Link>
          <h1 className="font-serif text-3xl font-semibold text-text leading-tight">{listing.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setShareMessage("Link copied"); } catch { setShareMessage("Copy this page URL from your browser address bar."); } }}>Share</Button>
          <Button onClick={handleOrder} disabled={dealLoading || listing.status !== "available" || !(Number(listing.price_monthly) > 0)}>{dealLoading ? "Starting order..." : Number(listing.price_monthly) > 0 ? "Order now" : "Price unavailable"}</Button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative">
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-surface-2 border border-border">
          {activeMedia?.resource_type === "video"
            ? <video src={activeMedia.url} controls className="w-full h-full object-cover" />
            : activeMedia
              ? <img src={activeMedia.url} alt={listing.name} className="w-full h-full object-cover cursor-zoom-in" onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }} />
              : <div className="flex h-full items-center justify-center text-sm text-white/45">No photos or videos have been added to this listing.</div>}
        </div>
        {media.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {media.map((item, i) => (
              <button key={i} onClick={() => setGalleryIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === galleryIndex ? "bg-gold w-6" : "bg-border hover:bg-gold/50"}`} aria-label={`View image ${i + 1}`} />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Info */}
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-surface border border-gold/40 text-gold-soft font-serif font-bold text-xl flex items-center justify-center shrink-0 shadow-sm">
                {listing.provider_name?.slice(0,2).toUpperCase() || "AL"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-serif text-lg font-semibold text-text">{listing.provider_name || "Infrastructure provider"}</h2>
                  {(listing.provider_verified) && <span className="text-gold" aria-label="Verified">✓</span>}
                  <span className="px-2 py-0.5 rounded bg-surface text-white/60 text-[10px] font-mono tracking-wide">{listing.provider_location || "Location not provided"}</span>
                </div>
                <p className="text-sm text-white/75 mt-1">{listing.description || "Infrastructure provider"}</p>
              </div>
            </div>
          </Card>

          {/* About */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-caps text-white/60 uppercase tracking-wider">ABOUT THIS LISTING</span>
              <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">SPEC 4.2</span>
            </div>
            <p className="text-base text-white/80 leading-relaxed">{listing.description || "No additional listing description provided."}</p>
          </Card>

          {/* Specs */}
          <Card className="p-5">
            <span className="text-label-caps text-white/60 uppercase tracking-wider block mb-4">SPECIFICATIONS</span>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Category", value: listing.category },
                { label: "Type", value: listing.kind },
                { label: "Location", value: listing.provider_location || "Not provided" },
                { label: "Availability", value: listing.status },
              ].map((spec, i) => (
                <div key={i} className="bg-surface border border-border rounded-lg p-3">
                  <span className="text-white/65 block uppercase text-[9px] tracking-wider">{spec.label}</span>
                  <span className="font-semibold text-text font-serif text-sm">{spec.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Pricing & Order */}
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-label-caps text-white/60 uppercase tracking-wider block mb-1">RESERVE RATE</span>
                <div className="font-serif text-2xl font-semibold text-gold">${Number(listing.price_monthly || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span className="text-sm font-sans text-white/60 font-normal">/mo</span></div>
              </div>
              <Button onClick={handleOrder} disabled={dealLoading || listing.status !== "available" || !(Number(listing.price_monthly) > 0)} className="w-full sm:w-auto h-11 px-6">{dealLoading ? "Starting order..." : Number(listing.price_monthly) > 0 ? "Order now" : "Price unavailable"}</Button>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gold font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Provider-uploaded listing</span>
              </div>
              <div className="flex items-center gap-2 text-white/75">
                <Shield className="w-4 h-4" />
                <span>Payment simulation only</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Truck className="w-4 h-4" />
                <span>{media.length} media file(s)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-label-caps text-white/60 uppercase tracking-wider">LISTING STATUS</span>
              <StatusPill status={listing.status?.toLowerCase() || "available"} />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-white/60">Provider</span><span className="text-text">{listing.provider_name || "Infrastructure provider"}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Type</span><span className="text-text">{listing.kind || "Not specified"}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Category</span><span className="text-text">{listing.category}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Location</span><span className="text-text">{listing.provider_location || "Location not provided"}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Rate</span><span className="text-gold font-semibold">${Number(listing.price_monthly || 0).toLocaleString()}/mo</span></div>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-gold text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-gold"></span>
                Simulated checkout
              </div>
              <div className="text-xs text-white/60 mt-1">No payment is collected by this demo.</div>
            </div>
          </Card>

          <Card className="p-5 text-center border border-border bg-surface">
            <button type="button" onClick={async () => { if (!user) { navigate(`/login?redirect=${encodeURIComponent(`/listings/${id}`)}`); return; } try { const conversation = await startProviderConversationApi(listing.provider_id); navigate(`/messages?conversation=${conversation.id}`); } catch (e) { setError(e.response?.data?.detail || e.message || "Unable to start conversation."); } }} className="text-gold hover:underline flex items-center justify-center gap-1">
              Chat with provider
            </button>
          </Card>
        </div>
      </div>

      {/* Gallery Modal */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center" onClick={() => setGalleryOpen(false)}>
          <div className="relative max-w-4xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              {activeMedia?.resource_type === "video" ? <video src={activeMedia.url} controls className="w-full h-full object-contain" /> : <img src={activeMedia?.url} alt="" className="w-full h-full object-contain" />}
            </div>
            {media.length > 1 && (
              <>
                <button onClick={() => setGalleryIndex(i => (i - 1 + media.length) % media.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white" aria-label="Previous">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={() => setGalleryIndex(i => (i + 1) % media.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white" aria-label="Next">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <button onClick={() => setGalleryOpen(false)} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white" aria-label="Close"><X size={18} /></button>
            <div className="flex justify-center gap-2 p-4">
              {media.map((item, i) => (
                <button key={i} onClick={() => setGalleryIndex(i)} className={`w-16 h-10 rounded overflow-hidden border-2 ${i === galleryIndex ? "border-gold" : "border-transparent"}`}>
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