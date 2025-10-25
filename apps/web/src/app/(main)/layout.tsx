import { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BottomActionBar from '@/components/layout/BottomActionBar';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { ErrorToastProvider } from '@/components/error/ErrorToastProvider';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <ErrorBoundary>
      <ErrorToastProvider>
        <div className="min-h-screen flex flex-col">
          {/* Skip link for keyboard navigation */}
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>

          <Header />
          <main
            id="main-content"
            className="flex-1 container mx-auto px-4 py-6 md:py-8 pb-20 md:pb-8"
            tabIndex={-1}
          >
            <div className="max-w-4xl mx-auto">{children}</div>
          </main>
          <Footer />
          <BottomActionBar />
        </div>
      </ErrorToastProvider>
    </ErrorBoundary>
  );
}
