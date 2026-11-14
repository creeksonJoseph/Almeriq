import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, Trash2, Edit, Activity, ExternalLink } from "lucide-react";
import { Button, Card, Link as LinkComp, StatusPill } from "./ui";

export function AssetCard({ asset, onDelete }) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const statusConfig = {
    available: { variant: "gold", label: "AVAILABLE" },
    reserved: { variant: "gold", label: "RESERVED" },
    leased: { variant: "white", label: "LEASED" },
    unavailable: { variant: "white", label: "UNAVAILABLE" },
  }[asset.status?.toLowerCase()] || { variant: "gold", label: "AVAILABLE" };

  return (
    <Card className="group relative p-5 flex flex-col justify-between transition-all duration-150 hover:border-gold">
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-gold shrink-0">
            <Activity className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="relative flex items-center gap-2">
            <StatusPill status={asset.status?.toLowerCase() || "available"} />
            <button
              onClick={e => { e.stopPropagation(); setPopoverOpen(!popoverOpen); }}
              className="p-1.5 text-white/60 hover:text-text rounded hover:bg-surface-2 transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {popoverOpen && (
              <div className="absolute right-0 top-9 w-44 bg-surface-2 border border-border rounded-lg p-1.5 shadow-2xl z-30 text-xs">
                <Link to={`/provider/listings/${asset.id}/preview`} className="block px-2.5 py-1.5 text-white/60 hover:text-text hover:bg-surface rounded flex items-center gap-2" onClick={() => setPopoverOpen(false)}>
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Link>
                <Link to={`/provider/listings/${asset.id}/preview`} className="block px-2.5 py-1.5 text-white/60 hover:text-text hover:bg-surface rounded flex items-center gap-2" onClick={() => setPopoverOpen(false)}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Duplicate spec</span>
                </Link>
                <div className="my-1 border-t border-border"></div>
                <button
                  onClick={() => { setPopoverOpen(false); onDelete(asset.id); }}
                  className="w-full text-left px-2.5 py-1.5 text-gold hover:bg-gold/10 rounded flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1">
          {asset.type === "digital" ? "HIGH-PERFORMANCE AI COMPUTE" : "HEAVY EXCAVATION and EARTHMOVING"}
        </div>
        <h3 className="font-serif text-lg font-semibold text-text mb-2 leading-snug">{asset.name}</h3>
        <p className="text-xs text-white/60 font-mono mb-4">{asset.description || asset.specs || "No description"}</p>
      </div>
      <div className="pt-4 border-t border-border mt-2">
        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="font-serif text-2xl font-semibold text-gold">${asset.rate || "0"}</span>
          <span className="text-xs text-white/60">/ month</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link to={`/provider/listings/${asset.id}/preview`}>
              <Button variant="ghost" size="sm" className="px-3.5 py-1.5">Edit</Button>
            </Link>
            <button className="p-1.5 rounded-lg border border-border hover:border-gold text-white/60 hover:text-text transition-colors">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          <a href="#" className="text-xs font-mono text-white/60 hover:text-gold flex items-center gap-1 transition-colors">
            <span>Telemetry</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </Card>
  );
}