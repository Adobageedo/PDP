import { Building2, Users, Check, X, Trash2, Edit2 } from 'lucide-react';
import { ExtractedData } from '../types';
import { useState } from 'react';

interface DataReviewProps {
  data: ExtractedData;
  onAccept: () => void;
  onReject: () => void;
  onChange?: (data: ExtractedData) => void;
  onTemplateUpload?: (file: File) => void;
  onGenerateDocument?: () => void;
  hasTemplate?: boolean;
}

export function DataReview({ 
  data, 
  onAccept, 
  onReject,
  onChange
}: DataReviewProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  const updateWorker = (index: number, field: string, value: string) => {
    if (!onChange || !data.workers) return;
    
    const workers = data.workers.map((worker, idx) => 
      idx === index ? { ...worker, [field]: value } : worker
    );
    onChange({ ...data, workers });
  };

  const updateCertification = (workerIdx: number, certIdx: number, field: string, value: string | null) => {
    if (!onChange || !data.workers) return;
    
    const workers = data.workers.map((worker, wIdx) => {
      if (wIdx !== workerIdx || !worker.certifications) return worker;
      
      const certifications = worker.certifications.map((cert, cIdx) => 
        cIdx === certIdx ? { ...cert, [field]: value } : cert
      );
      return { ...worker, certifications };
    });
    
    onChange({ ...data, workers });
  };

  const removeCertification = (workerIdx: number, certIdx: number) => {
    if (!onChange || !data.workers || !confirm('Supprimer cette certification ?')) return;
    
    const workers = data.workers.map((worker, wIdx) => {
      if (wIdx !== workerIdx || !worker.certifications) return worker;
      return {
        ...worker,
        certifications: worker.certifications.filter((_cert, cIdx) => cIdx !== certIdx)
      };
    });
    
    onChange({ ...data, workers });
  };

  const removeWorker = (index: number) => {
    if (!onChange || !data.workers || !confirm('Supprimer cet intervenant ?')) return;
    
    const workers = data.workers.filter((_worker, idx) => idx !== index);
    onChange({ ...data, workers });
  };
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Données extraites
        </h2>
        <div className="flex gap-2">
          {!isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Modifier
            </button>
          )}
          {isEditMode && (
            <button
              onClick={() => setIsEditMode(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" />
              Terminer l'édition
            </button>
          )}
          <button
            onClick={onReject}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg flex items-center gap-2 transition-colors"
          >
            <X className="w-4 h-4" />
            Rejeter
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4" />
            Accepter et enregistrer
          </button>
        </div>
      </div>

      {data.company && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Entreprise</h3>
          </div>
          {!isEditMode ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Nom</dt>
                <dd className="text-gray-900">{data.company.name}</dd>
              </div>
            {data.company.address && (
              <div>
                <dt className="font-medium text-gray-500">Adresse</dt>
                <dd className="text-gray-900">{data.company.address}</dd>
              </div>
            )}
            {data.company.phone && (
              <div>
                <dt className="font-medium text-gray-500">Téléphone</dt>
                <dd className="text-gray-900">{data.company.phone}</dd>
              </div>
            )}
            {data.company.email && (
              <div>
                <dt className="font-medium text-gray-500">Email</dt>
                <dd className="text-gray-900">{data.company.email}</dd>
              </div>
            )}
            {data.company.legal_representative && (
              <div>
                <dt className="font-medium text-gray-500">
                  Représentant légal
                </dt>
                <dd className="text-gray-900">
                  {data.company.legal_representative}
                </dd>
              </div>
            )}
            {data.company.hse_responsible && (
              <div>
                <dt className="font-medium text-gray-500">Responsable HSE</dt>
                <dd className="text-gray-900">{data.company.hse_responsible}</dd>
              </div>
            )}
          </dl>
          ) : (
            <p className="text-sm text-gray-600 italic">
              Cliquez sur "Modifier" pour éditer les informations de l'entreprise
            </p>
          )}
        </div>
      )}

      {data.workers && data.workers.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              Intervenants ({data.workers.length})
            </h3>
          </div>
          {!isEditMode ? (
            <p className="text-sm text-gray-600 italic">
              Cliquez sur "Modifier" pour éditer les informations des intervenants
            </p>
          ) : (
            <div className="space-y-4">
              {data.workers.map((worker, workerIndex) => (
              <div
                key={workerIndex}
                className="bg-gray-50 rounded p-4 text-sm space-y-3 border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Prénom</label>
                      <input
                        type="text"
                        value={worker.first_name}
                        onChange={(e) => updateWorker(workerIndex, 'first_name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nom</label>
                      <input
                        type="text"
                        value={worker.last_name}
                        onChange={(e) => updateWorker(workerIndex, 'last_name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
                      <input
                        type="text"
                        value={worker.phone || ''}
                        onChange={(e) => updateWorker(workerIndex, 'phone', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={worker.email || ''}
                        onChange={(e) => updateWorker(workerIndex, 'email', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeWorker(workerIndex)}
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Supprimer l'intervenant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {worker.certifications && worker.certifications.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-700 mb-2">
                      Habilitations:
                    </div>
                    <div className="space-y-2">
                      {worker.certifications.map((cert, certIndex) => (
                        <div key={certIndex} className="flex gap-2 items-start bg-white p-2 rounded border border-gray-200">
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Type</label>
                              <input
                                type="text"
                                value={cert.certification_type}
                                onChange={(e) => updateCertification(workerIndex, certIndex, 'certification_type', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Nom</label>
                              <input
                                type="text"
                                value={cert.certification_name}
                                onChange={(e) => updateCertification(workerIndex, certIndex, 'certification_name', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Date d'expiration</label>
                              <input
                                type="date"
                                value={cert.expiry_date || ''}
                                onChange={(e) => updateCertification(workerIndex, certIndex, 'expiry_date', e.target.value || null)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeCertification(workerIndex, certIndex)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded mt-5"
                            title="Supprimer la certification"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
