import { Building2, Users, Briefcase, Check, X } from 'lucide-react';
import { ExtractedData } from '../types';

interface DataReviewProps {
  data: ExtractedData;
  onAccept: () => void;
  onReject: () => void;
}

export function DataReview({ data, onAccept, onReject }: DataReviewProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Données extraites
        </h2>
        <div className="flex gap-2">
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
          <div className="space-y-4">
            {data.workers.map((worker, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded p-3 text-sm space-y-2"
              >
                <div className="font-medium text-gray-900">
                  {worker.first_name} {worker.last_name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  {worker.phone && <div>Tél: {worker.phone}</div>}
                  {worker.email && <div>Email: {worker.email}</div>}
                </div>
                {worker.certifications && worker.certifications.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Habilitations:
                    </div>
                    <ul className="space-y-1 text-xs">
                      {worker.certifications.map((cert, certIndex) => (
                        <li key={certIndex} className="flex justify-between">
                          <span>{cert.certification_name}</span>
                          <span className="text-gray-500">
                            Expire le:{' '}
                            {new Date(cert.expiry_date).toLocaleDateString(
                              'fr-FR'
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.work_order && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Ordre de travail</h3>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <dt className="font-medium text-gray-500">Titre</dt>
              <dd className="text-gray-900">{data.work_order.title}</dd>
            </div>
            {data.work_order.description && (
              <div className="col-span-2">
                <dt className="font-medium text-gray-500">Description</dt>
                <dd className="text-gray-900">{data.work_order.description}</dd>
              </div>
            )}
            {data.work_order.start_date && (
              <div>
                <dt className="font-medium text-gray-500">Date de début</dt>
                <dd className="text-gray-900">
                  {new Date(data.work_order.start_date).toLocaleDateString(
                    'fr-FR'
                  )}
                </dd>
              </div>
            )}
            {data.work_order.end_date && (
              <div>
                <dt className="font-medium text-gray-500">Date de fin</dt>
                <dd className="text-gray-900">
                  {new Date(data.work_order.end_date).toLocaleDateString(
                    'fr-FR'
                  )}
                </dd>
              </div>
            )}
            {data.work_order.work_hours && (
              <div className="col-span-2">
                <dt className="font-medium text-gray-500">Horaires</dt>
                <dd className="text-gray-900">{data.work_order.work_hours}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
