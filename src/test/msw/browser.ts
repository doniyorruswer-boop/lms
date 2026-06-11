// MSW brauzer worker — dev rejimida yoki Storybook da mock uchun (ixtiyoriy).
// `public/mockServiceWorker.js` `msw init public/` orqali generatsiya qilinadi.
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
