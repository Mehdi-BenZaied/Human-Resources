import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RecruitmentService } from '../../core/services/recruitment.service';
import { DepartmentService } from '../../core/services/department.service';
import { Job, Candidate, CandidateStatus } from '../../core/models/recruitment';
import { Department } from '../../core/models/department';

@Component({
  selector: 'app-recruitment-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
  <div class="page">
    <div class="page-header">
      <div><h2>Recruitment</h2><p>Manage job openings and track candidates through the hiring pipeline.</p></div>
      <button class="btn btn-primary" (click)="showJobForm = !showJobForm">
        {{ showJobForm ? '✕ Cancel' : '+ Post Job' }}
      </button>
    </div>

    @if (error()) { <div class="error-banner">{{ error() }}</div> }

    <!-- Job form -->
    @if (showJobForm) {
      <div class="card">
        <h3>New Job Opening</h3>
        <form [formGroup]="jobForm" (ngSubmit)="createJob()" class="jf-grid">
          <div class="field jf-wide"><label>Job Title</label><input type="text" formControlName="title" placeholder="e.g. Senior Backend Developer" /></div>
          <div class="field"><label>Department</label>
            <select formControlName="department_id">
              <option value="">No department</option>
              @for (d of departments; track d.id) { <option [value]="d.id">{{ d.name }}</option> }
            </select>
          </div>
          <div class="field"><label>Location</label><input type="text" formControlName="location" placeholder="e.g. Remote, Paris" /></div>
          <div class="field"><label>Status</label>
            <select formControlName="status">
              <option value="draft">Draft</option>
              <option value="open">Open</option>
            </select>
          </div>
          <div class="field jf-wide"><label>Description</label><textarea formControlName="description" rows="3" placeholder="Job responsibilities and requirements…"></textarea></div>
          <div class="jf-wide"><button type="submit" class="btn btn-primary" [disabled]="creatingJob()">{{ creatingJob() ? 'Posting…' : 'Post Job' }}</button></div>
        </form>
      </div>
    }

    <!-- Two-pane layout -->
    <div class="rec-layout">
      <!-- Job list -->
      <div class="jobs-col">
        <h3 class="col-title">Open Positions</h3>
        @if (loading()) { <p class="load-cell">Loading jobs…</p> }
        @else {
          @for (j of jobs; track j.id) {
            <div class="job-card" [class.selected]="selectedJob?.id === j.id" (click)="selectJob(j)">
              <div class="job-top">
                <div>
                  <p class="job-title">{{ j.title }}</p>
                  <p class="job-meta">{{ j.department?.name ?? 'No dept' }} · {{ j.location ?? 'Remote' }}</p>
                </div>
                <span class="badge" [class.badge-success]="j.status==='open'" [class.badge-muted]="j.status==='draft'" [class.badge-danger]="j.status==='closed'">{{ j.status }}</span>
              </div>
              <div class="job-footer">
                <span class="cand-count">{{ j._count?.candidates ?? 0 }} candidates</span>
                <div class="job-btns">
                  @if (j.status === 'draft') {
                    <button class="btn btn-success btn-sm" (click)="$event.stopPropagation(); changeJobStatus(j,'open')">Publish</button>
                  } @else if (j.status === 'open') {
                    <button class="btn btn-ghost btn-sm" (click)="$event.stopPropagation(); changeJobStatus(j,'closed')">Close</button>
                  }
                  <button class="btn btn-danger btn-sm" (click)="$event.stopPropagation(); deleteJob(j.id)">🗑</button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-jobs"><p>🎯</p><p>No jobs posted yet.</p></div>
          }
        }
      </div>

      <!-- Candidate pipeline -->
      <div class="pipeline-col">
        @if (!selectedJob) {
          <div class="no-selection"><p>👈</p><p>Select a job to view and manage candidates</p></div>
        } @else {
          <div class="pipeline-hdr">
            <div>
              <h3>{{ selectedJob.title }}</h3>
              <p>{{ selectedJob.department?.name }} · {{ selectedJob._count?.candidates ?? 0 }} applications</p>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showCandForm = !showCandForm">{{ showCandForm ? '✕' : '+ Add Candidate' }}</button>
          </div>

          @if (showCandForm) {
            <form [formGroup]="candForm" (ngSubmit)="addCandidate()" class="cand-form">
              <div class="field"><label>Name</label><input type="text" formControlName="name" /></div>
              <div class="field"><label>Email</label><input type="email" formControlName="email" /></div>
              <div class="field"><label>Phone</label><input type="text" formControlName="phone" /></div>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="addingCand()">{{ addingCand() ? 'Adding…' : 'Add' }}</button>
            </form>
          }

          <!-- Kanban columns -->
          <div class="kanban">
            @for (col of pipelineColumns; track col.status) {
              <div class="kanban-col">
                <div class="kcol-hdr" [style.--kc]="col.color">
                  <span class="kcol-dot"></span>{{ col.label }}
                  <span class="kcol-count">{{ candidatesByStatus(col.status).length }}</span>
                </div>
                @for (c of candidatesByStatus(col.status); track c.id) {
                  <div class="cand-card">
                    <p class="cand-name">{{ c.name }}</p>
                    <p class="cand-email">{{ c.email }}</p>
                    @if (c.interview_at) {
                      <p class="cand-interview">🗓 {{ c.interview_at | date:'MMM d, HH:mm' }}</p>
                    }
                    <div class="cand-actions">
                      @for (next of nextStatuses(col.status); track next.status) {
                        <button class="btn btn-ghost btn-sm" (click)="moveCandidate(c.id, next.status)">{{ next.label }}</button>
                      }
                    </div>
                  </div>
                } @empty {
                  <p class="kcol-empty">Empty</p>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  </div>
  `,
  styles: [`
    :host { display: block; }
    .page { display: grid; gap: 1.25rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    h2 { margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: -.03em; }
    p { margin: .25rem 0 0; color: var(--muted); font-size: .9rem; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow); }
    .card h3 { margin: 0 0 1rem; font-size: .95rem; font-weight: 700; }
    .error-banner { padding: .8rem 1rem; border-radius: var(--radius); background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(220,38,38,.2); }
    .btn { display: inline-flex; align-items: center; gap: .35rem; padding: .65rem 1.25rem; border-radius: var(--radius); border: none; font-weight: 600; font-size: .9rem; cursor: pointer; transition: all .15s; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
    .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text-soft); }
    .btn-ghost:hover { background: var(--surface-hover); }
    .btn-success { background: var(--success-bg); color: var(--success); border: 1px solid rgba(22,163,74,.2); }
    .btn-danger { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(220,38,38,.2); }
    .btn-sm { padding: .35rem .75rem; font-size: .78rem; border-radius: var(--radius-sm); }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .jf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .jf-wide { grid-column: 1/-1; }
    .field { display: grid; gap: .4rem; }
    .field label { font-size: .82rem; font-weight: 600; color: var(--text-soft); }
    .field input, .field select, .field textarea { padding: .7rem 1rem; border: 1.5px solid var(--border); border-radius: var(--radius); background: var(--surface-muted); outline: none; transition: border-color .15s; resize: vertical; }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--primary); }
    .rec-layout { display: grid; grid-template-columns: 320px 1fr; gap: 1.25rem; align-items: start; }
    .col-title { margin: 0 0 .75rem; font-size: .85rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
    .jobs-col { display: flex; flex-direction: column; gap: .6rem; }
    .job-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1rem; cursor: pointer; transition: all .15s; }
    .job-card:hover { border-color: rgba(99,102,241,.35); box-shadow: 0 4px 16px rgba(99,102,241,.1); }
    .job-card.selected { border-color: var(--primary); background: var(--primary-light); }
    .job-top { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; margin-bottom: .75rem; }
    .job-title { margin: 0; font-size: .9rem; font-weight: 700; }
    .job-meta { margin: .2rem 0 0; font-size: .75rem; color: var(--muted); }
    .job-footer { display: flex; align-items: center; justify-content: space-between; }
    .cand-count { font-size: .78rem; color: var(--muted); font-weight: 500; }
    .job-btns { display: flex; gap: .35rem; }
    .load-cell { text-align: center; color: var(--muted); padding: 2rem; }
    .empty-jobs { text-align: center; padding: 3rem 1rem; color: var(--muted); }
    .empty-jobs p:first-child { font-size: 2rem; margin: 0 0 .25rem; }
    .pipeline-col { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow); display: grid; gap: 1rem; }
    .pipeline-hdr { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
    .pipeline-hdr h3 { margin: 0; font-size: 1rem; font-weight: 700; }
    .no-selection { text-align: center; padding: 4rem 2rem; color: var(--muted); }
    .no-selection p:first-child { font-size: 2rem; margin: 0 0 .25rem; }
    .cand-form { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: .75rem; align-items: flex-end; padding: 1rem; background: var(--surface-muted); border-radius: var(--radius); border: 1px solid var(--border); }
    .kanban { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: .75rem; overflow-x: auto; }
    .kanban-col { background: var(--surface-muted); border-radius: var(--radius); padding: .75rem; min-height: 200px; }
    .kcol-hdr { display: flex; align-items: center; gap: .4rem; font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin-bottom: .75rem; }
    .kcol-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--kc,#64748b); flex-shrink: 0; }
    .kcol-count { margin-left: auto; background: var(--border); border-radius: 99px; padding: .1rem .45rem; font-size: .7rem; }
    .kcol-empty { font-size: .78rem; color: var(--muted); text-align: center; padding: 1rem 0; }
    .cand-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: .85rem; margin-bottom: .5rem; box-shadow: var(--shadow-sm); }
    .cand-name { margin: 0; font-size: .875rem; font-weight: 600; }
    .cand-email { margin: .15rem 0 0; font-size: .75rem; color: var(--muted); }
    .cand-interview { margin: .35rem 0 0; font-size: .75rem; color: var(--info); font-weight: 500; }
    .cand-actions { display: flex; gap: .35rem; margin-top: .6rem; flex-wrap: wrap; }
    @media (max-width: 1100px) { .kanban { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 900px) { .rec-layout { grid-template-columns: 1fr; } .jf-grid,.cand-form { grid-template-columns: 1fr; } }
  `],
})
export class RecruitmentPageComponent implements OnInit {
  private svc = inject(RecruitmentService);
  private deptSvc = inject(DepartmentService);
  private fb = inject(NonNullableFormBuilder);

  jobs: Job[] = [];
  candidates: Candidate[] = [];
  departments: Department[] = [];
  selectedJob: Job | null = null;
  loading = signal(true);
  creatingJob = signal(false);
  addingCand = signal(false);
  error = signal('');
  showJobForm = false;
  showCandForm = false;

  readonly pipelineColumns = [
    { status: 'applied'              as CandidateStatus, label: 'Applied',           color: '#64748b' },
    { status: 'screening'            as CandidateStatus, label: 'Screening',          color: '#6366f1' },
    { status: 'interview_scheduled'  as CandidateStatus, label: 'Interview',          color: '#d97706' },
    { status: 'offered'              as CandidateStatus, label: 'Offered',            color: '#0284c7' },
    { status: 'hired'                as CandidateStatus, label: 'Hired',              color: '#16a34a' },
    { status: 'rejected'             as CandidateStatus, label: 'Rejected',           color: '#dc2626' },
  ];

  readonly jobForm = this.fb.group({
    title: this.fb.control('', [Validators.required]),
    description: this.fb.control('', [Validators.required]),
    department_id: this.fb.control(''),
    location: this.fb.control(''),
    status: this.fb.control('draft'),
  });

  readonly candForm = this.fb.group({
    name: this.fb.control('', [Validators.required]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    phone: this.fb.control(''),
  });

  candidatesByStatus(status: CandidateStatus): Candidate[] {
    return this.candidates.filter(c => c.status === status);
  }

  nextStatuses(current: CandidateStatus): { status: CandidateStatus; label: string }[] {
    const flow: Record<string, { status: CandidateStatus; label: string }[]> = {
      applied:             [{ status: 'screening', label: 'Screen' }, { status: 'rejected', label: 'Reject' }],
      screening:           [{ status: 'interview_scheduled', label: 'Schedule Interview' }, { status: 'rejected', label: 'Reject' }],
      interview_scheduled: [{ status: 'offered', label: 'Offer' }, { status: 'rejected', label: 'Reject' }],
      offered:             [{ status: 'hired', label: '✓ Hire' }, { status: 'rejected', label: 'Reject' }],
      hired: [], rejected: [],
    };
    return flow[current] ?? [];
  }

  ngOnInit(): void {
    this.deptSvc.listDepartments().subscribe(d => this.departments = d);
    this.loadJobs();
  }

  loadJobs(): void {
    this.loading.set(true);
    this.svc.listJobs().subscribe({ next: j => { this.jobs = j; this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  selectJob(j: Job): void {
    this.selectedJob = j;
    this.svc.listCandidates(j.id).subscribe(c => this.candidates = c);
  }

  createJob(): void {
    if (this.jobForm.invalid) { this.jobForm.markAllAsTouched(); return; }
    this.creatingJob.set(true);
    const v = this.jobForm.getRawValue();
    this.svc.createJob({ ...v, department_id: v.department_id || undefined }).subscribe({
      next: j => { this.jobs = [j, ...this.jobs]; this.creatingJob.set(false); this.showJobForm = false; this.jobForm.reset({ status: 'draft' }); },
      error: e => { this.error.set(e?.error?.message ?? 'Failed.'); this.creatingJob.set(false); },
    });
  }

  changeJobStatus(j: Job, status: string): void {
    this.svc.updateJob(j.id, { status }).subscribe({ next: updated => this.jobs = this.jobs.map(x => x.id === j.id ? updated : x) });
  }

  deleteJob(id: string): void {
    if (!confirm('Delete this job posting?')) return;
    this.svc.deleteJob(id).subscribe({ next: () => { this.jobs = this.jobs.filter(j => j.id !== id); if (this.selectedJob?.id === id) this.selectedJob = null; } });
  }

  addCandidate(): void {
    if (this.candForm.invalid || !this.selectedJob) { this.candForm.markAllAsTouched(); return; }
    this.addingCand.set(true);
    this.svc.createCandidate({ ...this.candForm.getRawValue(), job_id: this.selectedJob.id }).subscribe({
      next: c => { this.candidates = [...this.candidates, c]; this.addingCand.set(false); this.showCandForm = false; this.candForm.reset(); },
      error: e => { this.error.set(e?.error?.message ?? 'Failed.'); this.addingCand.set(false); },
    });
  }

  moveCandidate(id: string, status: CandidateStatus): void {
    this.svc.updateCandidate(id, { status }).subscribe({ next: updated => this.candidates = this.candidates.map(c => c.id === id ? updated : c) });
  }
}
