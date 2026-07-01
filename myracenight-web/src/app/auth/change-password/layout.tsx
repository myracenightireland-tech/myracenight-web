import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Change Password - MyRaceNight',
  description:
    'Set a new password for your MyRaceNight account. Guests signing in for the first time are asked to choose a secure password before continuing.',
};

export default function ChangePasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
