import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: 'PRIBEC - Real Estate & Construction Trust Platform',
  description:
    'Financial-grade platform for real estate transactions and construction management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function () {
            try {
              var stored = localStorage.getItem('theme');
              if (stored === 'dark' || stored === 'light') {
                document.documentElement.classList.add(stored);
              } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.add('light');
              }
            } catch (e) {
              document.documentElement.classList.add('light');
            }
          })();`}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
