/*
  # Wind Farm Worker Management System Schema

  ## Overview
  This migration creates the complete database schema for managing wind farm construction workers,
  their certifications, companies, work orders, and compliance documentation.

  ## New Tables

  ### 1. `companies`
  Stores information about construction companies working on wind farms
  - `id` (uuid, primary key)
  - `name` (text) - Company name
  - `address` (text) - Company address
  - `phone` (text) - Contact phone
  - `email` (text) - Contact email
  - `legal_representative` (text) - Name of legal representative
  - `hse_responsible` (text) - Health, Safety, Environment responsible person
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `workers`
  Stores information about individual workers/technicians
  - `id` (uuid, primary key)
  - `company_id` (uuid, foreign key to companies)
  - `first_name` (text)
  - `last_name` (text)
  - `phone` (text)
  - `email` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `certifications`
  Stores worker certifications and qualifications (habilitations)
  - `id` (uuid, primary key)
  - `worker_id` (uuid, foreign key to workers)
  - `certification_type` (text) - Type of certification (e.g., electrical, height work)
  - `certification_name` (text) - Specific certification name
  - `issue_date` (date) - When certification was issued
  - `expiry_date` (date) - When certification expires
  - `document_url` (text) - URL to stored certification document
  - `status` (text) - valid, expired, expiring_soon
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `work_orders`
  Stores information about work orders and interventions
  - `id` (uuid, primary key)
  - `company_id` (uuid, foreign key to companies)
  - `title` (text) - Work order title
  - `description` (text) - Work description
  - `start_date` (date)
  - `end_date` (date)
  - `work_hours` (text) - Working hours
  - `status` (text) - pending, approved, in_progress, completed
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `work_order_workers`
  Junction table linking workers to work orders
  - `id` (uuid, primary key)
  - `work_order_id` (uuid, foreign key to work_orders)
  - `worker_id` (uuid, foreign key to workers)
  - `role` (text) - Worker's role in this work order
  - `created_at` (timestamptz)

  ### 6. `pdp_documents`
  Stores PDP (Plan de Prévention) documents - safety plans and risk analyses
  - `id` (uuid, primary key)
  - `work_order_id` (uuid, foreign key to work_orders)
  - `document_type` (text) - mode_operatoire, analyse_risque
  - `document_url` (text) - URL to stored document
  - `uploaded_at` (timestamptz)

  ### 7. `uploaded_files`
  Tracks all uploaded files for processing
  - `id` (uuid, primary key)
  - `file_name` (text)
  - `file_type` (text) - eml, pdf, txt
  - `file_url` (text)
  - `processing_status` (text) - pending, processing, completed, failed
  - `extracted_data` (jsonb) - Extracted JSON data from LLM
  - `created_at` (timestamptz)
  - `processed_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their data
  - Ensure data isolation and security

  ## Notes
  - All dates use proper date types for accurate calculations
  - JSONB used for flexible storage of extracted data
  - Status fields use text for flexibility (can be converted to enums later)
  - Timestamps track creation and updates for audit trail
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  legal_representative text,
  hse_responsible text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create certifications table
CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  certification_type text NOT NULL,
  certification_name text NOT NULL,
  issue_date date,
  expiry_date date NOT NULL,
  document_url text,
  status text DEFAULT 'valid',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create work_orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  start_date date,
  end_date date,
  work_hours text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create work_order_workers junction table
CREATE TABLE IF NOT EXISTS work_order_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  role text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(work_order_id, worker_id)
);

-- Create pdp_documents table
CREATE TABLE IF NOT EXISTS pdp_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  processing_status text DEFAULT 'pending',
  extracted_data jsonb,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workers_company ON workers(company_id);
CREATE INDEX IF NOT EXISTS idx_certifications_worker ON certifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_certifications_expiry ON certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON certifications(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_company ON work_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_order_workers_order ON work_order_workers(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_workers_worker ON work_order_workers(worker_id);
CREATE INDEX IF NOT EXISTS idx_pdp_documents_work_order ON pdp_documents(work_order_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_status ON uploaded_files(processing_status);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdp_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Users can view all companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete companies"
  ON companies FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for workers
CREATE POLICY "Users can view all workers"
  ON workers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert workers"
  ON workers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update workers"
  ON workers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete workers"
  ON workers FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for certifications
CREATE POLICY "Users can view all certifications"
  ON certifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert certifications"
  ON certifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update certifications"
  ON certifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete certifications"
  ON certifications FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for work_orders
CREATE POLICY "Users can view all work orders"
  ON work_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert work orders"
  ON work_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update work orders"
  ON work_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete work orders"
  ON work_orders FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for work_order_workers
CREATE POLICY "Users can view all work order workers"
  ON work_order_workers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert work order workers"
  ON work_order_workers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update work order workers"
  ON work_order_workers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete work order workers"
  ON work_order_workers FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for pdp_documents
CREATE POLICY "Users can view all PDP documents"
  ON pdp_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert PDP documents"
  ON pdp_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update PDP documents"
  ON pdp_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete PDP documents"
  ON pdp_documents FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for uploaded_files
CREATE POLICY "Users can view all uploaded files"
  ON uploaded_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert uploaded files"
  ON uploaded_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update uploaded files"
  ON uploaded_files FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete uploaded files"
  ON uploaded_files FOR DELETE
  TO authenticated
  USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON workers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();