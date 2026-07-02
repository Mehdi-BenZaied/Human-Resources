export type PayrollStatus = 'draft' | 'processing' | 'paid' | 'failed';

export interface Payroll {
  id: string;
  period_start: string;
  period_end: string;
  pay_date: string | null;
  status: PayrollStatus;
  total_gross: number | null;
  total_deductions: number | null;
  total_net: number | null;
  created_at: string;
  payslip_count?: number;
  // alias for templates that use _count
  _count?: { payslips: number };
}

export interface Payslip {
  id: string;
  employee_id: string;
  employee?: { id: string; name: string; email: string; title: string };
  payroll_id: string;
  payroll?: Payroll;
  gross_pay: number;
  bonuses: number;
  deductions: number;
  net_pay: number;
  currency: string;
  issued_at: string | null;
  created_at: string;
}
