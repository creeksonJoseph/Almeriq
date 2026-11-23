from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from api.cache import with_etag
from sqlalchemy.ext.asyncio import AsyncSession
from api.dependencies import get_current_user
from core.db import get_db
from core.roles import user_has_role
from schemas.expert import ExpertProfileUpdate, AdvisoryRequestCreate, AdvisoryRequestStatusUpdate
from services import expert as svc

router = APIRouter(prefix="/api", tags=["experts"])


def _role_user(user: dict, expected: str) -> int:
    if not user_has_role(user, expected):
        raise HTTPException(status_code=403, detail=f"{expected.capitalize()} account required")
    return int(user["id"])


@router.get("/experts")
async def discover_experts(
    request: Request,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    response.headers["Cache-Control"] = "private, max-age=30"
    items = await svc.list_profiles(limit=limit, offset=offset, session=db)
    payload = {"items": items, "total": len(items)}
    return with_etag(request, response, payload)


@router.get("/expert/profile")
async def get_my_expert_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expert_id = _role_user(current_user, "expert")
    return await svc.get_profile(expert_id, session=db)


@router.put("/expert/profile")
async def update_my_expert_profile(
    body: ExpertProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expert_id = _role_user(current_user, "expert")
    return await svc.upsert_profile(
        expert_id, session=db, **body.model_dump(exclude_unset=True)
    )


@router.post("/experts/{expert_id}/requests", status_code=status.HTTP_201_CREATED)
async def create_advisory_request(
    expert_id: int,
    body: AdvisoryRequestCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    founder_id = _role_user(current_user, "founder")
    return await svc.create_request(
        founder_id=founder_id, expert_id=expert_id, subject=body.subject,
        description=body.description, budget=body.budget, session=db,
    )


@router.get("/expert/requests")
async def list_expert_requests(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expert_id = _role_user(current_user, "expert")
    response.headers["Cache-Control"] = "private, no-store"
    return {"items": await svc.list_requests(expert_id, "expert", session=db)}


@router.patch("/expert/requests/{request_id}")
async def update_expert_request(
    request_id: int,
    body: AdvisoryRequestStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expert_id = _role_user(current_user, "expert")
    return await svc.update_request(request_id, expert_id, body.status, session=db)


@router.get("/founder/expert-requests")
async def list_founder_expert_requests(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    founder_id = _role_user(current_user, "founder")
    response.headers["Cache-Control"] = "private, no-store"
    return {"items": await svc.list_requests(founder_id, "founder", session=db)}
