from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.recruitment import Job, Candidate
from app.models.department import Department
from app.schemas.recruitment import (
    JobCreate, JobUpdate, JobOut,
    CandidateCreate, CandidateUpdate, CandidateOut,
)
from app.core.exceptions import NotFoundError, BadRequestError


def list_jobs(db: Session) -> list[JobOut]:
    jobs = db.query(Job).options(joinedload(Job.department)).order_by(Job.created_at.desc()).all()
    result = []
    for j in jobs:
        count = db.query(func.count(Candidate.id)).filter(Candidate.job_id == j.id).scalar() or 0
        out = JobOut.model_validate(j)
        out.candidate_count = count
        result.append(out)
    return result


def create_job(db: Session, data: JobCreate) -> JobOut:
    if data.department_id and not db.get(Department, data.department_id):
        raise NotFoundError("Department")

    job = Job(**data.model_dump())
    if job.status == "open":
        job.opened_at = datetime.now(timezone.utc)
    db.add(job)
    db.commit()
    db.refresh(job)

    out = JobOut.model_validate(
        db.query(Job).options(joinedload(Job.department)).filter(Job.id == job.id).first()
    )
    out.candidate_count = 0
    return out


def update_job(db: Session, job_id: str, data: JobUpdate) -> JobOut:
    job = db.get(Job, job_id)
    if not job:
        raise NotFoundError("Job")

    updates = data.model_dump(exclude_unset=True)
    if "department_id" in updates and updates["department_id"] and not db.get(Department, updates["department_id"]):
        raise NotFoundError("Department")

    for k, v in updates.items():
        setattr(job, k, v)

    if job.status == "open" and not job.opened_at:
        job.opened_at = datetime.now(timezone.utc)
    if job.status == "closed" and not job.closed_at:
        job.closed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(job)
    count = db.query(func.count(Candidate.id)).filter(Candidate.job_id == job.id).scalar() or 0
    out = JobOut.model_validate(
        db.query(Job).options(joinedload(Job.department)).filter(Job.id == job.id).first()
    )
    out.candidate_count = count
    return out


def delete_job(db: Session, job_id: str) -> None:
    job = db.get(Job, job_id)
    if not job:
        raise NotFoundError("Job")
    db.delete(job)
    db.commit()


def list_candidates(db: Session, job_id: str | None = None) -> list[CandidateOut]:
    query = db.query(Candidate)
    if job_id:
        query = query.filter(Candidate.job_id == job_id)
    return [CandidateOut.model_validate(c) for c in query.order_by(Candidate.created_at.desc()).all()]


def create_candidate(db: Session, data: CandidateCreate) -> CandidateOut:
    if not db.get(Job, data.job_id):
        raise NotFoundError("Job")
    candidate = Candidate(**data.model_dump())
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return CandidateOut.model_validate(candidate)


def update_candidate(db: Session, candidate_id: str, data: CandidateUpdate) -> CandidateOut:
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise NotFoundError("Candidate")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(candidate, k, v)
    db.commit()
    db.refresh(candidate)
    return CandidateOut.model_validate(candidate)


def delete_candidate(db: Session, candidate_id: str) -> None:
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise NotFoundError("Candidate")
    db.delete(candidate)
    db.commit()
