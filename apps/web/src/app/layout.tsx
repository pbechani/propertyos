import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
