export interface Company {
  id?: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  legal_representative: string | null;
  hse_responsible: string | null;
}

export interface Worker {
  id?: string;
  company_id?: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
}

export interface Certification {
  id?: string;
  worker_id?: string;
  certification_type: string;
  certification_name: string;
  issue_date: string | null;
  expiry_date: string | null;
  document_url?: string;
  status?: 'valid' | 'expired' | 'expiring_soon';
}

export interface ExtractedData {
  company?: Company;
  workers?: Array<Worker & { certifications?: Certification[] }>;
}

export interface CertificationAlert {
  worker_id: string;
  worker_name: string;
  certification_name: string;
  expiry_date: string;
  days_until_expiry: number;
  status: 'expired' | 'expiring_soon';
}

export interface PDP {
  id: string;
  windfarm_name: string;
  company?: Company;
  worker_ids: string[];
  created_at: string;
  updated_at: string;
  file_names: string[];
  is_active: boolean;
  risk_analysis: boolean;
  operational_mode: boolean;
  generated_document_path?: string | null;
  template_path?: string | null;
}

export interface PDPFile {
  id: string;
  pdp_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}
