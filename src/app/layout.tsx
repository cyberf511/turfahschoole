import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { arSA } from '@clerk/localizations';
import { dark } from '@clerk/themes';
import '@/styles/globals.css';
import '@/styles/animations.css';
import '@/styles/components.css';
import '@/styles/dashboard.css';
import '@/styles/premium-dash.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'منصة العمل التطوعي — ثانوية طرفة بنت عبدالعزيز',
  description: 'منصة لحصر ساعات التطوع لدى الطالبات وتقديم الفرص التطوعية في ثانوية طرفة بنت عبدالعزيز',
  icons: { 
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider 
      localization={arSA} 
      afterSignOutUrl="/"
    >
      <html lang="ar" dir="rtl" data-theme="light" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        </head>
        <body>
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
