# Requirements Document

## Introduction

Mazkur hujjat O'zbekiston Respublikasi Vazirlar Mahkamasining 2022-yil 3-oktyabrdagi 559-son qarori asosida masofaviy ta'lim (LMS) tizimining **faqat frontend qismi** uchun talablarni belgilaydi. Frontend React 18 + TypeScript 5 + Vite + shadcn/ui + TailwindCSS texnologiyalarida ishlab chiqiladi va alohida rejalashtiriladigan Kotlin Spring Boot backend tomonidan taqdim etiladigan REST API (`/api/v1/`) hamda WebSocket interfeyslarini iste'mol qiladi.

Tizim to'rtta foydalanuvchi paneliga ega: Talaba, O'qituvchi, OTM administratori va Monitoring paneli (vazirlik darajasi). Foydalanuvchilar HEMIS tizimidan import qilinadi (frontend-da o'zini ro'yxatdan o'tkazish yo'q), autentifikatsiya OneID OAuth orqali yoki login/parol orqali amalga oshiriladi. Frontend SCORM-pleyer, video pleyer (HLS), PDF ko'rgich, test topshirish, kamerali avto-prokторing, real vaqtdagi bildirishnomalar, sertifikat ko'rish, shikoyat yuborish va HEMIS sinxronizatsiyasini boshqarish UI funksiyalarini taqdim etadi.

To'lov moduli, foydalanuvchini ro'yxatdan o'tkazish formasi, backend implementatsiyasi va infratuzilma mazkur hujjat doirasidan tashqarida.

## Glossary

