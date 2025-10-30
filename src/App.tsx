import { useState, useEffect } from 'react';
import { FileText, Download, Users } from 'lucide-react';
import { UploadConfiguration, ProcessingConfig } from './components/UploadConfiguration';
import { DataReview } from './components/DataReview';
import { CertificationTable } from './components/CertificationTable';
import { AlertPanel } from './components/AlertPanel';
import { PDPList } from './components/PDPList';
import { PDPDetail } from './components/PDPDetail';
import { validateExtractedData } from './services/llmExtractionService';
import { 
  saveExtractedData, 
  getAllCertifications,
  updateWorker,
  deleteWorker,
  updateCertification,
  deleteCertification,
  createPDP,
  updatePDP,
  getPDPById
} from './services/dataService';
import { validateCertifications } from './utils/certificationValidator';
import { exportCertificationAlerts, exportWorkersWithCertifications } from './utils/exportUtils';
import { ExtractedData, CertificationAlert } from './types';

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<CertificationAlert[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'config' | 'review' | 'workers' | 'pdps' | 'pdp-detail'>('upload');
  const [stats, setStats] = useState({ validCount: 0, expiredCount: 0, expiringSoonCount: 0 });
  const [processingConfig, setProcessingConfig] = useState<ProcessingConfig | null>(null);
  const [currentPDPId, setCurrentPDPId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const certifications = await getAllCertifications();
      const validation = validateCertifications(certifications);

      const workersMap = new Map();
      certifications.forEach((cert: any) => {
        if (cert.workers) {
          const workerId = cert.worker_id;
          if (!workersMap.has(workerId)) {
            workersMap.set(workerId, {
              id: workerId,
              first_name: cert.workers.first_name,
              last_name: cert.workers.last_name,
              certifications: [],
            });
          }
          workersMap.get(workerId).certifications.push(cert);
        }
      });

      const workersWithAlerts = validation.alerts.map(alert => {
        const worker = Array.from(workersMap.values()).find(
          (w: any) => w.id === alert.worker_id
        );
        return {
          ...alert,
          worker_name: worker ? `${worker.first_name} ${worker.last_name}` : 'Inconnu',
        };
      });

      setWorkers(Array.from(workersMap.values()));
      setAlerts(workersWithAlerts);
      setStats({
        validCount: validation.validCount,
        expiredCount: validation.expiredCount,
        expiringSoonCount: validation.expiringSoonCount,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleUploadClick = () => {
    setActiveTab('config');
  };

  const handleConfigCancel = () => {
    setActiveTab('upload');
    setProcessingConfig(null);
  };

  const handleStartProcessing = async (config: ProcessingConfig) => {
    setProcessingConfig(config);
    setIsProcessing(true);
    setProcessingStatus('📤 Uploading files to server...');
    
    try {
      // Import API service
      const apiService = (await import('./services/api.service')).default;
      
      // Process each file
      let allExtractedData: ExtractedData = {
        workers: []
      };
      
      for (let i = 0; i < config.files.length; i++) {
        const file = config.files[i];
        setProcessingStatus(`📄 Processing file ${i + 1}/${config.files.length}: ${file.name}`);
        
        // Use SSE for real-time progress
        const response = await apiService.processEMLFileWithProgress(file, (update) => {
          console.log('Progress:', update);
          
          switch (update.step) {
            case 'parsing':
              setProcessingStatus(`📧 [${i + 1}/${config.files.length}] Parsing file...`);
              break;
            case 'parsed':
              setProcessingStatus(`📎 [${i + 1}/${config.files.length}] Found ${update.attachmentCount} attachments`);
              break;
            case 'extracting':
              setProcessingStatus(`📎 [${i + 1}/${config.files.length}] Processing attachments...`);
              break;
            case 'attachment':
              setProcessingStatus(`📄 [${i + 1}/${config.files.length}] Extracting: ${update.filename}`);
              break;
            case 'extracting_body':
              setProcessingStatus(`📧 [${i + 1}/${config.files.length}] Extracting data from content...`);
              break;
            case 'llm_thinking':
              setProcessingStatus(`🤖 [${i + 1}/${config.files.length}] LLM is analyzing...`);
              break;
            default:
              setProcessingStatus(`[${i + 1}/${config.files.length}] ${update.message}`);
          }
        });
        
        // Merge extracted data
        if (response.data.company && !allExtractedData.company) {
          allExtractedData.company = response.data.company;
        }
        
        if (response.data.workers) {
          allExtractedData.workers = [...(allExtractedData.workers || []), ...response.data.workers];
        }
      }
      
      // Add windfarm name and PDP type to company data
      if (allExtractedData.company) {
        allExtractedData.company = {
          ...allExtractedData.company,
          name: config.windfarmName,
        };
      } else {
        allExtractedData.company = {
          name: config.windfarmName,
          address: null,
          phone: null,
          email: null,
          legal_representative: null,
          hse_responsible: null,
        };
      }
      
      setProcessingStatus('✔️ Validating extracted data...');
      const validation = validateExtractedData(allExtractedData);

      if (!validation.isValid) {
        alert('Errors detected:\n' + validation.errors.join('\n'));
      }

      setExtractedData(allExtractedData);
      setActiveTab('review');
      setProcessingStatus('✅ Extraction complete!');
      
      setTimeout(() => setProcessingStatus(''), 2000);
      
      console.log('✅ Extraction successful:', {
        isNewPDP: config.isNewPDP,
        windfarm: config.windfarmName,
        filesProcessed: config.files.length
      });
    } catch (error) {
      console.error('❌ Error:', error);
      setProcessingStatus('');
      alert(`Error during processing:\n${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDataChange = (updatedData: ExtractedData) => {
    setExtractedData(updatedData);
  };

  const handleAcceptData = async () => {
    if (!extractedData || !processingConfig) return;

    setIsProcessing(true);
    try {
      // Save workers and certifications first
      const result = await saveExtractedData(extractedData);
      
      // Create or update PDP
      if (processingConfig.isNewPDP) {
        // Create new PDP
        const pdpId = await createPDP({
          windfarm_name: processingConfig.windfarmName,
          company: extractedData.company,
          worker_ids: result.workerIds,
          file_names: processingConfig.files.map(f => f.name)
        });
        setCurrentPDPId(pdpId);
        alert(`PDP créé avec succès pour ${processingConfig.windfarmName}`);
      } else if (processingConfig.existingPDPId) {
        // Update existing PDP
        const existingPDP = await getPDPById(processingConfig.existingPDPId);
        if (existingPDP) {
          await updatePDP(processingConfig.existingPDPId, {
            worker_ids: [...new Set([...existingPDP.worker_ids, ...result.workerIds])],
            file_names: [...existingPDP.file_names, ...processingConfig.files.map(f => f.name)]
          });
        }
        setCurrentPDPId(processingConfig.existingPDPId);
        alert('PDP mis à jour avec succès');
      }
      
      await loadData();
      setExtractedData(null);
      setProcessingConfig(null);
      setActiveTab('pdps');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Erreur lors de l\'enregistrement des données');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectData = () => {
    setExtractedData(null);
    setActiveTab('upload');
  };

  const handleSelectPDP = (pdpId: string) => {
    setCurrentPDPId(pdpId);
    setActiveTab('pdp-detail');
  };

  const handleBackToPDPList = () => {
    setCurrentPDPId(null);
    setActiveTab('pdps');
  };

  const handleExportAlerts = () => {
    exportCertificationAlerts(alerts);
  };

  const handleExportWorkers = () => {
    exportWorkersWithCertifications(workers);
  };

  const handleUpdateWorker = async (workerId: string, updates: any) => {
    try {
      await updateWorker(workerId, updates);
      await loadData();
    } catch (error) {
      console.error('Error updating worker:', error);
      alert('Erreur lors de la mise à jour de l\'intervenant');
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    try {
      await deleteWorker(workerId);
      await loadData();
    } catch (error) {
      console.error('Error deleting worker:', error);
      alert('Erreur lors de la suppression de l\'intervenant');
    }
  };

  const handleUpdateCertification = async (workerId: string, certId: string, updates: any) => {
    try {
      await updateCertification(certId, updates);
      await loadData();
    } catch (error) {
      console.error('Error updating certification:', error);
      alert('Erreur lors de la mise à jour de la certification');
    }
  };

  const handleDeleteCertification = async (workerId: string, certId: string) => {
    try {
      if (confirm('Supprimer cette certification ?')) {
        await deleteCertification(certId);
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting certification:', error);
      alert('Erreur lors de la suppression de la certification');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gestion Parc Éolien
                </h1>
                <p className="text-sm text-gray-500">
                  Suivi des habilitations et intervenants
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Import
              </button>
              <button
                onClick={() => setActiveTab('pdps')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'pdps' || activeTab === 'pdp-detail'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-5 h-5 inline mr-2" />
                PDPs
              </button>
              <button
                onClick={() => setActiveTab('workers')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'workers'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                Tous les intervenants
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && !extractedData && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Créer un nouveau PDP
              </h2>
              <p className="text-gray-600 mb-6">
                Importez vos fichiers (EML, PDF, etc.) et configurez votre PDP
              </p>
              <button
                onClick={handleUploadClick}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 mx-auto transition-colors"
              >
                <FileText className="w-5 h-5" />
                Commencer l'import
              </button>
              {processingStatus && (
                <p className="mt-4 text-sm text-blue-600">{processingStatus}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-green-600">
                  {stats.validCount}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Habilitations valides
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-orange-600">
                  {stats.expiringSoonCount}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Expirent bientôt
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-red-600">
                  {stats.expiredCount}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Habilitations expirées
                </div>
              </div>
            </div>

            {alerts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Alertes
                  </h2>
                  <button
                    onClick={handleExportAlerts}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Exporter les alertes
                  </button>
                </div>
                <AlertPanel alerts={alerts} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <UploadConfiguration
            onStartProcessing={handleStartProcessing}
            onCancel={handleConfigCancel}
          />
        )}

        {activeTab === 'review' && extractedData && (
          <DataReview
            data={extractedData}
            onChange={handleDataChange}
            onAccept={handleAcceptData}
            onReject={handleRejectData}
          />
        )}

        {activeTab === 'pdps' && (
          <PDPList onSelectPDP={handleSelectPDP} />
        )}

        {activeTab === 'pdp-detail' && currentPDPId && (
          <PDPDetail
            pdpId={currentPDPId}
            onBack={handleBackToPDPList}
            onUpdateWorker={handleUpdateWorker}
            onDeleteWorker={handleDeleteWorker}
            onUpdateCertification={handleUpdateCertification}
            onDeleteCertification={handleDeleteCertification}
          />
        )}

        {activeTab === 'workers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Tous les intervenants
                </h2>
              </div>
              <button
                onClick={handleExportWorkers}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter en Excel
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <CertificationTable 
                workers={workers}
                onUpdateWorker={handleUpdateWorker}
                onDeleteWorker={handleDeleteWorker}
                onUpdateCertification={handleUpdateCertification}
                onDeleteCertification={handleDeleteCertification}
              />
            </div>

            {alerts.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Alertes
                </h3>
                <AlertPanel alerts={alerts} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}