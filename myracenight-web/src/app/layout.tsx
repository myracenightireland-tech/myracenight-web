import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MyRaceNight - Fundraising Race Night Platform',
  description: 'Host amazing fundraising race nights for your club. Create horses, place bets, and compete on the leaderboard!',
  keywords: ['fundraising', 'race night', 'GAA', 'rugby', 'club events', 'charity'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
