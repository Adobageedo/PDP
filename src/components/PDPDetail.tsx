import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Calendar, FileText, Users, Download } from 'lucide-react';
import { getPDPById, getPDPWorkers } from '../services/dataService';
import type { PDP, ExtractedData } from '../types';
import { CertificationTable } from './CertificationTable';
import { PDPDocumentGenerator } from './PDPDocumentGenerator';

interface PDPDetailProps {
  pdpId: string;
  onBack: () => void;
  onUpdateWorker?: (workerId: string, updates: any) => void;
  onDeleteWorker?: (workerId: string) => void;
  onUpdateCertification?: (workerId: string, certId: string, updates: any) => void;
  onDeleteCertification?: (workerId: string, certId: string) => void;
}

export function PDPDetail({ 
  pdpId, 
  onBack,
  onUpdateWorker,
  onDeleteWorker,
  onUpdateCertification,
  onDeleteCertification 
}: PDPDetailProps) {
  const [pdp, setPdp] = useState<PDP | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPDP();
  }, [pdpId]);

  const loadPDP = async () => {
    try {
      const pdpData = await getPDPById(pdpId);
      setPdp(pdpData);
      
      if (pdpData) {
        const pdpWorkers = await getPDPWorkers(pdpId);
        setWorkers(pdpWorkers);
      }
    } catch (error) {
      console.error('Error loading PDP:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!pdp) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">PDP introuvable</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {pdp.windfarm_name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Créé le {new Date(pdp.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Modifié le {new Date(pdp.updated_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              pdp.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {pdp.is_active ? 'Actif' : 'Archivé'}
          </span>
        </div>
      </div>

      {/* Company Info */}
      {pdp.company && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Entreprise</h2>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {pdp.company.name && (
              <div>
                <dt className="font-medium text-gray-500">Nom</dt>
                <dd className="text-gray-900">{pdp.company.name}</dd>
              </div>
            )}
            {pdp.company.address && (
              <div>
                <dt className="font-medium text-gray-500">Adresse</dt>
                <dd className="text-gray-900">{pdp.company.address}</dd>
              </div>
            )}
            {pdp.company.phone && (
              <div>
                <dt className="font-medium text-gray-500">Téléphone</dt>
                <dd className="text-gray-900">{pdp.company.phone}</dd>
              </div>
            )}
            {pdp.company.email && (
              <div>
                <dt className="font-medium text-gray-500">Email</dt>
                <dd className="text-gray-900">{pdp.company.email}</dd>
              </div>
            )}
            {pdp.company.legal_representative && (
              <div>
                <dt className="font-medium text-gray-500">Représentant légal</dt>
                <dd className="text-gray-900">{pdp.company.legal_representative}</dd>
              </div>
            )}
            {pdp.company.hse_responsible && (
              <div>
                <dt className="font-medium text-gray-500">Responsable HSE</dt>
                <dd className="text-gray-900">{pdp.company.hse_responsible}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Files */}
      {pdp.file_names.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Fichiers ({pdp.file_names.length})
              </h2>
            </div>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" />
              Télécharger tout (ZIP)
            </button>
          </div>
          <ul className="space-y-2">
            {pdp.file_names.map((filename, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-900">{filename}</span>
                <FileText className="w-4 h-4 text-gray-400" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Document Generator */}
      <PDPDocumentGenerator 
        pdp={pdp}
        extractedData={{
          company: pdp.company,
          workers: workers.map(w => ({
            id: w.id,
            first_name: w.first_name,
            last_name: w.last_name,
            phone: w.phone,
            email: w.email,
            certifications: w.certifications || []
          }))
        }}
      />

      {/* Workers */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Intervenants ({workers.length})
          </h2>
        </div>
        {workers.length > 0 ? (
          <div className="overflow-hidden">
            <CertificationTable
              workers={workers}
              onUpdateWorker={onUpdateWorker}
              onDeleteWorker={onDeleteWorker}
              onUpdateCertification={onUpdateCertification}
              onDeleteCertification={onDeleteCertification}
            />
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Aucun intervenant associé à ce PDP
          </p>
        )}
      </div>
    </div>
  );
}
