import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { arSA } from '@clerk/localizations';
import '@/styles/globals.css';
import '@/styles/animations.css';
import '@/styles/components.css';
import '@/styles/dashboard.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'منصة التطوع الطلابي',
  description: 'منصة احترافية لإدارة برامج التطوع الطلابي في المدارس',
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
