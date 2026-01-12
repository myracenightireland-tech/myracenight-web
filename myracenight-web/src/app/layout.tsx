import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'MyRaceNight - Fundraising Race Night Platform',
  description: 'Host amazing fundraising race nights for your club. Create horses, place bets, and compete on the leaderboard!',
  keywords: ['fundraising', 'race night', 'GAA', 'rugby', 'club events', 'charity'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MyRaceNight',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0F1419',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
