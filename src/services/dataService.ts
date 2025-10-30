import { Company, Worker, Certification, ExtractedData, PDP } from '../types';
import { updateCertificationStatus } from '../utils/certificationValidator';

// Storage keys
const STORAGE_KEY = 'wind_farm_data';

interface StorageData {
  companies: Array<Company & { id: string; created_at: string }>;
  workers: Array<Worker & { id: string; created_at: string }>;
  certifications: Array<Certification & { id: string; created_at: string }>;
  pdps: Array<PDP>;
}

// Helper to generate UUID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Get data from localStorage
function getStorageData(): StorageData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { companies: [], workers: [], certifications: [], pdps: [] };
  }
  const data = JSON.parse(stored);
  // Ensure pdps array exists for backward compatibility
  if (!data.pdps) {
    data.pdps = [];
  }
  return data;
}

// Save data to localStorage
function saveStorageData(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function saveExtractedData(data: ExtractedData): Promise<{
  companyId?: string;
  workerIds: string[];
}> {
  const result: { companyId?: string; workerIds: string[] } = {
    workerIds: [],
  };

  if (data.company) {
    const companyId = await saveCompany(data.company);
    result.companyId = companyId;

    if (data.workers) {
      data.workers.forEach((worker) => {
        worker.company_id = companyId;
      });
    }
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
  const storage = getStorageData();
  const id = generateId();
  const newCompany = {
    ...company,
    id,
    created_at: new Date().toISOString(),
  };
  
  storage.companies.push(newCompany);
  saveStorageData(storage);
  
  return id;
}

export async function saveWorker(worker: Worker): Promise<string> {
  const storage = getStorageData();
  const id = generateId();
  const newWorker = {
    ...worker,
    id,
    created_at: new Date().toISOString(),
  };
  
  storage.workers.push(newWorker);
  saveStorageData(storage);
  
  return id;
}

export async function saveCertification(certification: Certification): Promise<string> {
  const storage = getStorageData();
  const certWithStatus = updateCertificationStatus(certification);
  const id = generateId();
  const newCertification = {
    ...certWithStatus,
    id,
    created_at: new Date().toISOString(),
  };
  
  storage.certifications.push(newCertification);
  saveStorageData(storage);
  
  return id;
}

export async function getCompanies() {
  const storage = getStorageData();
  return storage.companies.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getWorkersByCompany(companyId: string) {
  const storage = getStorageData();
  const workers = storage.workers
    .filter(w => w.company_id === companyId)
    .sort((a, b) => a.last_name.localeCompare(b.last_name));
  
  // Attach certifications to workers
  return workers.map(worker => ({
    ...worker,
    certifications: storage.certifications.filter(c => c.worker_id === worker.id),
  }));
}

export async function getAllCertifications() {
  const storage = getStorageData();
  
  // Attach worker info to certifications
  return storage.certifications
    .map(cert => {
      const worker = storage.workers.find(w => w.id === cert.worker_id);
      return {
        ...cert,
        workers: worker ? {
          first_name: worker.first_name,
          last_name: worker.last_name,
        } : null,
      };
    })
    .sort((a, b) => {
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
    });
}

export async function updateWorker(workerId: string, updates: Partial<Worker>): Promise<void> {
  const storage = getStorageData();
  const workerIndex = storage.workers.findIndex(w => w.id === workerId);
  
  if (workerIndex !== -1) {
    storage.workers[workerIndex] = {
      ...storage.workers[workerIndex],
      ...updates,
    };
    saveStorageData(storage);
  }
}

export async function deleteWorker(workerId: string): Promise<void> {
  const storage = getStorageData();
  storage.workers = storage.workers.filter(w => w.id !== workerId);
  storage.certifications = storage.certifications.filter(c => c.worker_id !== workerId);
  saveStorageData(storage);
}

export async function updateCertification(certId: string, updates: Partial<Certification>): Promise<void> {
  const storage = getStorageData();
  const certIndex = storage.certifications.findIndex(c => c.id === certId);
  
  if (certIndex !== -1) {
    const existingCert = storage.certifications[certIndex];
    const updatedCert = updateCertificationStatus({
      ...existingCert,
      ...updates,
    });
    storage.certifications[certIndex] = {
      ...updatedCert,
      id: existingCert.id,
      created_at: existingCert.created_at,
    };
    saveStorageData(storage);
  }
}

export async function deleteCertification(certId: string): Promise<void> {
  const storage = getStorageData();
  storage.certifications = storage.certifications.filter(c => c.id !== certId);
  saveStorageData(storage);
}

// PDP Management Functions
export async function createPDP(pdpData: {
  windfarm_name: string;
  company?: Company;
  worker_ids: string[];
  file_names: string[];
}): Promise<string> {
  const storage = getStorageData();
  const id = generateId();
  
  const newPDP: PDP = {
    id,
    windfarm_name: pdpData.windfarm_name,
    company: pdpData.company,
    worker_ids: pdpData.worker_ids,
    file_names: pdpData.file_names,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  };
  
  storage.pdps.push(newPDP);
  saveStorageData(storage);
  
  return id;
}

export async function getAllPDPs(): Promise<PDP[]> {
  const storage = getStorageData();
  return storage.pdps.sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function getPDPById(pdpId: string): Promise<PDP | null> {
  const storage = getStorageData();
  return storage.pdps.find(p => p.id === pdpId) || null;
}

export async function updatePDP(pdpId: string, updates: Partial<PDP>): Promise<void> {
  const storage = getStorageData();
  const pdpIndex = storage.pdps.findIndex(p => p.id === pdpId);
  
  if (pdpIndex !== -1) {
    storage.pdps[pdpIndex] = {
      ...storage.pdps[pdpIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveStorageData(storage);
  }
}

export async function deletePDP(pdpId: string): Promise<void> {
  const storage = getStorageData();
  storage.pdps = storage.pdps.filter(p => p.id !== pdpId);
  saveStorageData(storage);
}

export async function getPDPWorkers(pdpId: string): Promise<Worker[]> {
  const storage = getStorageData();
  const pdp = storage.pdps.find(p => p.id === pdpId);
  
  if (!pdp) return [];
  
  const workers = storage.workers.filter(w => pdp.worker_ids.includes(w.id));
  
  // Attach certifications to workers
  return workers.map(worker => ({
    ...worker,
    certifications: storage.certifications.filter(c => c.worker_id === worker.id),
  }));
}
