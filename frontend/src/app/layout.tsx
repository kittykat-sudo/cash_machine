import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chathura Printers — Cash Register & POS',
  description: 'Fast counter point-of-sale, automatic cashbook, and financial reporting for Chathura Printers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased select-none bg-slate-100 text-slate-800 min-h-screen">
        {children}
      </body>
    </html>
  );
}
