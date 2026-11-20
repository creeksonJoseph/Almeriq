"""Cloudinary-backed listing media management."""
from __future__ import annotations

import logging
from fastapi import HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool
from core.config import CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME
from repositories import asset as asset_repo

logger = logging.getLogger(__name__)

MAX_MEDIA_ITEMS = 10
IMAGE_MAX_BYTES = 10 * 1024 * 1024
VIDEO_MAX_BYTES = 100 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/avif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}


def _configure_cloudinary() -> None:
    if not all((CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Listing media uploads are not configured yet. Add the Cloudinary environment variables.",
        )
    import cloudinary
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True,
    )


async def upload_asset_media(asset_id: int, provider_id: int, files: list[UploadFile], session=None) -> dict:
    asset = await asset_repo.get_asset_by_id(asset_id, provider_id, session=session)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    current = list(asset.get("media") or [])
    if not files:
        raise HTTPException(status_code=400, detail="Select at least one image or video")
    if len(current) + len(files) > MAX_MEDIA_ITEMS:
        raise HTTPException(status_code=400, detail=f"A listing can contain at most {MAX_MEDIA_ITEMS} media files")

    validated = []
    for file in files:
        content_type = (file.content_type or "").lower()
        if content_type in ALLOWED_IMAGE_TYPES:
            max_bytes = IMAGE_MAX_BYTES
            resource_type = "image"
        elif content_type in ALLOWED_VIDEO_TYPES:
            max_bytes = VIDEO_MAX_BYTES
            resource_type = "video"
        else:
            raise HTTPException(status_code=415, detail=f"Unsupported media type: {content_type or 'unknown'}")
        size = file.size
        if size is not None and size > max_bytes:
            raise HTTPException(status_code=413, detail=f"{file.filename or 'File'} exceeds the {max_bytes // (1024 * 1024)} MB limit")
        validated.append((file, resource_type))

    _configure_cloudinary()
    import cloudinary.uploader

    uploaded = []
    try:
        for file, resource_type in validated:
            result = await run_in_threadpool(
                cloudinary.uploader.upload,
                file.file,
                resource_type=resource_type,
                folder=f"almeriq/listings/{asset_id}",
                overwrite=False,
                unique_filename=True,
                use_filename=False,
            )
            uploaded.append({
                "url": result["secure_url"],
                "public_id": result["public_id"],
                "resource_type": resource_type,
                "format": result.get("format"),
                "bytes": result.get("bytes"),
                "width": result.get("width"),
                "height": result.get("height"),
            })
    except Exception:
        for item in uploaded:
            try:
                await run_in_threadpool(
                    cloudinary.uploader.destroy,
                    item["public_id"],
                    resource_type=item["resource_type"],
                    invalidate=True,
                )
            except Exception:
                logger.exception("Failed to clean up a partially uploaded Cloudinary asset")
        logger.exception("Cloudinary listing media upload failed")
        raise HTTPException(status_code=502, detail="Cloudinary upload failed. Please retry.")

    updated = await asset_repo.update_asset(
        asset_id=asset_id,
        provider_id=provider_id,
        media=current + uploaded,
        session=session,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Asset not found")
    return updated


async def delete_asset_media(asset_id: int, provider_id: int, public_id: str, session=None) -> dict:
    asset = await asset_repo.get_asset_by_id(asset_id, provider_id, session=session)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    current = list(asset.get("media") or [])
    target = next((item for item in current if item.get("public_id") == public_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Media not found")

    _configure_cloudinary()
    import cloudinary.uploader
    result = await run_in_threadpool(
        cloudinary.uploader.destroy,
        public_id,
        resource_type=target.get("resource_type", "image"),
        invalidate=True,
    )
    if result.get("result") not in {"ok", "not found"}:
        raise HTTPException(status_code=502, detail="Cloudinary could not delete this media file")

    updated_media = [item for item in current if item.get("public_id") != public_id]
    updated = await asset_repo.update_asset(
        asset_id=asset_id,
        provider_id=provider_id,
        media=updated_media,
        session=session,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Asset not found")
    return updated
