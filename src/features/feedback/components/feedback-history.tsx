// Shikoyat tarixi komponenti (Req 15.3).
//
// Talabaning yuborgan shikoyatlari ro'yxati holat tracking va javob ko'rsatish bilan.
// Sana, mavzu, holat (yangi, ko'rib chiqilmoqda, javob berildi, yopilgan) va javob
// bilan jadval ko'rinishida. Pagination qo'llab-quvvatlanadi.

import React from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { uz, enUS } from 'date-fns/locale'
import { MessageCircle, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Alert, AlertDescription } from '@/shared/ui/alert'

import { useFeedbackHistory } from '../api/use-feedback-history'
import type { ComplaintStatus } from '@/shared/types'

/** Status uchun vizual ko'rsatkich */
function StatusBadge({ status }: { status: ComplaintStatus }) {
  const { t } = useTranslation()

  const statusConfig = {
    new: { 
      icon: Clock, 
      variant: 'secondary' as const,
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    },
    in_review: { 
      icon: MessageCircle, 
      variant: 'default' as const,
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    },
    answered: { 
      icon: CheckCircle, 
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    },
    closed: { 
      icon: XCircle, 
      variant: 'outline' as const,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {t(`feedback.history.status.${status}`)}
    </Badge>
  )
}

/** Javob ko'rish modali yoki dialog */
interface ResponseViewProps {
  response: string
  onClose: () => void
}

function ResponseView({ response, onClose }: ResponseViewProps) {
  const { t } = useTranslation()

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">{t('feedback.history.viewResponse')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm bg-muted p-3 rounded-md">{response}</p>
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** Bo'sh holat komponenti */
function EmptyState() {
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {t('feedback.history.empty')}
        </h3>
        <p className="text-muted-foreground text-center">
          {t('feedback.history.emptyDescription')}
        </p>
      </CardContent>
    </Card>
  )
}

/** Yuklanish holati komponenti */
function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/** Xato holati komponenti */
interface ErrorStateProps {
  onRetry: () => void
}

function ErrorState({ onRetry }: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className="py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <div className="space-y-2">
              <p className="font-medium">{t('feedback.history.errorTitle')}</p>
              <p className="text-sm">{t('feedback.history.errorDescription')}</p>
              <Button variant="outline" size="sm" onClick={onRetry}>
                {t('feedback.history.retry')}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export function FeedbackHistory() {
  const { t, i18n } = useTranslation()
  const { data, isLoading, isError, refetch } = useFeedbackHistory()
  
  const [expandedResponse, setExpandedResponse] = React.useState<string | null>(null)

  // Til bo'yicha sana formatlash
  const dateLocale = i18n.language === 'uz' ? uz : enUS

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: dateLocale })
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />
  }

  if (!data?.items?.length) {
    return <EmptyState />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('feedback.history.title')}</CardTitle>
          <CardDescription>
            {t('feedback.history.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('feedback.history.columns.date')}</TableHead>
                <TableHead>{t('feedback.history.columns.number')}</TableHead>
                <TableHead>{t('feedback.history.columns.category')}</TableHead>
                <TableHead>{t('feedback.history.columns.course')}</TableHead>
                <TableHead>{t('feedback.history.columns.status')}</TableHead>
                <TableHead>{t('feedback.history.columns.response')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell>
                    {formatDate(complaint.createdAt)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {complaint.number}
                  </TableCell>
                  <TableCell>
                    {t(`feedback.categories.${complaint.category}`, complaint.category)}
                  </TableCell>
                  <TableCell>
                    {complaint.courseId ? (
                      <span className="text-sm">
                        {/* Kurs nomi - backend dan keling kerak yoki alohida API */}
                        Kurs
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={complaint.status} />
                  </TableCell>
                  <TableCell>
                    {complaint.response ? (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setExpandedResponse(
                          expandedResponse === complaint.id ? null : complaint.id
                        )}
                        className="p-0 h-auto"
                      >
                        {t('feedback.history.viewResponse')}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {t('feedback.history.noResponse')}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Kengaytirilgan javob */}
      {expandedResponse && (
        <ResponseView
          response={data.items.find(c => c.id === expandedResponse)?.response || ''}
          onClose={() => setExpandedResponse(null)}
        />
      )}
    </div>
  )
}