- **LMS_Frontend**: O'zbekiston VM 559-son qarori asosidagi masofaviy ta'lim tizimining brauzerda ishlaydigan SPA (Single Page Application) qismi.
- **Auth_Module**: Foydalanuvchi autentifikatsiyasi va sessiyani boshqaruvchi frontend moduli (login, OneID OAuth, JWT saqlash, logout).
- **Routing_Module**: React Router asosida URL marshrutlashtirish va rolga asoslangan kirishni nazorat qiluvchi modul.
- **Student_Panel**: Talabalar uchun mo'ljallangan UI sohasi (dashboard, kurslar, davomat, sertifikatlar, testlar, video va SCORM darslar).
- **Teacher_Panel**: O'qituvchilar uchun mo'ljallangan UI sohasi (dashboard, kurslarni boshqarish, dars va baholash yaratish, davomatni ko'rish, baholash).
- **Admin_Panel**: OTM administratori uchun UI sohasi (foydalanuvchilar, kurslar, HEMIS sinxronizatsiya boshqaruvi, hisobotlar).
- **Monitoring_Panel**: Vazirlik darajasidagi monitoring uchun UI sohasi (1:50 nisbat, kontingent statistikasi, OTM bo'yicha ko'rsatkichlar).
- **Video_Player**: HLS.js asosida adaptiv bitrate video oqimini ijro etuvchi UI komponenti.
- **PDF_Viewer**: react-pdf asosida PDF hujjatlarni ko'rsatuvchi UI komponenti.
- **SCORM_Player**: SCORM 1.2 va SCORM 2004 paketlarini iframe ichida yuklab, xAPI/SCORM API qo'ng'iroqlarini backend-ga uzatuvchi komponent.
- **Test_Module**: Test topshirish UI moduli (taymer, progress bar, savol navigatsiyasi, javoblarni saqlash).
- **Proctoring_Module**: face-api.js yordamida brauzer kamerasidan yuzni aniqlash va hodisalarni backend-ga yuboruvchi modul.
- **Notification_Module**: Socket.io-client orqali real vaqtda bildirishnomalarni qabul qiluvchi va ko'rsatuvchi modul.
- **Attendance_Module**: Talabalarning darsga kirish (check-in) va chiqish (check-out) UI moduli.
- **Certificate_Module**: Sertifikatlarni ko'rish, yuklab olish (PDF) va QR kod orqali tasdiqlash UI moduli.
- **Complaint_Module**: Nizomning 32-bandiga muvofiq shikoyat yuborish UI formasi va shikoyat tarixi ekrani.
- **HEMIS_Sync_UI**: HEMIS bilan sinxronizatsiyani ishga tushirish, holatini kuzatish va loglarini ko'rish UI moduli.
- **Reports_Module**: Hisobotlarni ko'rsatuvchi va eksport qiluvchi UI moduli (CSV/PDF).
- **Localization_Module**: Tilni almashtirish va matnlarni tarjima qilish moduli (o'zbek, rus, ingliz).
- **API_Client**: Axios asosida `/api/v1/` REST API ga so'rov yuboruvchi va JWT ni avtomatik qo'shuvchi mijoz qatlami.
- **Query_Layer**: React Query 5 asosida server holatini keshlovchi va sinxronlashtiruvchi qatlam.
- **Global_Store**: Zustand 4 asosida global mijoz holatini saqlovchi qatlam (foydalanuvchi, til, mavzu).
- **JWT_Token**: Backend tomonidan beriladigan Bearer access token va uning refresh token jufti.
- **OneID**: O'zbekiston Respublikasi yagona identifikatsiya tizimi (OAuth 2.0 provayder).
- **HEMIS**: O'zbekiston Oliy ta'lim muassasalari boshqaruv axborot tizimi (frontend uchun foydalanuvchi va kurs ma'lumotlari manbai).
- **SCORM**: Sharable Content Object Reference Model — elektron ta'lim kontenti standarti.
- **xAPI**: Experience API — ta'lim faoliyati ma'lumotlarini uzatish standarti.
- **HLS**: HTTP Live Streaming — adaptiv video oqim protokoli.
- **Bachelor_Direction**: Bakalavriat ta'lim yo'nalishi (559-son qarorning 20-bandi bo'yicha maksimal 300 talaba).
- **Master_Direction**: Magistratura ta'lim yo'nalishi (559-son qarorning 20-bandi bo'yicha maksimal 30 talaba).
- **Teacher_Student_Ratio**: O'qituvchi va talabalar nisbati (559-son qarorning 26-bandi bo'yicha maksimal 1:50).
- **Mandatory_LMS_Components**: 559-son qarorning 11-bandida belgilangan 7 ta majburiy LMS komponenti (kurs katalogi, o'quv materiallari, baholash, davomat, kommunikatsiya, hisobotlar, sertifikatlash).

## Requirements

### Requirement 1: Autentifikatsiya va sessiya

**User Story:** Foydalanuvchi sifatida tizimga login va parol yoki OneID orqali kirishni xohlayman, shunda mening rolimga mos panel ochiladi.

#### Acceptance Criteria

1. THE Auth_Module SHALL login sahifasida login va parol kiritish formasini, OneID orqali kirish tugmasini va tilni tanlash boshqaruvini ko'rsatishi kerak.
2. WHEN foydalanuvchi to'g'ri login va parolni yuboradi, THE Auth_Module SHALL backend-dan olingan JWT_Token ni `httpOnly` cookie ga yoki xavfsiz `localStorage` kalitiga yozishi va foydalanuvchini rolga mos boshlang'ich sahifaga yo'naltirishi kerak.
3. IF login yoki parol noto'g'ri bo'lsa, THEN THE Auth_Module SHALL formaning ostida xato xabarini 5 soniyadan kam bo'lmagan vaqt davomida ko'rsatishi va parol maydonini tozalashi kerak.
4. WHEN foydalanuvchi OneID tugmasini bosadi, THE Auth_Module SHALL foydalanuvchini OneID OAuth avtorizatsiya URL ga yo'naltirishi kerak.
5. WHEN OneID `code` parametri bilan callback URL ga qaytadi, THE Auth_Module SHALL ushbu kodni backend-ga yuborishi va javobdagi JWT_Token ni saqlashi kerak.
6. WHILE access token muddati tugagan va refresh token amal qiladi, THE API_Client SHALL har bir 401 javobida bir marta refresh token bilan yangi access token olishga urinishi kerak.
7. IF refresh token ham yaroqsiz bo'lsa, THEN THE Auth_Module SHALL saqlangan tokenlarni o'chirishi va foydalanuvchini login sahifasiga yo'naltirishi kerak.
8. WHEN foydalanuvchi "Chiqish" tugmasini bosadi, THE Auth_Module SHALL backend-dagi logout endpoint-ga so'rov yuborishi, mahalliy tokenlarni o'chirishi va login sahifasiga yo'naltirishi kerak.
9. THE Auth_Module SHALL foydalanuvchi avtonomatik (foydalanuvchi harakatisiz) 30 daqiqadan keyin sessiyani yakunlashi va login sahifasiga yo'naltirishi kerak.

### Requirement 2: Rolga asoslangan kirish va marshrutlashtirish

**User Story:** Tizim administratori sifatida har bir rol faqat o'ziga ruxsat etilgan sahifalarni ko'rishini xohlayman, shunda ma'lumotlar xavfsizligi ta'minlanadi.

#### Acceptance Criteria

1. THE Routing_Module SHALL quyidagi rollarni qo'llab-quvvatlashi kerak: SUPER_ADMIN, OTM_ADMIN, DEKAN, TEACHER, STUDENT.
2. WHEN STUDENT rolidagi foydalanuvchi tizimga kiradi, THE Routing_Module SHALL `/student/dashboard` URL ga yo'naltirishi kerak.
3. WHEN TEACHER rolidagi foydalanuvchi tizimga kiradi, THE Routing_Module SHALL `/teacher/dashboard` URL ga yo'naltirishi kerak.
4. WHEN OTM_ADMIN yoki DEKAN rolidagi foydalanuvchi tizimga kiradi, THE Routing_Module SHALL `/admin/dashboard` URL ga yo'naltirishi kerak.
5. WHEN SUPER_ADMIN rolidagi foydalanuvchi tizimga kiradi, THE Routing_Module SHALL `/monitoring/dashboard` URL ga yo'naltirishi kerak.
6. IF foydalanuvchi o'z rolida ruxsat etilmagan URL ga kirishga harakat qilsa, THEN THE Routing_Module SHALL "403 — Ruxsat yo'q" sahifasini ko'rsatishi kerak.
7. IF JWT_Token mavjud bo'lmagan foydalanuvchi himoyalangan URL ga kirsa, THEN THE Routing_Module SHALL foydalanuvchini login sahifasiga yo'naltirishi va `redirect` parametrida boshlang'ich URL ni saqlashi kerak.
8. THE Routing_Module SHALL har bir himoyalangan marshrut uchun talab qilinadigan rollar ro'yxatini deklarativ tarzda belgilash imkonini berishi kerak.

### Requirement 3: Talaba paneli — Dashboard va kurslar

**User Story:** Talaba sifatida o'zimning faol kurslarim, yaqinlashayotgan baholashlar va davomat statistikamni bir joyda ko'rishni xohlayman, shunda o'qish jarayonini rejalashtira olaman.

#### Acceptance Criteria

1. THE Student_Panel SHALL dashboard sahifasida foydalanuvchining faol kurslari ro'yxatini, yaqinlashayotgan baholash sanalarini va umumiy davomat foizini ko'rsatishi kerak.
2. WHEN talaba kurslar sahifasini ochadi, THE Student_Panel SHALL backend-dan olingan kurslar ro'yxatini sahifalash (pagination) bilan ko'rsatishi va har bir kurs uchun nom, o'qituvchi va progress foizini ko'rsatishi kerak.
3. WHEN talaba kursni tanlaydi, THE Student_Panel SHALL kurs tafsiloti sahifasini ochishi va darslar, materiallar, baholashlar hamda davomat tabllarini ko'rsatishi kerak.
4. WHILE kurs ma'lumotlari yuklanmoqda, THE Student_Panel SHALL skeleton loader yoki yuklash indikatorini ko'rsatishi kerak.
5. IF kurs ma'lumotlarini olishda backend xatosi yuz bersa, THEN THE Student_Panel SHALL xato xabarini va "Qayta urinish" tugmasini ko'rsatishi kerak.
6. THE Student_Panel SHALL kurslar ro'yxatini nom yoki o'qituvchi ismi bo'yicha qidirish maydoni bilan ta'minlashi kerak.

### Requirement 4: Video pleyer (HLS)

**User Story:** Talaba sifatida video darslarni turli internet tezliklarida uzilishsiz ko'rishni xohlayman, shunda mening internet sifatim past bo'lganda ham o'qishni davom ettira olaman.

#### Acceptance Criteria

1. THE Video_Player SHALL HLS.js kutubxonasi orqali `.m3u8` formatdagi adaptiv video oqimni ijro etishi kerak.
2. THE Video_Player SHALL play, pause, ko'rsatish vaqtini yo'lakcha (seek bar) orqali boshqarish, ovoz balandligi, to'liq ekran va ijro tezligi (0.5x, 1x, 1.25x, 1.5x, 2x) boshqaruvlarini ko'rsatishi kerak.
3. WHEN talaba videoni ijro etadi, THE Video_Player SHALL har 10 soniyada hozirgi vaqt o'rnini backend-ga yuborib turishi kerak.
4. WHEN brauzer ulanishi yo'qoladi va keyin tiklanadi, THE Video_Player SHALL oxirgi saqlangan vaqt o'rnidan ijroni davom ettirishi kerak.
5. IF video manbasini yuklashda xato yuz bersa, THEN THE Video_Player SHALL xato xabarini va "Qayta urinish" tugmasini ko'rsatishi kerak.
6. THE Video_Player SHALL klaviatura yorliqlarini qo'llab-quvvatlashi kerak: probel — play/pause, chap/o'ng strelka — 5 soniya orqaga/oldinga.

### Requirement 5: PDF ko'rgich

**User Story:** Talaba sifatida o'quv materiallarini PDF formatida brauzerda ko'rishni xohlayman, shunda alohida dastur ochmasdan o'qiy olaman.

#### Acceptance Criteria

1. THE PDF_Viewer SHALL react-pdf yordamida PDF fayllarni sahifa-sahifa ko'rsatishi kerak.
2. THE PDF_Viewer SHALL keyingi/oldingi sahifa, sahifa raqamiga o'tish, masshtablash (zoom in/out) va to'liq ekran boshqaruvlarini ko'rsatishi kerak.
3. THE PDF_Viewer SHALL hujjat ichida matn bo'yicha qidirish maydonini ta'minlashi kerak.
4. IF PDF fayl yuklanmasa yoki buzilgan bo'lsa, THEN THE PDF_Viewer SHALL xato xabarini va alternativ yuklab olish havolasini ko'rsatishi kerak.

### Requirement 6: SCORM pleyer

**User Story:** Talaba sifatida SCORM formatdagi interaktiv darslarni o'tashni xohlayman, shunda mening progressim avtomatik tarzda hisoblanadi.

#### Acceptance Criteria

1. THE SCORM_Player SHALL SCORM 1.2 va SCORM 2004 standartlaridagi paketlarni iframe ichida yuklab ijro etishi kerak.
2. THE SCORM_Player SHALL SCORM API (`API` va `API_1484_11` global obyektlari) orqali iframe ichidan keladigan `LMSInitialize`, `LMSGetValue`, `LMSSetValue`, `LMSCommit`, `LMSFinish` qo'ng'iroqlarini qabul qilishi kerak.
3. WHEN SCORM paket `LMSSetValue("cmi.core.lesson_status", ...)` yoki shunga teng `cmi.completion_status` qiymatini o'zgartiradi, THE SCORM_Player SHALL xAPI hodisasini backend-ga yuborishi kerak.
4. WHEN talaba SCORM darsdan chiqadi, THE SCORM_Player SHALL `LMSCommit` va `LMSFinish` chaqiriqlarini bajarib, yakuniy holatni backend-ga yuborishi kerak.
5. IF SCORM paket yuklanmasa, THEN THE SCORM_Player SHALL xato xabarini ko'rsatishi va talabaga texnik yordamga murojaat qilish havolasini taqdim etishi kerak.

### Requirement 7: Test topshirish moduli

**User Story:** Talaba sifatida testlarni belgilangan vaqt ichida topshirishni xohlayman, shunda baholash adolatli amalga oshiriladi.

#### Acceptance Criteria

1. WHEN talaba testni boshlaydi, THE Test_Module SHALL backend-dan testning savollarini, taymeri (daqiqalarda) va talab qilingan proktoring sozlamalarini olishi kerak.
2. THE Test_Module SHALL ekranning yuqori qismida orqaga sanovchi taymerni va javob berilgan savollar sonini ko'rsatuvchi progress barni ko'rsatishi kerak.
3. THE Test_Module SHALL bir savoldan ikkinchisiga o'tish, ko'rib chiqish uchun belgilash va savollar ro'yxatini panel orqali ko'rinishi imkonini berishi kerak.
4. WHEN talaba savolga javob beradi, THE Test_Module SHALL javobni 5 soniyalik debounce bilan backend-ga avtomatik saqlashi kerak.
5. WHEN taymer 0 ga yetadi, THE Test_Module SHALL testni avtomatik ravishda yakunlashi va saqlangan javoblarni yakuniy yuborishi kerak.
6. IF talaba "Yakunlash" tugmasini bosib testni qo'lda yakunlasa, THEN THE Test_Module SHALL tasdiqlash dialogini ko'rsatishi va tasdiqlangandan so'nggina yakuniy yuborishi kerak.
7. IF brauzer ulanishi test paytida uziladi, THEN THE Test_Module SHALL xato xabarini ko'rsatishi va ulanish tiklanganda saqlanmagan javoblarni qayta yuborishga urinishi kerak.

### Requirement 8: Avto-prokторing (kameradan yuzni aniqlash)

**User Story:** Vazirlik vakili sifatida test topshirish jarayonida talabaning shaxsini avtomatik tasdiqlashni xohlayman, shunda baholash haqqoniyligi ta'minlanadi (559-son qaror, 10-band).

#### Acceptance Criteria

1. WHEN test proktoring talab qiladigan turda boshlanadi, THE Proctoring_Module SHALL brauzer kamerasi va mikrofoniga ruxsat so'rashi kerak.
2. IF foydalanuvchi kameraga ruxsat bermasa, THEN THE Proctoring_Module SHALL ogohlantirish ko'rsatishi va testni boshlash imkoniyatini bermasligi kerak.
3. WHILE test ijro etilmoqda, THE Proctoring_Module SHALL face-api.js yordamida har 10 soniyada bir marta yuzni aniqlashi va natijani backend-ga yuborishi kerak.
4. IF kadrda yuz aniqlanmasa yoki bir nechta yuz aniqlansa, THEN THE Proctoring_Module SHALL talabaga ko'rinadigan ogohlantirish ko'rsatishi va hodisani backend-ga "violation" turidagi voqea sifatida yuborishi kerak.
5. WHEN talaba test sahifasidan boshqa tab yoki oynaga o'tadi, THE Proctoring_Module SHALL "tab_switch" hodisasini backend-ga yuborishi kerak.
6. THE Proctoring_Module SHALL test boshlanishidan oldin kamera ko'rinishini oldindan ko'rish (preview) oynasini ko'rsatishi va talaba tasdiqlamaguncha testni boshlamasligi kerak.

### Requirement 9: Davomat moduli

**User Story:** Talaba sifatida darsga kirish va chiqish vaqtimni tizimda belgilashni xohlayman, shunda davomatim aniq hisoblanadi.

#### Acceptance Criteria

1. WHEN talaba dars sahifasini ochadi va dars vaqti boshlangan bo'lsa, THE Attendance_Module SHALL "Darsga kirdim" tugmasini faollashtirishi kerak.
2. WHEN talaba "Darsga kirdim" tugmasini bosadi, THE Attendance_Module SHALL kirish vaqtini backend-ga yuborishi va tugmani "Darsdan chiqdim" ga o'zgartirishi kerak.
3. WHEN talaba "Darsdan chiqdim" tugmasini bosadi, THE Attendance_Module SHALL chiqish vaqtini backend-ga yuborishi va sessiyani yopilgan deb belgilashi kerak.
4. THE Attendance_Module SHALL talaba uchun davomat tarixini sana, kurs nomi, kirish va chiqish vaqtlari bilan jadval ko'rinishida ko'rsatishi kerak.
5. THE Teacher_Panel SHALL har bir dars uchun darsga kirgan talabalar ro'yxatini va ularning vaqtlarini ko'rsatishi kerak.

### Requirement 10: O'qituvchi paneli — kurslar va baholash

**User Story:** O'qituvchi sifatida kurs darslarini, materiallarini va baholashlarni yaratish hamda talabalarni baholashni xohlayman, shunda o'quv jarayonini boshqara olaman.

#### Acceptance Criteria

1. THE Teacher_Panel SHALL dashboard sahifasida o'qituvchining faol kurslari, yaqin kunlardagi darslari va baholanmagan ishlar sonini ko'rsatishi kerak.
2. WHEN o'qituvchi kurs tafsilotini ochadi, THE Teacher_Panel SHALL darslar, materiallar, baholashlar va talabalar ro'yxati tabllarini ko'rsatishi kerak.
3. WHEN o'qituvchi "Yangi dars" tugmasini bosadi, THE Teacher_Panel SHALL dars sarlavhasi, sanasi, davomiyligi, video manbasi (URL yoki yuklash) va materiallar (PDF) maydonlari bo'lgan formani ko'rsatishi kerak.
4. WHEN o'qituvchi yangi baholash yaratadi, THE Teacher_Panel SHALL baholash turi (test, topshiriq), savollar, ballar, taymer va proktoring talab qilinishi maydonlarini taqdim etishi kerak.
5. THE Teacher_Panel SHALL o'qituvchiga talaba ishini ko'rish, ball berish va izoh yozish imkonini taqdim etishi kerak.
6. IF o'qituvchi formani noto'g'ri yoki to'liq bo'lmagan ma'lumotlar bilan yuborsa, THEN THE Teacher_Panel SHALL har bir noto'g'ri maydon yonida xato matnini ko'rsatishi kerak.

### Requirement 11: Administrator paneli — foydalanuvchilar va kurslar

**User Story:** OTM administratori sifatida foydalanuvchilar va kurslarni boshqarishni hamda 559-son qarorning 20-bandidagi kontingent chegaralarini ko'rishni xohlayman, shunda OTM faoliyati tartibga solinadi.

#### Acceptance Criteria

1. THE Admin_Panel SHALL foydalanuvchilar ro'yxatini rol, OTM, fakultet va holat bo'yicha filtrlash imkoniyati bilan ko'rsatishi kerak.
2. THE Admin_Panel SHALL kurslar ro'yxatini ta'lim yo'nalishi, semestr va o'qituvchi bo'yicha filtrlash imkoniyati bilan ko'rsatishi kerak.
3. WHEN administrator yangi kurs yaratadi, THE Admin_Panel SHALL kurs nomi, ta'lim yo'nalishi, semestr, o'qituvchi va sig'im (talabalar soni chegarasi) maydonlari bo'lgan formani ko'rsatishi kerak.
4. WHERE kurs Bachelor_Direction ga tegishli bo'lsa, THE Admin_Panel SHALL kurs sig'imi maydonida 300 dan oshmasligi haqida vizual indikator ko'rsatishi kerak.
5. WHERE kurs Master_Direction ga tegishli bo'lsa, THE Admin_Panel SHALL kurs sig'imi maydonida 30 dan oshmasligi haqida vizual indikator ko'rsatishi kerak.
6. IF administrator kontingent chegarasidan oshib ketadigan qiymat kiritsa, THEN THE Admin_Panel SHALL formani yuborishni bloklashi va 559-son qarorning 20-bandiga havola bilan tushuntirish ko'rsatishi kerak.

### Requirement 12: HEMIS sinxronizatsiya UI

**User Story:** OTM administratori sifatida HEMIS bilan ma'lumotlar sinxronizatsiyasini ishga tushirish va holatini kuzatishni xohlayman, shunda talabalar va o'qituvchilar ma'lumotlari dolzarb bo'ladi.

#### Acceptance Criteria

1. THE HEMIS_Sync_UI SHALL "Talabalarni sinxronlash", "O'qituvchilarni sinxronlash" va "Kurslarni sinxronlash" tugmalarini ko'rsatishi kerak.
2. WHEN administrator sinxronizatsiya tugmasini bosadi, THE HEMIS_Sync_UI SHALL backend-ga so'rov yuborishi va sinxronizatsiyaning hozirgi holatini (boshlangan, ishlamoqda, yakunlandi, xato) ko'rsatuvchi ko'rsatkichni faollashtirishi kerak.
3. WHILE sinxronizatsiya jarayoni davom etmoqda, THE HEMIS_Sync_UI SHALL progress barni va qayta ishlangan yozuvlar sonini har 5 soniyada yangilab turishi kerak.
4. WHEN sinxronizatsiya yakunlanadi, THE HEMIS_Sync_UI SHALL yakuniy hisobotni (qayta ishlangan, yangi qo'shilgan, xato yuz bergan yozuvlar soni) ko'rsatishi kerak.
5. THE HEMIS_Sync_UI SHALL sinxronizatsiya tarixi jadvalini sana, tur, holat va yakuniy hisobot bilan ko'rsatishi kerak.
6. IF sinxronizatsiya xatosi yuz bersa, THEN THE HEMIS_Sync_UI SHALL xato sababi va loglarni yuklab olish havolasini ko'rsatishi kerak.

### Requirement 13: Monitoring paneli — vazirlik darajasi

**User Story:** Vazirlik xodimi sifatida barcha OTM bo'yicha kontingent va o'qituvchi-talaba nisbatlarini ko'rishni xohlayman, shunda 559-son qarorning 26-bandi talablariga rioya qilish nazoratini olib bora olaman.

#### Acceptance Criteria

1. THE Monitoring_Panel SHALL barcha OTM bo'yicha umumiy talabalar soni, o'qituvchilar soni va kurslar sonini ko'rsatuvchi indikator kartochkalarini ko'rsatishi kerak.
2. THE Monitoring_Panel SHALL Teacher_Student_Ratio ni har bir OTM uchun jadval va diagramma ko'rinishida ko'rsatishi kerak.
3. WHERE OTM ning Teacher_Student_Ratio nisbati 1:50 dan oshsa, THE Monitoring_Panel SHALL ushbu OTM ni qizil rang bilan ajratib ko'rsatishi va "Norma buzilgan" yorlig'ini qo'shishi kerak.
4. THE Monitoring_Panel SHALL kontingent statistikasini ta'lim yo'nalishi va OTM bo'yicha taqsimlangan diagramma sifatida ko'rsatishi kerak.
5. THE Monitoring_Panel SHALL sana oralig'i bo'yicha filtrlash boshqaruvini ta'minlashi va filtr o'zgarganda diagrammalarni qayta yuklashi kerak.
6. THE Monitoring_Panel SHALL hisobotlarni CSV va PDF formatlarida eksport qilish tugmalarini ko'rsatishi kerak.

### Requirement 14: Sertifikat moduli

**User Story:** Talaba sifatida kurs yakunlanganidan so'ng sertifikatimni ko'rish va yuklab olishni xohlayman, shunda erishganlarimni tasdiqlay olaman (559-son qaror, 27-band).

#### Acceptance Criteria

1. THE Certificate_Module SHALL talabaning olgan barcha sertifikatlari ro'yxatini kurs nomi, berilgan sana va sertifikat raqami bilan ko'rsatishi kerak.
2. WHEN talaba sertifikatni tanlaydi, THE Certificate_Module SHALL sertifikat tasvirini PDF_Viewer orqali oldindan ko'rsatishi va QR kod hamda elektron imzo holatini vizual ko'rsatkich bilan ko'rsatishi kerak.
3. THE Certificate_Module SHALL sertifikatni PDF formatida yuklab olish tugmasini ko'rsatishi kerak.
4. WHERE sertifikat elektron imzolangan bo'lsa, THE Certificate_Module SHALL "eSign tasdiqlangan" yorlig'ini va imzolovchi tashkilot nomini ko'rsatishi kerak.
5. THE Certificate_Module SHALL QR kod yonida tasdiqlash URL ini ko'rsatishi va uni nusxalash tugmasini taqdim etishi kerak.

### Requirement 15: Shikoyat moduli

**User Story:** Talaba sifatida o'quv jarayoni bilan bog'liq shikoyat yuborishni va uning holatini kuzatishni xohlayman, shunda mening huquqlarim himoya qilinadi (Nizom 32-bandi).

#### Acceptance Criteria

1. THE Complaint_Module SHALL shikoyat yuborish formasini quyidagi maydonlar bilan ko'rsatishi kerak: shikoyat turi (kategoriya), tegishli kurs (ixtiyoriy), shikoyat matni va ilova fayllari.
2. WHEN talaba shikoyatni yuboradi, THE Complaint_Module SHALL shikoyatni backend-ga yuborishi va muvaffaqiyat xabari bilan birga shikoyat raqamini ko'rsatishi kerak.
3. THE Complaint_Module SHALL talabaning yuborgan shikoyatlari tarixini sana, mavzu, holat (yangi, ko'rib chiqilmoqda, javob berildi, yopilgan) va javob bilan jadval ko'rinishida ko'rsatishi kerak.
4. IF shikoyat matni 20 belgidan kam bo'lsa, THEN THE Complaint_Module SHALL formani yuborishni bloklashi va minimal uzunlik haqida xabar ko'rsatishi kerak.
5. WHEN shikoyatga backend-da yangi javob qo'shiladi, THE Notification_Module SHALL talabaga real vaqtda bildirishnoma ko'rsatishi kerak.

### Requirement 16: Real vaqtdagi bildirishnomalar

**User Story:** Foydalanuvchi sifatida muhim hodisalar (yangi baholash, javob, e'lon) haqida real vaqtda xabardor bo'lishni xohlayman, shunda hech narsani o'tkazib yubormayman.

#### Acceptance Criteria

1. WHEN foydalanuvchi tizimga muvaffaqiyatli kiradi, THE Notification_Module SHALL Socket.io-client orqali backend WebSocket serveriga ulanishi va JWT_Token bilan autentifikatsiyadan o'tishi kerak.
2. WHEN backend yangi bildirishnoma yuboradi, THE Notification_Module SHALL ekranning yuqori o'ng burchagida toast bildirishnoma ko'rsatishi va bildirishnoma qo'ng'iroq ikonkasidagi sanovchini bittaga oshirishi kerak.
3. THE Notification_Module SHALL bildirishnomalar ro'yxati panelini ochish va yopish imkonini berishi va ro'yxatda sana, sarlavha, matn va o'qilgan/o'qilmagan holatni ko'rsatishi kerak.
4. WHEN foydalanuvchi bildirishnomani bosadi, THE Notification_Module SHALL uni o'qilgan deb belgilashi va tegishli sahifaga yo'naltirishi kerak.
5. IF WebSocket ulanishi uziladi, THEN THE Notification_Module SHALL eksponensial backoff (1, 2, 4, 8, 16 soniya) bilan qayta ulanishga urinishi kerak.

### Requirement 17: Hisobotlar moduli

**User Story:** Administrator sifatida turli hisobotlarni ko'rish va eksport qilishni xohlayman, shunda OTM faoliyatini tahlil qila olaman.

#### Acceptance Criteria

1. THE Reports_Module SHALL davomat, baholash natijalari, kurslar bo'yicha statistika va sertifikatlar berilishi turidagi hisobotlarni taqdim etishi kerak.
2. THE Reports_Module SHALL har bir hisobot uchun sana oralig'i, fakultet, ta'lim yo'nalishi va kurs bo'yicha filtrlash boshqaruvlarini ta'minlashi kerak.
3. WHEN foydalanuvchi filtrlarni o'zgartirsa, THE Reports_Module SHALL hisobot ma'lumotlarini 1 soniyalik debounce bilan qayta yuklashi kerak.
4. THE Reports_Module SHALL hisobotlarni CSV va PDF formatlarida eksport qilish tugmalarini ko'rsatishi kerak.
5. WHILE hisobot eksport qilinmoqda, THE Reports_Module SHALL eksport tugmasini bloklashi va progress indikatorni ko'rsatishi kerak.

### Requirement 18: Majburiy LMS komponentlari (559-son qaror, 11-band)

**User Story:** Vazirlik vakili sifatida 559-son qarorning 11-bandida belgilangan barcha majburiy LMS komponentlari frontend interfeysida mavjudligini xohlayman, shunda tizim me'yoriy hujjatga muvofiq bo'ladi.

#### Acceptance Criteria

1. THE LMS_Frontend SHALL kurs katalogi UI komponentini taqdim etishi kerak.
2. THE LMS_Frontend SHALL o'quv materiallari (video, PDF, SCORM) ko'rish UI komponentlarini taqdim etishi kerak.
3. THE LMS_Frontend SHALL baholash (test va topshiriqlar) UI komponentini taqdim etishi kerak.
4. THE LMS_Frontend SHALL davomat UI komponentini taqdim etishi kerak.
5. THE LMS_Frontend SHALL kommunikatsiya (bildirishnomalar va shikoyat) UI komponentini taqdim etishi kerak.
6. THE LMS_Frontend SHALL hisobotlar UI komponentini taqdim etishi kerak.
7. THE LMS_Frontend SHALL sertifikatlash UI komponentini taqdim etishi kerak.

### Requirement 19: Ko'p tilli qo'llab-quvvatlash

**User Story:** Foydalanuvchi sifatida tizim interfeysini o'zbek, rus yoki ingliz tillarida ko'rishni xohlayman, shunda men uchun qulay tilda ishlay olaman.

#### Acceptance Criteria

1. THE Localization_Module SHALL o'zbek (boshlang'ich), rus va ingliz tillarini qo'llab-quvvatlashi kerak.
2. THE Localization_Module SHALL header da til tanlash boshqaruvini taqdim etishi kerak.
3. WHEN foydalanuvchi tilni o'zgartiradi, THE Localization_Module SHALL barcha UI matnlarini sahifani qayta yuklamasdan tanlangan tilga almashtirishi kerak.
4. THE Localization_Module SHALL tanlangan tilni `localStorage` da saqlashi va keyingi sessiyalarda foydalanishi kerak.
5. IF foydalanuvchi mahalliylashtirish kaliti uchun tarjima topilmasa, THEN THE Localization_Module SHALL boshlang'ich (o'zbek) tarjimasiga qaytishi kerak.

### Requirement 20: Responsiv dizayn va qulaylik

**User Story:** Foydalanuvchi sifatida tizimga noutbuk, planshet yoki telefon orqali kirishni xohlayman, shunda istalgan qurilmadan o'qiy olaman.

#### Acceptance Criteria

1. THE LMS_Frontend SHALL kamida 1280px (desktop), 768px (tablet) va 375px (mobile) ekran o'lchamlarida to'g'ri ko'rinishi kerak.
2. WHEN ekran kengligi 768px dan kichik bo'lsa, THE LMS_Frontend SHALL yon panelni gamburger menyu ichiga yashirishi kerak.
3. THE LMS_Frontend SHALL barcha interaktiv elementlar uchun klaviatura navigatsiyasini qo'llab-quvvatlashi kerak.
4. THE LMS_Frontend SHALL barcha tugma va havolalar uchun fokus indikatorini ko'rsatishi kerak.
5. THE LMS_Frontend SHALL barcha rasm va ikonkalar uchun `alt` matni yoki `aria-label` atributini ta'minlashi kerak.
6. THE LMS_Frontend SHALL matn va fon ranglari o'rtasida WCAG 2.1 AA darajasidagi 4.5:1 kontrast nisbatini saqlashi kerak.

### Requirement 21: API bilan o'zaro aloqa

**User Story:** Tizim sifatida backend bilan ishonchli va xavfsiz tarzda aloqa qilishni xohlayman, shunda ma'lumotlar to'g'ri uzatiladi.

#### Acceptance Criteria

1. THE API_Client SHALL barcha so'rovlarni `/api/v1/` prefiksli URL larga yuborishi kerak.
2. THE API_Client SHALL har bir so'rovga `Authorization: Bearer <JWT_Token>` sarlavhasini avtomatik qo'shishi kerak.
3. WHEN backend 401 javobi qaytaradi, THE API_Client SHALL bir marta refresh token bilan yangilanishga urinishi va so'rovni qayta yuborishi kerak.
4. WHEN backend 5xx javobi qaytaradi, THE API_Client SHALL eksponensial backoff bilan 3 martagacha qayta urinish qilishi kerak.
5. THE Query_Layer SHALL server holatini React Query 5 yordamida keshlashi va bir xil so'rovlar uchun ortiqcha tarmoq trafigini oldini olishi kerak.
6. THE Global_Store SHALL foydalanuvchi profili, tanlangan til va mavzu kabi mijoz holatini Zustand 4 yordamida saqlashi kerak.
