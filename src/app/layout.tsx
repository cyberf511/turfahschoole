import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { arSA } from '@clerk/localizations';
import '@/styles/globals.css';
import '@/styles/animations.css';
import '@/styles/components.css';
import '@/styles/dashboard.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'منصة العمل التطوعي — ثانوية طرفة بنت عبدالعزيز',
  description: 'منصة لحصر ساعات التطوع لدى الطالبات وتقديم الفرص التطوعية في ثانوية طرفة بنت عبدالعزيز',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={arSA} afterSignOutUrl="/">
      <html lang="ar" dir="rtl" data-theme="dark" suppressHydrationWarning>
        <body>
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
