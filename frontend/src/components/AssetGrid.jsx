import React from "react";
import { Button } from "./ui";
import { AssetCard } from "./AssetCard";

export function AssetGrid({ assets, onDelete, onDuplicate, onClearFilters }) {
  if (assets.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <p className="text-white/60">No assets found matching your filters.</p>
        <Button variant="ghost" className="mt-4" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    );
  }
  return (
    <div>
      {assets.map(asset => (
        <AssetCard key={asset.id} asset={asset} onDelete={onDelete} onDuplicate={onDuplicate} />
      ))}
    </div>
  );
}