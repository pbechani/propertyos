import type { Metadata } from 'next';
import Script from 'next/script';
import { Manrope } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import HomeNavbar from '@/components/HomeNavbar';
import { Toaster } from '@/components/ui/sonner';
import AuthenticatedShell from '@/components/AuthenticatedShell';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PropertyOS',
  description:
    'Financial-grade platform for real estate transactions and construction management',
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.className} app-theme-scope`} suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function () {
            try {
              document.documentElement.classList.remove('dark');
              document.documentElement.classList.add('light');
              localStorage.setItem('theme', 'light');
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
