// Shikoyat tarixi jadvali (Req 15.3)
//
// Bu komponent foydalanuvchining yuborgan shikoyatlari tarixini jadval
// ko'rinishida ko'rsatadi. Har bir shikoyat uchun sana, mavzu, holat
// va javob ma'lumotlari ko'rsatiladi.

import { useTranslation } from 'react-i18next'
import { formatDistance } from 'date-fns'
import { uz, ru, enUS } from 'date-fns/locale'
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  FileText,
  RefreshCw 
} from 'lucide-react'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'

import type { Complaint, ComplaintStatus } from '@/shared/types'
import { useComplaints } from '../api/use-complaints'

/**
 * Shikoyat holatiga mos ranglar va ikonlar
 */
const statusConfig: Record<ComplaintStatus, { 
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: React.ComponentType<{ className?: string }>
  color: string
}> = {
  new: {
    variant: 'default',
    icon: Clock,
    color: 'text-blue-600',
  },
  in_review: {
    variant: 'secondary',
    icon: AlertCircle,
    color: 'text-yellow-600',
  },
  answered: {
    variant: 'outline',
    icon: MessageSquare,
    color: 'text-green-600',
  },
  closed: {
    variant: 'secondary',
    icon: CheckCircle2,
    color: 'text-gray-600',
  },
}

/**
 * Sana formati (locale ga qarab)
 */
function useLocaleForDate() {
  const { i18n } = useTranslation()
  
  const localeMap = {
    uz,
    ru,
    en: enUS,
  }
  
  return localeMap[i18n.language as keyof typeof localeMap] || uz
}

/**
 * Shikoyat holatini ko'rsatuvchi badge komponenti
 */
interface ComplaintStatusBadgeProps {
  status: ComplaintStatus
}

function ComplaintStatusBadge({ status }: ComplaintStatusBadgeProps) {
  const { t } = useTranslation()
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="size-3" />
      {t(`complaints.status.${status}`)}
    </Badge>
  )
}

/**
 * Shikoyat tafsilotlarini ko'rsatuvchi dialog komponenti
 */
interface ComplaintDetailDialogProps {
  complaint: Complaint
}

function ComplaintDetailDialog({ complaint }: ComplaintDetailDialogProps) {
  const { t } = useTranslation()
  const locale = useLocaleForDate()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          {t('complaints.history.viewDetails')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            {t('complaints.history.details.title')}
          </DialogTitle>
          <DialogDescription>
            {t('complaints.history.details.subtitle', { number: complaint.number })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Asosiy ma'lumotlar */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('complaints.form.category.label')}
              </h4>
              <p className="text-sm">
                {t(`complaints.categories.${complaint.category}`)}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('complaints.history.details.status')}
              </h4>
              <ComplaintStatusBadge status={complaint.status} />
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('complaints.history.details.createdAt')}
              </h4>
              <p className="text-sm">
                {formatDistance(new Date(complaint.createdAt), new Date(), {
                  addSuffix: true,
                  locale,
                })}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('complaints.history.details.number')}
              </h4>
              <p className="font-mono text-sm">{complaint.number}</p>
            </div>
          </div>

          {/* Shikoyat matni */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {t('complaints.form.text.label')}
            </h4>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm whitespace-pre-wrap">{complaint.text}</p>
            </div>
          </div>

          {/* Javob (agar mavjud bo'lsa) */}
          {complaint.response && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {t('complaints.history.details.response')}
              </h4>
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="text-sm text-green-800 whitespace-pre-wrap">
                  {complaint.response}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Yuklanayotganda ko'rsatiladigan skeleton
 */
function ComplaintHistorySkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status" aria-label={t('common.loading')}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('complaints.history.table.date')}</TableHead>
            <TableHead>{t('complaints.history.table.subject')}</TableHead>
            <TableHead>{t('complaints.history.table.status')}</TableHead>
            <TableHead>{t('complaints.history.table.response')}</TableHead>
            <TableHead>{t('complaints.history.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[0, 1, 2].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-6 w-16 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Xato holatini ko'rsatuvchi komponent
 */
interface ComplaintHistoryErrorProps {
  onRetry: () => void
}

function ComplaintHistoryError({ onRetry }: ComplaintHistoryErrorProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="size-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">
        {t('complaints.history.error.title')}
      </h3>
      <p className="text-muted-foreground mb-4">
        {t('complaints.history.error.description')}
      </p>
      <Button onClick={onRetry} variant="outline" className="gap-2">
        <RefreshCw className="size-4" />
        {t('common.retry')}
      </Button>
    </div>
  )
}

/**
 * Shikoyat tarixi asosiy komponenti (Req 15.3)
 */
export function ComplaintHistory() {
  const { t } = useTranslation()
  const locale = useLocaleForDate()
  
  const { 
    data: complaintsData, 
    isLoading, 
    isError, 
    refetch 
  } = useComplaints()

  const complaints = complaintsData?.items || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('complaints.history.title')}</CardTitle>
        <CardDescription>
          {t('complaints.history.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ComplaintHistorySkeleton />
        ) : isError ? (
          <ComplaintHistoryError onRetry={() => void refetch()} />
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileText className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('complaints.history.empty.title')}
            </h3>
            <p className="text-muted-foreground">
              {t('complaints.history.empty.description')}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('complaints.history.table.date')}</TableHead>
                <TableHead>{t('complaints.history.table.subject')}</TableHead>
                <TableHead>{t('complaints.history.table.status')}</TableHead>
                <TableHead>{t('complaints.history.table.response')}</TableHead>
                <TableHead>{t('complaints.history.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="text-sm">
                    {formatDistance(new Date(complaint.createdAt), new Date(), {
                      addSuffix: true,
                      locale,
                    })}
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {t(`complaints.categories.${complaint.category}`)}
                      </p>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {complaint.text}
                      </p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <ComplaintStatusBadge status={complaint.status} />
                  </TableCell>
                  
                  <TableCell>
                    {complaint.response ? (
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {complaint.response}
                      </p>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        {t('complaints.history.noResponse')}
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <ComplaintDetailDialog complaint={complaint} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default ComplaintHistory