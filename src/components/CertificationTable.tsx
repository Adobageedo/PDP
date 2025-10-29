import { AlertTriangle, CheckCircle, Clock, Edit2, Trash2, Save, X } from 'lucide-react';
import { formatDate, getDaysUntilExpiry } from '../utils/certificationValidator';
import { useState } from 'react';

interface Certification {
  id: string;
  certification_name: string;
  certification_type: string;
  expiry_date: string;
  status: 'valid' | 'expired' | 'expiring_soon';
}

interface Worker {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  certifications: Certification[];
}

interface CertificationTableProps {
  workers: Worker[];
  onUpdateWorker?: (workerId: string, updates: Partial<Worker>) => void;
  onDeleteWorker?: (workerId: string) => void;
  onUpdateCertification?: (workerId: string, certId: string, updates: Partial<Certification>) => void;
  onDeleteCertification?: (workerId: string, certId: string) => void;
}

export function CertificationTable({ 
  workers, 
  onUpdateWorker, 
  onDeleteWorker,
  onUpdateCertification,
  onDeleteCertification 
}: CertificationTableProps) {
  const [editingWorker, setEditingWorker] = useState<string | null>(null);
  const [editingCert, setEditingCert] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const getStatusIcon = (status: string, daysUntilExpiry: number) => {
    if (status === 'expired') {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    } else if (status === 'expiring_soon') {
      return <Clock className="w-5 h-5 text-orange-500" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getStatusText = (status: string, daysUntilExpiry: number) => {
    if (status === 'expired') {
      return 'Expiré';
    } else if (status === 'expiring_soon') {
      return `Expire dans ${daysUntilExpiry} jours`;
    }
    return 'Valide';
  };

  const getStatusColor = (status: string) => {
    if (status === 'expired') {
      return 'bg-red-50 border-red-200';
    } else if (status === 'expiring_soon') {
      return 'bg-orange-50 border-orange-200';
    }
    return 'bg-white';
  };

  const startEditWorker = (worker: Worker) => {
    setEditingWorker(worker.id);
    setEditForm({
      first_name: worker.first_name,
      last_name: worker.last_name,
      phone: worker.phone || '',
      email: worker.email || ''
    });
  };

  const saveWorker = (workerId: string) => {
    if (onUpdateWorker) {
      onUpdateWorker(workerId, editForm);
    }
    setEditingWorker(null);
    setEditForm({});
  };

  const startEditCert = (cert: Certification) => {
    setEditingCert(cert.id);
    setEditForm({
      certification_name: cert.certification_name,
      certification_type: cert.certification_type,
      expiry_date: cert.expiry_date
    });
  };

  const saveCert = (workerId: string, certId: string) => {
    if (onUpdateCertification) {
      onUpdateCertification(workerId, certId, editForm);
    }
    setEditingCert(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingWorker(null);
    setEditingCert(null);
    setEditForm({});
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Intervenant
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Habilitation
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date d'expiration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {workers.map((worker) =>
            worker.certifications && worker.certifications.length > 0 ? (
              worker.certifications.map((cert, certIndex) => {
                const daysUntilExpiry = getDaysUntilExpiry(cert.expiry_date);
                return (
                  <tr
                    key={`${worker.id}-${cert.id}`}
                    className={`border-l-4 ${getStatusColor(cert.status)}`}
                  >
                    {certIndex === 0 ? (
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        rowSpan={worker.certifications.length}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium text-gray-900">
                            {worker.first_name} {worker.last_name}
                          </div>
                          <button
                            onClick={() => onDeleteWorker && confirm(`Supprimer ${worker.first_name} ${worker.last_name} ?`) && onDeleteWorker(worker.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Supprimer l'intervenant"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    ) : null}
                    {certIndex === 0 ? (
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        rowSpan={worker.certifications.length}
                      >
                        <div className="text-sm text-gray-500">
                          {worker.phone && <div>{worker.phone}</div>}
                          {worker.email && <div>{worker.email}</div>}
                        </div>
                      </td>
                    ) : null}
                    <td className="px-6 py-4">
                      {editingCert === cert.id ? (
                        <input
                          type="text"
                          value={editForm.certification_name}
                          onChange={(e) => setEditForm({...editForm, certification_name: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">
                          {cert.certification_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCert === cert.id ? (
                        <input
                          type="text"
                          value={editForm.certification_type}
                          onChange={(e) => setEditForm({...editForm, certification_type: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">
                          {cert.certification_type}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCert === cert.id ? (
                        <input
                          type="date"
                          value={editForm.expiry_date}
                          onChange={(e) => setEditForm({...editForm, expiry_date: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">
                          {formatDate(cert.expiry_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(cert.status, daysUntilExpiry)}
                        <span className="text-sm">
                          {getStatusText(cert.status, daysUntilExpiry)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {editingCert === cert.id ? (
                          <>
                            <button
                              onClick={() => saveCert(worker.id, cert.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Sauvegarder"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditCert(cert)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteCertification && onDeleteCertification(worker.id, cert.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr key={worker.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {worker.first_name} {worker.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {worker.phone && <div>{worker.phone}</div>}
                    {worker.email && <div>{worker.email}</div>}
                  </div>
                </td>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-sm text-gray-400 text-center"
                >
                  Aucune habilitation enregistrée
                </td>
              </tr>
            )
          )}
          {workers.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-8 text-center text-sm text-gray-500"
              >
                Aucun intervenant trouvé
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
