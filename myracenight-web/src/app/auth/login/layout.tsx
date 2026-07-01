import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - MyRaceNight',
  description:
    "Sign in to your MyRaceNight account to manage your club's fundraising race nights — sell tickets, run races and follow the live leaderboard.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
