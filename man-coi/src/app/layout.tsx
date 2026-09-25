import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Chuỗi Mân Côi – Minigame Thiếu Nhi',
  description:
    'Website minigame khuyến khích thiếu nhi đọc kinh Mân Côi. Mỗi hạt – một bước yêu thương. Cùng nhau xây dựng thói quen cầu nguyện, việc tốt và tinh thần đoàn kết.',
  keywords: ['Mân Côi', 'thiếu nhi', 'Công giáo', 'giáo xứ', 'cầu nguyện'],
  authors: [{ name: 'Giáo xứ Tân Hương' }],
  openGraph: {
    title: '📿 Chuỗi Mân Côi – Mỗi hạt, một bước yêu thương',
    description: 'Minigame hành trình Mân Côi dành cho thiếu nhi Công giáo',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
