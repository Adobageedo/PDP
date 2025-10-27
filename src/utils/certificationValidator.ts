import { Certification, CertificationAlert } from '../types';

export function validateCertifications(certifications: Certification[]): {
  alerts: CertificationAlert[];
  validCount: number;
  expiredCount: number;
  expiringSoonCount: number;
} {
  const alerts: CertificationAlert[] = [];
  let validCount = 0;
  let expiredCount = 0;
  let expiringSoonCount = 0;

  const today = new Date();
  const twelveMonthsFromNow = new Date();
  twelveMonthsFromNow.setMonth(today.getMonth() + 12);

  certifications.forEach((cert) => {
    const expiryDate = new Date(cert.expiry_date);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (expiryDate < today) {
      expiredCount++;
      alerts.push({
        worker_id: cert.worker_id || '',
        worker_name: '',
        certification_name: cert.certification_name,
        expiry_date: cert.expiry_date,
        days_until_expiry: daysUntilExpiry,
        status: 'expired',
      });
    } else if (expiryDate <= twelveMonthsFromNow) {
      expiringSoonCount++;
      alerts.push({
        worker_id: cert.worker_id || '',
        worker_name: '',
        certification_name: cert.certification_name,
        expiry_date: cert.expiry_date,
        days_until_expiry: daysUntilExpiry,
        status: 'expiring_soon',
      });
    } else {
      validCount++;
    }
  });

  return {
    alerts: alerts.sort((a, b) => a.days_until_expiry - b.days_until_expiry),
    validCount,
    expiredCount,
    expiringSoonCount,
  };
}

export function updateCertificationStatus(cert: Certification): Certification {
  const today = new Date();
  const twelveMonthsFromNow = new Date();
  twelveMonthsFromNow.setMonth(today.getMonth() + 12);
  const expiryDate = new Date(cert.expiry_date);

  if (expiryDate < today) {
    return { ...cert, status: 'expired' };
  } else if (expiryDate <= twelveMonthsFromNow) {
    return { ...cert, status: 'expiring_soon' };
  } else {
    return { ...cert, status: 'valid' };
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
