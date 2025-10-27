export interface Company {
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  legal_representative?: string;
  hse_responsible?: string;
}

export interface Worker {
  id?: string;
  company_id?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
}

export interface Certification {
  id?: string;
  worker_id?: string;
  certification_type: string;
  certification_name: string;
  issue_date?: string;
  expiry_date: string;
  document_url?: string;
  status: 'valid' | 'expired' | 'expiring_soon';
}

export interface WorkOrder {
  id?: string;
  company_id?: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  work_hours?: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed';
}

export interface ExtractedData {
  company?: Company;
  workers?: Array<Worker & { certifications?: Certification[] }>;
  work_order?: WorkOrder;
}

export interface UploadedFile {
  id?: string;
  file_name: string;
  file_type: 'eml' | 'pdf' | 'txt';
  file_url: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_data?: ExtractedData;
  created_at?: string;
  processed_at?: string;
}

export interface CertificationAlert {
  worker_id: string;
  worker_name: string;
  certification_name: string;
  expiry_date: string;
  days_until_expiry: number;
  status: 'expired' | 'expiring_soon';
}
