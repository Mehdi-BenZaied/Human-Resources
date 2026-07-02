/** Keep in sync with backend EmployeeStatus enum */
export const EMPLOYEE_STATUS_OPTIONS = [
  'active',
  'on_leave',
  'inactive',
] as const;

export const LEAVE_REQUEST_STATUS_OPTIONS = [
  'pending',
  'approved',
  'rejected',
] as const;
