from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.recruitment import (
    JobCreate, JobUpdate, JobOut,
    CandidateCreate, CandidateUpdate, CandidateOut,
)
from app.services import recruitment_service
from app.models.user import User

router = APIRouter(prefix="/recruitment", tags=["Recruitment"])


# ── Jobs ──────────────────────────────────────────────────────────────────────

@router.get("/jobs", response_model=list[JobOut])
def list_jobs(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return recruitment_service.list_jobs(db)


@router.post("/jobs", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    data: JobCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return recruitment_service.create_job(db, data)


@router.put("/jobs/{job_id}", response_model=JobOut)
def update_job(
    job_id: str,
    data: JobUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return recruitment_service.update_job(db, job_id, data)


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    recruitment_service.delete_job(db, job_id)


# ── Candidates ────────────────────────────────────────────────────────────────

@router.get("/candidates", response_model=list[CandidateOut])
def list_candidates(
    job_id: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return recruitment_service.list_candidates(db, job_id=job_id)


@router.post("/candidates", response_model=CandidateOut, status_code=status.HTTP_201_CREATED)
def create_candidate(
    data: CandidateCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return recruitment_service.create_candidate(db, data)


@router.patch("/candidates/{candidate_id}", response_model=CandidateOut)
def update_candidate(
    candidate_id: str,
    data: CandidateUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return recruitment_service.update_candidate(db, candidate_id, data)


@router.delete("/candidates/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(
    candidate_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    recruitment_service.delete_candidate(db, candidate_id)
