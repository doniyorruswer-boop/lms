// pdf.js worker konfiguratsiyasi (Req 5.1).
//
// react-pdf brauzerda PDF render qilish uchun pdf.js dan foydalanadi va
// og'ir parsing ishini alohida Web Worker da bajaradi. Vite `import.meta.url`
// orqali worker faylini bundle qiladi, shuning uchun worker manzilini shu
// yondashuv bilan beramiz (CDN ga bog'liqlik bo'lmaydi).
//
// Bu modul nojiy ta'sir (side-effect) sifatida bir marta import qilinadi —
// `PdfViewer` komponenti uni yuklaydi.
import { pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()
