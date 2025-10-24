import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import ErrorBoundary from '@/components/layout/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { getCriticalCSS } from '@/lib/utils/critical-css';
import PerformanceMonitor from '@/components/PerformanceMonitor';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ThisOrThat - Make Decisions Easier',
  description:
    'Create and participate in quick polls to make decisions easier with community insights.',
  keywords: ['polls', 'decisions', 'voting', 'community', 'surveys'],
  authors: [{ name: 'ThisOrThat Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: getCriticalCSS() }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
        <PerformanceMonitor />
      </body>
    </html>
  );
}
