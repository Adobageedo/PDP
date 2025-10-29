import { useState, useEffect } from 'react';
import { FileText, Download, Users, FileDown } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { DataReview } from './components/DataReview';
import { CertificationTable } from './components/CertificationTable';
import { AlertPanel } from './components/AlertPanel';
import { parseFile } from './utils/fileParser';
import { extractDataWithLLM, validateExtractedData } from './services/llmExtractionService';
import { 
  saveExtractedData, 
  getWorkersByCompany, 
  getAllCertifications,
  updateWorker,
  deleteWorker,
  updateCertification,
  deleteCertification 
} from './services/dataService';
import { validateCertifications } from './utils/certificationValidator';
import { exportCertificationAlerts, exportWorkersWithCertifications } from './utils/exportUtils';
import { generateDocumentFromTemplate, downloadDocument } from './services/wordTemplateGenerator';
import { ExtractedData, CertificationAlert } from './types';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<CertificationAlert[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'review' | 'workers'>('upload');
  const [stats, setStats] = useState({ validCount: 0, expiredCount: 0, expiringSoonCount: 0 });
  const [wordTemplate, setWordTemplate] = useState<ArrayBuffer | null>(null);
  const [templateFileName, setTemplateFileName] = useState<string>('');

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

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setProcessingStatus('📤 Uploading file to server...');
    
    try {
      // Import API service
      const apiService = (await import('./services/api.service')).default;
      
      // Use SSE for real-time progress
      const response = await apiService.processEMLFileWithProgress(file, (update) => {
        console.log('Progress:', update);
        
        switch (update.step) {
          case 'parsing':
            setProcessingStatus('📧 Parsing EML file...');
            break;
          case 'parsed':
            setProcessingStatus(`📎 Found ${update.attachmentCount} attachments`);
            break;
          case 'extracting':
            setProcessingStatus(`📎 Processing ${update.attachmentCount} attachments...`);
            break;
          case 'attachment':
            setProcessingStatus(`📄 Extracting: ${update.filename} (${update.current}/${update.total})`);
            break;
          case 'extracting_body':
            setProcessingStatus('📧 Extracting data from email body...');
            break;
          case 'llm_thinking':
            setProcessingStatus('🤖 LLM is analyzing the data...');
            break;
          default:
            setProcessingStatus(update.message);
        }
      });
      
      setProcessingStatus('✔️ Validating extracted data...');
      const validation = validateExtractedData(response.data);

      if (!validation.isValid) {
        alert('Errors detected:\n' + validation.errors.join('\n'));
      }

      setExtractedData(response.data);
      setActiveTab('review');
      setProcessingStatus('✅ Extraction complete!');
      
      setTimeout(() => setProcessingStatus(''), 2000);
      
      console.log('✅ Extraction successful:', response.metadata);
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
    if (!extractedData) return;

    setIsProcessing(true);
    try {
      await saveExtractedData(extractedData);
      await loadData();
      setExtractedData(null);
      setActiveTab('workers');
      alert('Données enregistrées avec succès');
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

  const handleTemplateUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      setWordTemplate(buffer);
      setTemplateFileName(file.name);
      alert('Template chargé avec succès');
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Erreur lors du chargement du template');
    }
  };

  const handleGenerateDocument = async () => {
    if (!extractedData || !wordTemplate) {
      alert('Veuillez charger un template et des données');
      return;
    }

    setIsProcessing(true);
    try {
      const docBlob = await generateDocumentFromTemplate(wordTemplate, extractedData);
      downloadDocument(docBlob, `PDP_${extractedData.company?.name || 'document'}_${new Date().toISOString().split('T')[0]}.docx`);
      alert('Document généré avec succès');
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Erreur lors de la génération du document: ' + error);
    } finally {
      setIsProcessing(false);
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
                onClick={() => setActiveTab('workers')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'workers'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Intervenants
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && !extractedData && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Importer un document
              </h2>
              <FileUpload
                onFileSelect={handleFileSelect}
                isProcessing={isProcessing}
                processingStatus={processingStatus}
              />
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

        {activeTab === 'review' && extractedData && (
          <DataReview
            data={extractedData}
            onChange={handleDataChange}
            onAccept={handleAcceptData}
            onReject={handleRejectData}
          />
        )}

        {activeTab === 'workers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Liste des intervenants
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

export default App;
