import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/Header';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

export const viewport: Viewport = {
  themeColor: '#d97706',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: 'Mooda — 분위기로 찾는 카페',
    template: '%s | Mooda',
  },
  description: '원하는 분위기와 목적에 맞는 카페를 찾아보세요. 데이트, 사진 촬영, 혼카공, 모임까지.',
  keywords: ['카페', '분위기 카페', '데이트 카페', '촬영 카페', '혼카공', '서울 카페'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mooda',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Mooda — 분위기로 찾는 카페',
    description: '원하는 분위기와 목적에 맞는 카페를 찾아보세요.',
    type: 'website',
    locale: 'ko_KR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <InstallPrompt />
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
