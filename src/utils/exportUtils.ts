import { CertificationAlert } from '../types';

export function generateCSV(
  data: any[],
  headers: { key: string; label: string }[]
): string {
  const headerRow = headers.map((h) => h.label).join(',');
  const dataRows = data.map((row) =>
    headers.map((h) => {
      const value = row[h.key] ?? '';
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCertificationAlerts(alerts: CertificationAlert[]): void {
  const headers = [
    { key: 'worker_name', label: 'Intervenant' },
    { key: 'certification_name', label: 'Habilitation' },
    { key: 'expiry_date', label: 'Date d\'expiration' },
    { key: 'days_until_expiry', label: 'Jours restants' },
    { key: 'status', label: 'Statut' },
  ];

  const formattedData = alerts.map((alert) => ({
    worker_name: alert.worker_name,
    certification_name: alert.certification_name,
    expiry_date: new Date(alert.expiry_date).toLocaleDateString('fr-FR'),
    days_until_expiry: alert.days_until_expiry,
    status: alert.status === 'expired' ? 'Expiré' : 'Expire bientôt',
  }));

  const csv = generateCSV(formattedData, headers);
  const filename = `alertes-habilitations-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
}

export function exportWorkersWithCertifications(workers: any[]): void {
  const headers = [
    { key: 'company', label: 'Entreprise' },
    { key: 'last_name', label: 'Nom' },
    { key: 'first_name', label: 'Prénom' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'email', label: 'Email' },
    { key: 'certification_name', label: 'Habilitation' },
    { key: 'certification_type', label: 'Type' },
    { key: 'expiry_date', label: 'Date d\'expiration' },
    { key: 'status', label: 'Statut' },
  ];

  const flatData: any[] = [];

  workers.forEach((worker) => {
    if (worker.certifications && worker.certifications.length > 0) {
      worker.certifications.forEach((cert: any) => {
        flatData.push({
          company: worker.company_name || '',
          last_name: worker.last_name,
          first_name: worker.first_name,
          phone: worker.phone || '',
          email: worker.email || '',
          certification_name: cert.certification_name,
          certification_type: cert.certification_type,
          expiry_date: new Date(cert.expiry_date).toLocaleDateString('fr-FR'),
          status: cert.status === 'valid' ? 'Valide' : cert.status === 'expired' ? 'Expiré' : 'Expire bientôt',
        });
      });
    } else {
      flatData.push({
        company: worker.company_name || '',
        last_name: worker.last_name,
        first_name: worker.first_name,
        phone: worker.phone || '',
        email: worker.email || '',
        certification_name: '',
        certification_type: '',
        expiry_date: '',
        status: 'Aucune habilitation',
      });
    }
  });

  const csv = generateCSV(flatData, headers);
  const filename = `intervenants-habilitations-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
}
