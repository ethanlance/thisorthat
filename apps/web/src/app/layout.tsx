import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ErrorBoundary from "@/components/layout/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ThisOrThat - Make Decisions Easier",
  description: "Create and participate in quick polls to make decisions easier with community insights.",
  keywords: ["polls", "decisions", "voting", "community", "surveys"],
  authors: [{ name: "ThisOrThat Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ErrorBoundary>
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </ErrorBoundary>
      </body>
    </html>
  );
}
