import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

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
    <html lang="en" className={poppins.variable}>
      <body className="antialiased select-none bg-slate-100 text-slate-800 min-h-screen">
        {children}
      </body>
    </html>
  );
}
