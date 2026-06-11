// Sertifikatlar ro'yxati komponenti (Req 14.1).
//
// Talabaning barcha sertifikatlarini jadval ko'rinishida ko'rsatadi:
// kurs nomi, berilgan sana va sertifikat raqami. Har bir sertifikatni
// bosish orqali tafsilotli ko'rinishga o'tish mumkin.

import { useTranslation } from 'react-i18next'
import { AlertCircle, Award, Eye } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

import { useCertificates } from '../api/use-certificates'
import type { Certificate } from '@/shared/types'

/** Yuklanish paytida ko'rsatiladigan skeleton loader. */
function CertificatesListSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      className="space-y-3"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/6 animate-pulse rounded bg-muted" />
          <div className="h-8 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

interface CertificatesListErrorProps {
  onRetry: () => void
}

/** Backend xatosida ko'rsatiladigan xato holati. */
function CertificatesListError({ onRetry }: CertificatesListErrorProps) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className="border-destructive">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
        <CardTitle className="text-lg text-destructive">
          {t('certificates.errorTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('certificates.errorDescription')}
        </p>
        <Button onClick={onRetry} variant="outline">
          {t('certificates.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

interface CertificatesTableProps {
  certificates: Certificate[]
  onViewCertificate: (certificate: Certificate) => void
}

/** Sertifikatlar jadvali. */
function CertificatesTable({
  certificates,
  onViewCertificate,
}: CertificatesTableProps) {
  const { t } = useTranslation()

  if (certificates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <Award className="size-12 text-muted-foreground" aria-hidden="true" />
          <div className="text-center">
            <p className="text-lg font-medium">
              {t('certificates.noCertificates')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('certificates.noCertificatesDescription')}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('certificates.columns.course')}</TableHead>
            <TableHead>{t('certificates.columns.issuedAt')}</TableHead>
            <TableHead>{t('certificates.columns.number')}</TableHead>
            <TableHead className="w-24">{t('certificates.columns.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {certificates.map((certificate) => (
            <TableRow key={certificate.id}>
              <TableCell className="font-medium">
                {certificate.courseTitle}
              </TableCell>
              <TableCell>
                {new Date(certificate.issuedAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {certificate.number}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewCertificate(certificate)}
                  aria-label={t('certificates.viewCertificate', {
                    course: certificate.courseTitle,
                  })}
                >
                  <Eye className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

export interface CertificatesListProps {
  /** Sertifikatni ko'rish uchun callback. */
  onViewCertificate: (certificate: Certificate) => void
}

/**
 * Sertifikatlar ro'yxati komponenti (Req 14.1).
 * Yuklanish, xato va muvaffaqiyat holatlarini boshqaradi.
 */
export function CertificatesList({ onViewCertificate }: CertificatesListProps) {
  const { t } = useTranslation()
  const { data: certificates, isLoading, isError, refetch } = useCertificates()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Award className="size-6 text-primary" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-bold">{t('certificates.title')}</h1>
          <p className="text-muted-foreground">
            {t('certificates.description')}
          </p>
        </div>
      </div>

      {isLoading ? (
        <CertificatesListSkeleton />
      ) : isError || !certificates ? (
        <CertificatesListError onRetry={() => void refetch()} />
      ) : (
        <CertificatesTable
          certificates={certificates}
          onViewCertificate={onViewCertificate}
        />
      )}
    </div>
  )
}