// Shikoyat asosiy sahifasi - forma va tarix tabllari (Req 15.1, 15.2, 15.3).
//
// Ikkita tab: "Yangi shikoyat" (FeedbackForm) va "Tarix" (FeedbackHistory).
// Student panelida ishlatiladi.

import React from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, History } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

import { FeedbackForm } from './feedback-form'
import { FeedbackHistory } from './feedback-history'

export function FeedbackPage() {
  const { t } = useTranslation()

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        {/* Sahifa sarlavhasi */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('feedback.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('feedback.description')}
          </p>
        </div>

        {/* Tab tizimi */}
        <Tabs defaultValue="form" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>{t('feedback.form.title')}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>{t('feedback.history.title')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-0">
            <FeedbackForm />
          </TabsContent>

          <TabsContent value="history" className="space-y-0">
            <FeedbackHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}