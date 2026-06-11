// Backend REST API endpoint URL konstantalari.
//
// Barcha yo'llar `apiClient` ning `baseURL` ("/api/v1") ga nisbatan
// (relative) beriladi — shu sababli ular `/` bilan boshlanadi, lekin
// `/api/v1` prefiksini O'ZI ICHIGA OLMAYDI (Req 21.1).
//
// Parametrli yo'llar funksiya sifatida, statik yo'llar string sifatida
// beriladi. Bu modul faqat URL konstantalarini e'lon qiladi — HTTP
// chaqiruvlari va interceptorlar alohida modullarda joylashadi.

export const endpoints = {
  // Autentifikatsiya — Req 1
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    oneIdAuthorize: '/auth/oneid/authorize',
    oneIdCallback: '/auth/oneid/callback',
  },

  // Foydalanuvchilar (admin) — Req 11.1
  users: {
    list: '/users',
    detail: (userId: string) => `/users/${userId}`,
  },

  // Kurslar — Req 3, 10, 11
  courses: {
    list: '/courses',
    create: '/courses',
    detail: (courseId: string) => `/courses/${courseId}`,
    update: (courseId: string) => `/courses/${courseId}`,
    students: (courseId: string) => `/courses/${courseId}/students`,
  },

  // Darslar va materiallar — Req 3, 10
  lessons: {
    listByCourse: (courseId: string) => `/courses/${courseId}/lessons`,
    create: (courseId: string) => `/courses/${courseId}/lessons`,
    detail: (lessonId: string) => `/lessons/${lessonId}`,
    materials: (lessonId: string) => `/lessons/${lessonId}/materials`,
    upcoming: '/lessons/upcoming',
  },

  // Progress (video) — Req 4
  progress: {
    video: '/progress/video',
    videoByLesson: (lessonId: string) => `/progress/video/${lessonId}`,
  },

  // SCORM / xAPI — Req 6
  scorm: {
    xapi: '/scorm/xapi',
    data: (attemptId: string) => `/scorm/${attemptId}/data`,
    commit: (attemptId: string) => `/scorm/${attemptId}/commit`,
  },

  // Proktoring — Req 8
  proctoring: {
    events: '/proctoring/events',
    sessionStart: (assessmentId: string) =>
      `/proctoring/${assessmentId}/start`,
  },

  // Davomat — Req 9
  attendance: {
    checkIn: '/attendance/check-in',
    checkOut: '/attendance/check-out',
    history: '/attendance/history',
    byCourse: (courseId: string) => `/attendance/courses/${courseId}`,
  },

  // Baholashlar (test/topshiriq) — Req 7, 10
  assessments: {
    list: '/assessments',
    create: '/assessments',
    detail: (assessmentId: string) => `/assessments/${assessmentId}`,
    start: (assessmentId: string) => `/assessments/${assessmentId}/start`,
    answers: (assessmentId: string) => `/assessments/${assessmentId}/answers`,
    submit: (assessmentId: string) => `/assessments/${assessmentId}/submit`,
    submissions: (assessmentId: string) =>
      `/assessments/${assessmentId}/submissions`,
    ungradedCount: '/assessments/ungraded-count',
    grade: (assessmentId: string, submissionId: string) =>
      `/assessments/${assessmentId}/submissions/${submissionId}/grade`,
  },

  // HEMIS sinxronizatsiya — Req 12
  sync: {
    start: (type: string) => `/sync/${type}`,
    status: (jobId: string) => `/sync/jobs/${jobId}`,
    history: '/sync/jobs',
    errorLog: (jobId: string) => `/sync/jobs/${jobId}/errors`,
  },

  // Monitoring (vazirlik darajasi) — Req 13
  monitoring: {
    indicators: '/monitoring/indicators',
    otmStats: '/monitoring/otm-stats',
    contingent: '/monitoring/contingent',
    export: '/monitoring/export',
  },

  // Sertifikatlar — Req 14
  certificates: {
    list: '/certificates',
    detail: (certificateId: string) => `/certificates/${certificateId}`,
    download: (certificateId: string) =>
      `/certificates/${certificateId}/download`,
    verify: (certificateId: string) => `/certificates/${certificateId}/verify`,
  },

  // Shikoyatlar — Req 15
  complaints: {
    list: '/complaints',
    create: '/complaints',
    detail: (complaintId: string) => `/complaints/${complaintId}`,
  },

  // Feedback (shikoyat) — same as complaints but with feedback naming for consistency
  feedback: {
    list: '/complaints',
    create: '/complaints', 
    detail: (complaintId: string) => `/complaints/${complaintId}`,
    history: '/complaints',
  },

  // Bildirishnomalar — Req 16
  notifications: {
    list: '/notifications',
    markRead: (notificationId: string) =>
      `/notifications/${notificationId}/read`,
    markAllRead: '/notifications/read-all',
  },

  // Hisobotlar — Req 17
  reports: {
    list: '/reports',
    generate: (reportType: string) => `/reports/${reportType}`,
    export: (reportType: string) => `/reports/${reportType}/export`,
  },
} as const

export type Endpoints = typeof endpoints
