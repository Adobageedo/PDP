import { supabase } from '../lib/supabase';
import { Company, Worker, Certification, WorkOrder, ExtractedData } from '../types';
import { updateCertificationStatus } from '../utils/certificationValidator';

export async function saveExtractedData(data: ExtractedData): Promise<{
  companyId?: string;
  workerIds: string[];
  workOrderId?: string;
}> {
  const result: { companyId?: string; workerIds: string[]; workOrderId?: string } = {
    workerIds: [],
  };

  if (data.company) {
    const companyId = await saveCompany(data.company);
    result.companyId = companyId;

    if (data.work_order) {
      data.work_order.company_id = companyId;
    }

    if (data.workers) {
      data.workers.forEach((worker) => {
        worker.company_id = companyId;
      });
    }
  }

  if (data.work_order) {
    const workOrderId = await saveWorkOrder(data.work_order);
    result.workOrderId = workOrderId;
  }

  if (data.workers && data.workers.length > 0) {
    for (const workerData of data.workers) {
      const workerId = await saveWorker(workerData);
      result.workerIds.push(workerId);

      if (workerData.certifications && workerData.certifications.length > 0) {
        for (const cert of workerData.certifications) {
          cert.worker_id = workerId;
          await saveCertification(cert);
        }
      }
    }
  }

  return result;
}

export async function saveCompany(company: Company): Promise<string> {
  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: company.name,
      address: company.address,
      phone: company.phone,
      email: company.email,
      legal_representative: company.legal_representative,
      hse_responsible: company.hse_responsible,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save company: ${error.message}`);
  }

  return data.id;
}

export async function saveWorker(worker: Worker): Promise<string> {
  const { data, error } = await supabase
    .from('workers')
    .insert({
      company_id: worker.company_id,
      first_name: worker.first_name,
      last_name: worker.last_name,
      phone: worker.phone,
      email: worker.email,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save worker: ${error.message}`);
  }

  return data.id;
}

export async function saveCertification(certification: Certification): Promise<string> {
  const certWithStatus = updateCertificationStatus(certification);

  const { data, error } = await supabase
    .from('certifications')
    .insert({
      worker_id: certWithStatus.worker_id,
      certification_type: certWithStatus.certification_type,
      certification_name: certWithStatus.certification_name,
      issue_date: certWithStatus.issue_date,
      expiry_date: certWithStatus.expiry_date,
      document_url: certWithStatus.document_url,
      status: certWithStatus.status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save certification: ${error.message}`);
  }

  return data.id;
}

export async function saveWorkOrder(workOrder: WorkOrder): Promise<string> {
  const { data, error } = await supabase
    .from('work_orders')
    .insert({
      company_id: workOrder.company_id,
      title: workOrder.title,
      description: workOrder.description,
      start_date: workOrder.start_date,
      end_date: workOrder.end_date,
      work_hours: workOrder.work_hours,
      status: workOrder.status || 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save work order: ${error.message}`);
  }

  return data.id;
}

export async function getCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  return data;
}

export async function getWorkersByCompany(companyId: string) {
  const { data, error } = await supabase
    .from('workers')
    .select('*, certifications(*)')
    .eq('company_id', companyId)
    .order('last_name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch workers: ${error.message}`);
  }

  return data;
}

export async function getAllCertifications() {
  const { data, error } = await supabase
    .from('certifications')
    .select('*, workers(first_name, last_name)')
    .order('expiry_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch certifications: ${error.message}`);
  }

  return data;
}

export async function getWorkOrders() {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*, companies(name)')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch work orders: ${error.message}`);
  }

  return data;
}
