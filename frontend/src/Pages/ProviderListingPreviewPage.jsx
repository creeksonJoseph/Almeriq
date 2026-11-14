import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, MapPin, DollarSign, Activity, ExternalLink, Share2 } from "lucide-react";
import { Button, Card, StatusPill, Modal, Skeleton, SkeletonText } from "../components/ui";
import { getAssetApi, getMarketplaceListingApi } from "../lib/api";

export default function ProviderListingPreviewPage() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    async function loadAsset() {
      setLoading(true);
      try {
        const res = await getAssetApi(id);
        setAsset(res.data || res.asset || res);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAsset();
  }, [id]);

  const images = asset?.images || [
    "https://images.unsplash.com/photo-1504307651254-35680f356bae?w=800",
    "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800",
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800",
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <SkeletonText lines={3} className="max-w-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
        <SkeletonText lines={4} />
        <Skeleton className="h-4 w-32 rounded" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-center">
        <p className="text-gold">Failed to load listing preview</p>
      </div>
    );
  }

  const statusConfig = {
    available: { variant: "gold", label: "AVAILABLE" },
    reserved: { variant: "gold", label: "RESERVED" },
    leased: { variant: "white", label: "LEASED" },
    unavailable: { variant: "white", label: "UNAVAILABLE" },
  }[asset.status?.toLowerCase()] || { variant: "gold", label: "AVAILABLE" };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/60 mb-1 font-medium">
            PREVIEW // YOUR LISTING
          </div>
          <h1 className="font-serif text-3xl font-semibold text-text leading-tight">{asset.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Listings
          </Button>
          <Button variant="ghost">
            <Share2 className="w-4 h-4 mr-1" /> Share
          </Button>
          <Button>
            <ExternalLink className="w-4 h-4 mr-1" /> View Public
          </Button>
        </div>
      </div>

      {/* Main Image Gallery */}
      <div className="relative">
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-surface-2 border border-border">
          <img
            src={images[galleryIndex]}
            alt={`${asset.name} - Image ${galleryIndex + 1}`}
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
          />
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setGalleryIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === galleryIndex ? "bg-gold w-6" : "bg-border hover:bg-gold/50"}`}
                aria-label={`View image ${i + 1}`}
              />
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
                {asset.providerName?.slice(0,2).toUpperCase() || "TB"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-serif text-lg font-semibold text-text">{asset.providerName || "TerraBore Heavy Dynamics Inc."}</h2>
                  <span className="text-gold" aria-label="Verified">✓</span>
                  <span className="px-2 py-0.5 rounded bg-surface text-white/60 text-[10px] font-mono tracking-wide">DUNS #82-194-0912</span>
                </div>
                <p className="text-sm text-white/70 mt-1">{asset.providerDescription || "Heavy equipment and autonomous field machinery fleet supporting Tier-1 excavation and robotics pilots."}</p>
              </div>
            </div>
          </Card>

          {/* About */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-caps text-white/60 uppercase tracking-wider">ABOUT THE ASSET</span>
              <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">SPEC 4.2</span>
            </div>
            <p className="text-base text-white/70 leading-relaxed">{asset.description || "Caterpillar 336 Next-Gen Excavator with GNSS guidance system. 3x 36-ton units located at Yard Bay 12. High-ambient package for desert operations. Real-time CAN bus telemetry with 10Hz GNSS positioning. Bonded escrow ready."}</p>
          </Card>

          {/* Specs Grid */}
          <Card className="p-5">
            <span className="text-label-caps text-white/60 uppercase tracking-wider block mb-4">ALLOCATED SPECIFICATIONS</span>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface border border-border rounded-lg p-3">
                <span className="text-white/40 block uppercase text-[9px] tracking-wider">Category</span>
                <span className="font-semibold text-text font-serif text-sm">{asset.category || "Heavy Earthmoving / Excavation"}</span>
              </div>
              <div className="bg-surface border border-border rounded-lg p-3">
                <span className="text-white/40 block uppercase text-[9px] tracking-wider">Quantity</span>
                <span className="font-semibold text-text font-serif text-sm">{asset.quantity || "3x 36-ton units"}</span>
              </div>
              <div className="bg-surface border border-border rounded-lg p-3">
                <span className="text-white/40 block uppercase text-[9px] tracking-wider">Location</span>
                <span className="font-semibold text-text font-serif text-sm">{asset.location || "Yard Bay 12"}</span>
              </div>
              <div className="bg-surface border border-border rounded-lg p-3">
                <span className="text-white/40 block uppercase text-[9px] tracking-wider">Availability</span>
                <span className="font-semibold text-text font-serif text-sm">{asset.availability || "Immediate (Turnkey Dispatch)"}</span>
              </div>
              <div className="bg-surface border border-border rounded-lg p-3">
                <span className="text-white/40 block uppercase text-[9px] tracking-wider">Telemetry</span>
                <span className="flex items-center gap-1.5 text-gold font-medium text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                  Active CAN Uplink
                </span>
              </div>
              <div className="bg-surface border border-border rounded-lg p-3">
                <span className="text-white/40 block uppercase text-[9px] tracking-wider">Escrow</span>
                <span className="font-semibold text-text font-serif text-sm">Bonded Ready</span>
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-label-caps text-white/60 uppercase tracking-wider">PRICING</span>
              <StatusPill status={asset.status?.toLowerCase() || "available"} />
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-serif text-3xl font-semibold text-gold">${asset.rate || "14,500"}</span>
              <span className="text-sm text-white/70">/ month</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">Edit</Button>
                <Button variant="ghost" size="sm" className="p-1.5"><ExternalLink className="w-4 h-4" /></Button>
              </div>
              <a href="#" className="text-xs font-mono text-white/60 hover:text-gold flex items-center gap-1">
                <span>Telemetry</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-label-caps text-white/60 uppercase tracking-wider">ASSET STATUS</span>
              <StatusPill status={asset.status?.toLowerCase() || "available"} />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-white/60">Provider</span><span className="text-text">{asset.providerName || "TerraBore Heavy Dynamics"}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Type</span><span className="text-text">{asset.type || "Physical"}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Category</span><span className="text-text">{asset.category || "Heavy Earthmoving"}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Location</span><span className="text-text">{asset.location || "Austin, TX, USA"}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Rate</span><span className="text-gold font-semibold">${asset.rate || "14,500"}/mo</span></div>
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
            <span className="text-xs text-white/60">View Verified Catalog →</span>
          </Card>
        </div>
      </div>

      {/* Gallery Modal */}
      <Modal open={galleryOpen} onClose={() => setGalleryOpen(false)} ariaLabel="Image gallery" className="max-w-4xl p-0">
        <div className="relative">
          <div className="aspect-video w-full bg-black">
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
          <button onClick={() => setGalleryOpen(false)} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          <div className="flex justify-center gap-2 p-4 bg-black/50">
            {images.map((img, i) => (
              <button key={i} onClick={() => setGalleryIndex(i)} className={`w-16 h-10 rounded overflow-hidden border-2 ${i === galleryIndex ? "border-gold" : "border-transparent"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}