import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account - MyRaceNight',
  description:
    "Create a free MyRaceNight account and host your club's first fundraising race night in minutes — ticketing, AI race commentary and live leaderboards included.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
