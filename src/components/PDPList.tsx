import { useEffect, useState } from 'react';
import { Briefcase, Calendar, Users, FileText, Eye } from 'lucide-react';
import { getAllPDPs } from '../services/dataService';
import { PDP } from '../types';

interface PDPListProps {
  onSelectPDP: (pdpId: string) => void;
}

export function PDPList({ onSelectPDP }: PDPListProps) {
  const [pdps, setPdps] = useState<PDP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPDPs();
  }, []);

  const loadPDPs = async () => {
    try {
      const allPDPs = await getAllPDPs();
      setPdps(allPDPs);
    } catch (error) {
      console.error('Error loading PDPs:', error);
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

  if (pdps.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun PDP créé
        </h3>
        <p className="text-gray-600">
          Commencez par créer un nouveau PDP en important vos documents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Liste des PDPs
        </h2>
        <div className="text-sm text-gray-600">
          {pdps.length} PDP{pdps.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pdps.map((pdp) => (
          <div
            key={pdp.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {pdp.windfarm_name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Créé le {new Date(pdp.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pdp.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {pdp.is_active ? 'Actif' : 'Archivé'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>{pdp.worker_ids.length} intervenant{pdp.worker_ids.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FileText className="w-4 h-4" />
                  <span>{pdp.file_names.length} fichier{pdp.file_names.length > 1 ? 's' : ''}</span>
                </div>
              </div>

              {pdp.company && (
                <div className="text-sm text-gray-600 mb-4 pt-4 border-t border-gray-200">
                  <div className="font-medium">Entreprise</div>
                  <div>{pdp.company.name}</div>
                </div>
              )}

              <button
                onClick={() => onSelectPDP(pdp.id)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Voir les détails
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
