// Sertifikat
export interface Certificate {
  id: string;
  courseTitle: string;
  number: string;
  issuedAt: string;
  pdfUrl: string;
  qrUrl: string;
  verifyUrl: string;
  eSigned: boolean;
  signerOrg: string | null;
}
