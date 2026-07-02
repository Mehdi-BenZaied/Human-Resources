export type EmployeeStatus = 'active' | 'on_leave' | 'inactive';

export interface Employee {
  id: string;
  name: string;
  email: string;
  title: string;           // job title / role
  department_id: string;
  department?: { id: string; name: string };
  status: EmployeeStatus;
  start_date: string;
  created_at?: string;
  updated_at?: string;
}

/** Shape used by forms (no id, no timestamps) */
export interface EmployeeFormValue {
  name: string;
  email: string;
  title: string;
  department_id: string;
  status: EmployeeStatus;
  start_date: string;
}
