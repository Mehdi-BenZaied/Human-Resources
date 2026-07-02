export type LeaveType = 'annual_leave' | 'sick_leave' | 'maternity_leave' | 'emergency_leave';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day' | 'on_leave';
export type PayrollStatus = 'draft' | 'processing' | 'paid' | 'failed';
export type JobStatus = 'draft' | 'open' | 'closed';
export type CandidateStatus = 'applied' | 'screening' | 'interview_scheduled' | 'offered' | 'hired' | 'rejected';
export type NotificationType = 'announcement' | 'holiday' | 'policy_update' | 'leave_update' | 'system';
export type DocumentType = 'contract' | 'id_proof' | 'payslip' | 'hr_document' | 'certificate' | 'other';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  work_date: string;
  check_in_at?: string | null;
  check_out_at?: string | null;
  status: AttendanceStatus;
  is_manual: boolean;
  correction_note?: string | null;
  approved_at?: string | null;
}

export interface Payroll {
  id: string;
  period_start: string;
  period_end: string;
  pay_date?: string | null;
  status: PayrollStatus;
  total_gross?: number | null;
  total_deductions?: number | null;
  total_net?: number | null;
}

export interface Payslip {
  id: string;
  employee_id: string;
  payroll_id: string;
  gross_pay: number;
  bonuses: number;
  deductions: number;
  net_pay: number;
  currency: string;
  issued_at?: string | null;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location?: string | null;
  status: JobStatus;
  opened_at?: string | null;
  closed_at?: string | null;
  department_id?: string | null;
}

export interface Candidate {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone?: string | null;
  resume_url?: string | null;
  cover_letter?: string | null;
  status: CandidateStatus;
  interview_at?: string | null;
  notes?: string | null;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  audience_role?: 'admin' | 'employee' | null;
  is_published: boolean;
  published_at?: string | null;
  expires_at?: string | null;
}

export interface DocumentItem {
  id: string;
  employee_id?: string | null;
  document_type: DocumentType;
  title: string;
  file_name: string;
  file_url: string;
  mime_type?: string | null;
  file_size?: number | null;
  description?: string | null;
  is_confidential: boolean;
  uploaded_at: string;
}

export interface HrModuleCard {
  title: string;
  icon: string;
  description: string;
  table: string;
  fields: string[];
  route?: string;
}