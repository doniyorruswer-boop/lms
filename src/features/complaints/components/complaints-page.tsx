// Shikoyatlar sahifasi (Req 15.1, 15.2, 15.3)
//
// Bu sahifa shikoyat yuborish formasi va shikoyat tarixi komponentlarini
// tab interfeysi orqali birlashtiradi. Student dashboard ga integratsiya
// qilingan asosiy sahifa.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, History } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

import ComplaintForm from './complaint-form'
import ComplaintHistory from './complaint-history'

/**
 * Shikoyatlar sahifasi asosiy komponenti
 * 
 * Ikki tab bilan:
 * 1. "Yangi shikoyat" - shikoyat yuborish formasi (Task 29.1)
 * 2. "Shikoyat tarixi" - yuborgan shikoyatlar tarixi (Task 29.2)
 */
export function ComplaintsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('new-complaint')

  // Shikoyat muvaffaqiyatli yuborilgandan so'ng tarixga o'tish
  const handleComplaintSuccess = () => {
    setActiveTab('history')
  }

  return (
    <main className="space-y-6 p-6" aria-labelledby="complaints-page-title">
      <div className="space-y-2">
        <h1 id="complaints-page-title" className="text-2xl font-bold">
          {t('complaints.page.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('complaints.page.description')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-complaint" className="gap-2">
            <MessageSquare className="size-4" />
            {t('complaints.page.tabs.newComplaint')}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="size-4" />
            {t('complaints.page.tabs.history')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new-complaint" className="space-y-4">
          <ComplaintForm onSuccess={handleComplaintSuccess} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ComplaintHistory />
        </TabsContent>
      </Tabs>
    </main>
  )
}

export default ComplaintsPage