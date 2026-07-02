export type JobStatus = 'draft' | 'open' | 'closed';
export type CandidateStatus = 'applied' | 'screening' | 'interview_scheduled' | 'offered' | 'hired' | 'rejected';

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string | null;
  department_id: string | null;
  department?: { id: string; name: string } | null;
  status: JobStatus;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
  candidate_count?: number;
  // alias for templates that use _count
  _count?: { candidates: number };
}

export interface Candidate {
  id: string;
  job_id: string;
  job?: { id: string; title: string };
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  cover_letter: string | null;
  status: CandidateStatus;
  interview_at: string | null;
  notes: string | null;
  created_at: string;
}
