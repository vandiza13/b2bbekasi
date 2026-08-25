import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dashboard Branch Bekasi | Performance Dashboard',
  description: 'Monitoring TTR Performance dan Assurance Guarantee berdasarkan Service Area Branch Bekasi',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-[#F8FAFC] text-slate-800 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
