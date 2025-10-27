import { AlertTriangle } from 'lucide-react';
import { CertificationAlert } from '../types';
import { formatDate } from '../utils/certificationValidator';

interface AlertPanelProps {
  alerts: CertificationAlert[];
}

export function AlertPanel({ alerts }: AlertPanelProps) {
  if (alerts.length === 0) {
    return null;
  }

  const expiredAlerts = alerts.filter((a) => a.status === 'expired');
  const expiringSoonAlerts = alerts.filter((a) => a.status === 'expiring_soon');

  return (
    <div className="space-y-4">
      {expiredAlerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                Habilitations expirées ({expiredAlerts.length})
              </h3>
              <ul className="space-y-2">
                {expiredAlerts.map((alert, index) => (
                  <li key={index} className="text-sm text-red-700">
                    <span className="font-medium">{alert.worker_name}</span> -{' '}
                    {alert.certification_name} (expiré le{' '}
                    {formatDate(alert.expiry_date)})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {expiringSoonAlerts.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-orange-800 mb-2">
                Habilitations expirant bientôt ({expiringSoonAlerts.length})
              </h3>
              <ul className="space-y-2">
                {expiringSoonAlerts.map((alert, index) => (
                  <li key={index} className="text-sm text-orange-700">
                    <span className="font-medium">{alert.worker_name}</span> -{' '}
                    {alert.certification_name} (expire dans{' '}
                    {alert.days_until_expiry} jours)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
