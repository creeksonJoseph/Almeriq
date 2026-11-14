import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, MapPin, DollarSign, Activity, ExternalLink, Share2, MessageSquare, ShoppingCart, CheckCircle, Shield, Truck } from "lucide-react";
import { Button, Card, StatusPill, Modal, Pill } from "../../components/ui";
import { getMarketplaceListingApi, getMarketplaceProviderApi, createDealApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function PublicListingPreviewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [dealLoading, setDealLoading] = useState(false);

  useEffect(() => {
    async function loadListing() {
      setLoading(true);
      try {
        const [listingRes, providerRes] = await Promise.all([
          getMarketplaceListingApi(id),
          getMarketplaceProviderApi(id).catch(() => null),
        ]);
        setListing(listingRes.data || listingRes.listing || listingRes);
        setProvider(providerRes?.data || providerRes?.provider || providerRes);
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
      window.location.href = `/login?redirect=/listings/${id}`;
      return;
    }
    setDealLoading(true);
    try {
      const res = await createDealApi({ listingId: id, buyerId: user.id });
      window.location.href = `/checkout/${res.dealId || res.id}`;
    } catch (e) {
      console.error("Failed to create deal", e);
    } finally {
      setDealLoading(false);
    }
  };

  const images = listing?.images || [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800",
  ];

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
          <Button variant="ghost">
            <Share2 className="w-4 h-4 mr-1" /> Share
          </Button>
          <Button onClick={handleOrder} disabled={dealLoading}>
            <ShoppingCart className="w-4 h-4 mr-1" />
            {dealLoading ? "Creating Deal..." : "Order Now"}
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative">
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-surface-2 border border-border">
          <img src={images[galleryIndex]} alt={`${listing.name} - Image ${galleryIndex + 1}`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }} />
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {images.map((_, i) => (
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
                {provider?.name?.slice(0,2).toUpperCase() || listing.providerName?.slice(0,2).toUpperCase() || "SC"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-serif text-lg font-semibold text-text">{provider?.name || listing.providerName || "Sim's Company"}</h2>
                  {provider?.verified && <span className="text-gold" aria-label="Verified">✓</span>}
                  <span className="px-2 py-0.5 rounded bg-surface text-white/60 text-[10px] font-mono tracking-wide">DUNS #82-194-0912</span>
                </div>
                <p className="text-sm text-white/60 mt-1">{provider?.description || "Turnkey Tier-3 modular edge datacenters and 64x H100 GPU clusters with bonded optical interconnection for APAC ventures."}</p>
              </div>
            </div>
          </Card>

          {/* About */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-caps text-white/60 uppercase tracking-wider">ABOUT THIS LISTING</span>
              <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">SPEC 4.2</span>
            </div>
            <p className="text-base text-white/60 leading-relaxed">{listing.description || "Tier-3 Modular Edge Datacenter & 64x NVIDIA H100 SXM5 Tensor Core Cluster. Haidian District, Beijing, CN."}</p>
          </Card>

          {/* Specs */}
          <Card className="p-5">
            <span className="text-label-caps text-white/60 uppercase tracking-wider block mb-4">SPECIFICATIONS</span>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Category", value: listing.category || "Tier-3 Micro-DC" },
                { label: "Compute", value: listing.compute || "64x H100 SXM5 GPU Cluster" },
                { label: "Location", value: listing.location || "Beijing, China" },
                { label: "Network", value: listing.network || "Bonded Optical Interconnect" },
                { label: "Power", value: listing.power || "120 kW Peak N+1 Redundant" },
                { label: "Availability", value: listing.availability || "Immediate Deployment" },
              ].map((spec, i) => (
                <div key={i} className="bg-surface border border-border rounded-lg p-3">
                  <span className="text-white/40 block uppercase text-[9px] tracking-wider">{spec.label}</span>
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
                <div className="font-serif text-2xl font-semibold text-gold">${listing.price || "5,000.00"}<span className="text-sm font-sans text-white/60 font-normal">/mo</span></div>
              </div>
              <Button onClick={handleOrder} disabled={dealLoading} className="w-full sm:w-auto h-11 px-6">
                <ShoppingCart className="w-4 h-4 mr-1" />
                {dealLoading ? "Creating Deal..." : "Order Now"}
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gold font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Multi-Sig Escrow Protected</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Shield className="w-4 h-4" />
                <span>100% Bonded Assurance</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Truck className="w-4 h-4" />
                <span>Turnkey SLA</span>
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
              <div className="flex justify-between"><span className="text-white/60">Provider</span><span className="text-text">{provider?.name || listing.providerName}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Type</span><span className="text-text">{listing.type || "Digital Infrastructure"}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Category</span><span className="text-text">{listing.category}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Location</span><span className="text-text">{listing.location}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Rate</span><span className="text-gold font-semibold">${listing.price}/mo</span></div>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-gold text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-gold"></span>
                Escrow Qualified
              </div>
              <div className="text-xs text-white/60 mt-1">Instant Booking Available</div>
            </div>
          </Card>

          <Card className="p-5 text-center border border-border bg-surface">
            <Link to={`/messages?provider=${provider?.id || listing.providerId}`} className="text-gold hover:underline flex items-center justify-center gap-1">
              <MessageSquare className="w-4 h-4" /> Chat with Provider
            </Link>
          </Card>
        </div>
      </div>

      {/* Gallery Modal */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center" onClick={() => setGalleryOpen(false)}>
          <div className="relative max-w-4xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <img src={images[galleryIndex]} alt="" className="w-full h-full object-contain" />
            </div>
            {images.length > 1 && (
              <>
                <button onClick={() => setGalleryIndex(i => (i - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white" aria-label="Previous">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={() => setGalleryIndex(i => (i + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white" aria-label="Next">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <button onClick={() => setGalleryOpen(false)} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white" aria-label="Close">✕</button>
            <div className="flex justify-center gap-2 p-4">
              {images.map((img, i) => (
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