// Unit tests for CertificatesList component

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CertificatesList } from './certificates-list'

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock API hook
vi.mock('../api/use-certificates', () => ({
  useCertificates: vi.fn(),
}))

import { useCertificates } from '../api/use-certificates'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('CertificatesList', () => {
  const mockOnViewCertificate = vi.fn()

  it('renders loading skeleton when loading', () => {
    vi.mocked(useCertificates).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as any)

    render(<CertificatesList onViewCertificate={mockOnViewCertificate} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByLabelText('common.loading')).toBeInTheDocument()
  })

  it('renders error state when error occurs', () => {
    vi.mocked(useCertificates).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as any)

    render(<CertificatesList onViewCertificate={mockOnViewCertificate} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('certificates.errorTitle')).toBeInTheDocument()
  })

  it('renders empty state when no certificates', () => {
    vi.mocked(useCertificates).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    render(<CertificatesList onViewCertificate={mockOnViewCertificate} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('certificates.noCertificates')).toBeInTheDocument()
  })

  it('renders certificates table when data is available', () => {
    const certificates = [
      {
        id: '1',
        courseTitle: 'Test Course',
        number: 'CERT-001',
        issuedAt: '2024-01-01',
        pdfUrl: 'test.pdf',
        qrUrl: 'qr.png',
        verifyUrl: 'https://verify.test',
        eSigned: true,
        signerOrg: 'Test Org',
      },
    ]

    vi.mocked(useCertificates).mockReturnValue({
      data: certificates,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    render(<CertificatesList onViewCertificate={mockOnViewCertificate} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Test Course')).toBeInTheDocument()
    expect(screen.getByText('CERT-001')).toBeInTheDocument()
  })
})