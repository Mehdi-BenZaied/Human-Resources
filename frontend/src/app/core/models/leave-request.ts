export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';
export type LeaveType = 'annual_leave' | 'sick_leave' | 'maternity_leave' | 'emergency_leave';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee?: { id: string; name: string; email: string };
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  admin_comment?: string | null;
  status: LeaveRequestStatus;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveRequestFormValue {
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
}
