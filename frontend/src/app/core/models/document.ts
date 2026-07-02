export type DocumentType = 'contract' | 'id_proof' | 'payslip' | 'hr_document' | 'certificate' | 'other';

export interface HrDocument {
  id: string;
  document_type: DocumentType;
  title: string;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  file_size: number | null;
  description: string | null;
  is_confidential: boolean;
  employee_id: string | null;
  employee?: { id: string; name: string } | null;
  uploaded_at: string;
  created_at: string;
}
