import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gorgias Flows to Guidance Migrator',
  description: 'Migrate your Gorgias Flows to AI Guidances',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
