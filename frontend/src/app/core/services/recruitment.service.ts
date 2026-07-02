import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Job, Candidate } from '../models/recruitment';

// Shape the backend actually returns (snake_case count fields)
type BackendJob = Job & { candidate_count?: number };

function normalizeJob(j: BackendJob): Job {
  return { ...j, _count: { candidates: j.candidate_count ?? 0 } };
}

@Injectable({ providedIn: 'root' })
export class RecruitmentService {
  private readonly base = `${environment.apiBaseUrl}/api/recruitment`;
  constructor(private http: HttpClient) {}

  listJobs(): Observable<Job[]> {
    return this.http.get<BackendJob[]>(`${this.base}/jobs`).pipe(
      map(jobs => jobs.map(normalizeJob))
    );
  }

  getJob(id: string): Observable<Job> {
    return this.http.get<BackendJob>(`${this.base}/jobs/${id}`).pipe(map(normalizeJob));
  }

  createJob(p: Record<string, unknown>): Observable<Job> {
    return this.http.post<BackendJob>(`${this.base}/jobs`, p).pipe(map(normalizeJob));
  }

  updateJob(id: string, p: Record<string, unknown>): Observable<Job> {
    return this.http.put<BackendJob>(`${this.base}/jobs/${id}`, p).pipe(map(normalizeJob));
  }

  deleteJob(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/jobs/${id}`);
  }

  listCandidates(jobId?: string): Observable<Candidate[]> {
    const url = jobId ? `${this.base}/candidates?job_id=${jobId}` : `${this.base}/candidates`;
    return this.http.get<Candidate[]>(url);
  }

  createCandidate(p: Record<string, unknown>): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.base}/candidates`, p);
  }

  updateCandidate(id: string, p: Record<string, unknown>): Observable<Candidate> {
    return this.http.patch<Candidate>(`${this.base}/candidates/${id}`, p);
  }
}
