import { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link for keyboard navigation */}
      <a 
        href="#main-content" 
        className="skip-link"
      >
        Skip to main content
      </a>
      
      <Header />
      <main 
        id="main-content"
        className="flex-1 container mx-auto px-4 py-6 md:py-8"
        tabIndex={-1}
      >
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
