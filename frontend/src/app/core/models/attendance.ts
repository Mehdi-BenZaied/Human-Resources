export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day' | 'on_leave';

export interface Attendance {
  id: string;
  employee_id: string;
  employee?: { id: string; name: string };
  work_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: AttendanceStatus;
  is_manual: boolean;
  correction_note: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  total_days: number;
  present: number;
  late: number;
  absent: number;
  half_day: number;
  on_leave: number;
  records: Attendance[];
}
