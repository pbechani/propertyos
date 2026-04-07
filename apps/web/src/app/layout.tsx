import type { Metadata } from 'next';
import Script from 'next/script';
import { Fraunces, Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import HomeNavbar from '@/components/HomeNavbar';
import { Toaster } from '@/components/ui/sonner';
import AuthenticatedShell from '@/components/AuthenticatedShell';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'BuildTrust',
  description:
    'Financial-grade platform for real estate transactions and construction management in emerging markets',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${fraunces.variable} ${jakarta.variable} ${mono.variable} ${jakarta.className} app-theme-scope`} suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function () {
            try {
              localStorage.setItem('theme', 'light');
              document.documentElement.classList.remove('light', 'dark');
              document.documentElement.classList.add('light');
            } catch (e) {
              document.documentElement.classList.add('light');
            }
          })();`}
        </Script>
        <ThemeProvider>
          <HomeNavbar />
          <AuthenticatedShell>{children}</AuthenticatedShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
