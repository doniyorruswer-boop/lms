// Sertifikatni ko'rish va boshqarish komponenti (Req 14.2, 14.3, 14.4).
//
// PDF_Viewer orqali sertifikatni oldindan ko'rsatadi, QR kod va elektron
// imzo holatini ko'rsatadi, yuklab olish, eSign tasdiqlash va tasdiqlash
// URL manzilini nusxalash imkoniyatlarini beradi.

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Copy,
  Download,
  QrCode,
  Shield,
  ShieldCheck,
} from 'lucide-react'

import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { useToast } from '@/shared/ui/use-toast'

import { PdfViewer } from '@/features/pdf/PdfViewer'
import { useCertificateDetail } from '../api/use-certificate-detail'
import type { Certificate } from '@/shared/types'

/** Yuklanish paytida ko'rsatiladigan skeleton loader. */
function CertificateViewerSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      className="space-y-6"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      <div className="flex items-center gap-4">
        <div className="h-10 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="h-96 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

interface CertificateViewerErrorProps {
  onRetry: () => void
  onBack: () => void
}

/** Backend xatosida ko'rsatiladigan xato holati. */
function CertificateViewerError({ onRetry, onBack }: CertificateViewerErrorProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack} className="gap-2">
        <ArrowLeft className="size-4" />
        {t('certificates.backToList')}
      </Button>
      <Card role="alert" className="border-destructive">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
          <CardTitle className="text-lg text-destructive">
            {t('certificates.viewer.errorTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('certificates.viewer.errorDescription')}
          </p>
          <Button onClick={onRetry} variant="outline">
            {t('certificates.retry')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

interface CertificateInfoProps {
  certificate: Certificate
}

/** Sertifikat ma'lumotlari va boshqaruvlar paneli. */
function CertificateInfo({ certificate }: CertificateInfoProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const handleDownload = useCallback(async () => {
    try {
      // PDF yuklab olish (Req 14.3)
      const response = await fetch(certificate.pdfUrl)
      if (!response.ok) {
        throw new Error('Failed to download certificate')
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${certificate.number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        description: t('certificates.viewer.downloadSuccess'),
      })
    } catch {
      toast({
        variant: 'destructive',
        description: t('certificates.viewer.downloadError'),
      })
    }
  }, [certificate.pdfUrl, certificate.number, t, toast])

  const handleCopyVerifyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(certificate.verifyUrl)
      toast({
        description: t('certificates.viewer.copySuccess'),
      })
    } catch {
      toast({
        variant: 'destructive',
        description: t('certificates.viewer.copyError'),
      })
    }
  }, [certificate.verifyUrl, t, toast])

  return (
    <div className="space-y-4">
      {/* Sertifikat ma'lumotlari */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t('certificates.viewer.details')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('certificates.columns.course')}
            </p>
            <p className="text-base">{certificate.courseTitle}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('certificates.columns.number')}
            </p>
            <p className="font-mono text-base">{certificate.number}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('certificates.columns.issuedAt')}
            </p>
            <p className="text-base">
              {new Date(certificate.issuedAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Elektron imzo holati (Req 14.4) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {certificate.eSigned ? (
              <ShieldCheck className="size-5 text-green-600" aria-hidden="true" />
            ) : (
              <Shield className="size-5 text-muted-foreground" aria-hidden="true" />
            )}
            {t('certificates.viewer.eSignStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge
            variant={certificate.eSigned ? 'default' : 'secondary'}
            className="gap-1"
          >
            {certificate.eSigned ? (
              <>
                <CheckCircle className="size-3" />
                {t('certificates.viewer.eSigned')}
              </>
            ) : (
              t('certificates.viewer.notSigned')
            )}
          </Badge>
          {certificate.eSigned && certificate.signerOrg && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('certificates.viewer.signerOrg')}
              </p>
              <p className="text-base">{certificate.signerOrg}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR kod va tasdiqlash URL (Req 14.5) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <QrCode className="size-5" />
            {t('certificates.viewer.verification')}
          </CardTitle>
          <CardDescription>
            {t('certificates.viewer.verificationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {certificate.qrUrl && (
            <div className="flex justify-center">
              <img
                src={certificate.qrUrl}
                alt={t('certificates.viewer.qrCodeAlt')}
                className="size-32 border border-border"
              />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('certificates.viewer.verifyUrl')}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-muted p-2 text-xs">
                {certificate.verifyUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyVerifyUrl}
                aria-label={t('certificates.viewer.copyUrl')}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Boshqaruvlar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t('certificates.viewer.actions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownload} className="w-full gap-2">
            <Download className="size-4" />
            {t('certificates.viewer.downloadPdf')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export interface CertificateViewerProps {
  /** Sertifikat ID si. */
  certificateId: string
  /** Ro'yxatga qaytish uchun callback. */
  onBack: () => void
}

/**
 * Sertifikatni ko'rish va boshqarish komponenti (Req 14.2, 14.3, 14.4).
 * PDF preview, eSign holati va tasdiqlash URL larini ko'rsatadi.
 */
export function CertificateViewer({
  certificateId,
  onBack,
}: CertificateViewerProps) {
  const { t } = useTranslation()
  const {
    data: certificate,
    isLoading,
    isError,
    refetch,
  } = useCertificateDetail(certificateId)

  if (isLoading) {
    return <CertificateViewerSkeleton />
  }

  if (isError || !certificate) {
    return (
      <CertificateViewerError
        onRetry={() => void refetch()}
        onBack={onBack}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Orqaga tugma */}
      <Button variant="outline" onClick={onBack} className="gap-2">
        <ArrowLeft className="size-4" />
        {t('certificates.backToList')}
      </Button>

      {/* Sarlavha */}
      <div>
        <h1 className="text-2xl font-bold">
          {t('certificates.viewer.title')}
        </h1>
        <p className="text-muted-foreground">
          {certificate.courseTitle}
        </p>
      </div>

      {/* Asosiy kontent */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* PDF ko'rinish (Req 14.2) */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <PdfViewer
                file={certificate.pdfUrl}
                title={t('certificates.viewer.pdfTitle', {
                  course: certificate.courseTitle,
                })}
                downloadUrl={certificate.pdfUrl}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sertifikat ma'lumotlari va boshqaruvlar */}
        <div>
          <CertificateInfo certificate={certificate} />
        </div>
      </div>
    </div>
  )
}