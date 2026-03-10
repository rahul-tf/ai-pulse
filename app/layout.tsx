// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Pulse — 360° AI Intelligence Feed',
  description:
    'Live intelligence across AI research, news, products, lab blogs, social discourse, and developer tools. All in one place.',
  openGraph: {
    title: 'AI Pulse',
    description: '360° AI intelligence feed — research to products to community',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
