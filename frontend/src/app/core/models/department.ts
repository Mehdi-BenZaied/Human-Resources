export interface Department {
  id: string;
  name: string;
  employee_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentFormValue {
  name: string;
}
