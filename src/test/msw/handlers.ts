// MSW request handlerlari skeletoni.
// Feature modullar (10.x va undan keyin) o'z handlerlarini bu yerga qo'shadi
// yoki test ichida `server.use(...)` orqali override qiladi.
// Barcha endpointlar `/api/v1` prefiksidan foydalanadi (Req 21.1).
import { http, HttpResponse } from 'msw'

export const API_PREFIX = '/api/v1'

export const handlers = [
  // Sog'liqni tekshirish (smoke) — skeleton uchun namuna handler.
  http.get(`${API_PREFIX}/health`, () => {
    return HttpResponse.json({ status: 'ok' })
  }),
]
