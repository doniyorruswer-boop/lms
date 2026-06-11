// Sertifikatlar asosiy sahifasi (Req 14.1, 14.2).
//
// Ro'yxat va ko'rish rejimlarini boshqaradi. Boshlang'ichda ro'yxat
// ko'rsatiladi, sertifikat tanlanganida tafsilotli ko'rinishga o'tadi.

import { useState } from 'react'

import { CertificatesList } from './certificates-list'
import { CertificateViewer } from './certificate-viewer'
import type { Certificate } from '@/shared/types'

/**
 * Sertifikatlar asosiy sahifasi. Ro'yxat va ko'rish holatlarini boshqaradi.
 */
export function CertificatesPage() {
  const [selectedCertificateId, setSelectedCertificateId] = useState<
    string | null
  >(null)

  const handleViewCertificate = (certificate: Certificate) => {
    setSelectedCertificateId(certificate.id)
  }

  const handleBackToList = () => {
    setSelectedCertificateId(null)
  }

  if (selectedCertificateId) {
    return (
      <CertificateViewer
        certificateId={selectedCertificateId}
        onBack={handleBackToList}
      />
    )
  }

  return <CertificatesList onViewCertificate={handleViewCertificate} />
}

export default CertificatesPage