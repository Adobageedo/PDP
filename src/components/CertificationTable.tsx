import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatDate, getDaysUntilExpiry } from '../utils/certificationValidator';

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
}

export function CertificationTable({ workers }: CertificationTableProps) {
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
                        <div className="text-sm font-medium text-gray-900">
                          {worker.first_name} {worker.last_name}
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
                      <div className="text-sm text-gray-900">
                        {cert.certification_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {cert.certification_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(cert.expiry_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(cert.status, daysUntilExpiry)}
                        <span className="text-sm">
                          {getStatusText(cert.status, daysUntilExpiry)}
                        </span>
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
