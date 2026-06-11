// Ilova va panel darajasidagi xatolarni ushlovchi ErrorBoundary (Req 18, 21.5).
//
// React render daraxtidagi kutilmagan xatolarni ushlaydi va butun ilovaning
// "oq ekran" bilan qulashini oldini oladi. Ikki darajada ishlatiladi:
//   - App darajasi  → `RouterProvider` ni o'rab, marshrutlash/provayder
//     bosqichidagi xatolarni ushlaydi.
//   - Panel darajasi → `ProtectedLayout` ichidagi `<Outlet />` ni o'rab, bitta
//     feature sahifasidagi xato butun panelni (Header/Sidebar) buzmasligini
//     ta'minlaydi — foydalanuvchi navigatsiyani saqlab qoladi.
//
// React error boundary faqat class komponent sifatida amalga oshiriladi
// (`getDerivedStateFromError` / `componentDidCatch`).

import { Component, type ErrorInfo, type ReactNode } from "react";

import { ErrorBoundaryFallback } from "./error-boundary-fallback";

export interface ErrorBoundaryProps {
  /** Himoyalanadigan daraxt. */
  children: ReactNode;
  /**
   * Ko'rsatiladigan fallback turi:
   *   - "app"   → to'liq ekran xato sahifasi (standart)
   *   - "panel" → sahifa ichi (Header/Sidebar saqlanadi)
   */
  level?: "app" | "panel";
  /** Ixtiyoriy maxsus fallback (berilmasa standart UI ko'rsatiladi). */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Render xatolarini ushlab, qulashni oldini oluvchi chegara komponenti.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Diagnostika uchun konsolga yoziladi; markazlashgan log xizmati
    // qo'shilganda shu yerga ulanadi.
    console.error("ErrorBoundary ushladi:", error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }
      return (
        <ErrorBoundaryFallback
          level={this.props.level ?? "app"}
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
