import Link from 'next/link';
import type { Metadata } from 'next';
import { PenTool, Ticket, Zap, Trophy, HeartHandshake, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works - MyRaceNight',
  description:
    'See how a MyRaceNight fundraiser works, step by step — create your event, let attendees design horses, sell tickets, run races with AI commentary and pay the proceeds to your club.',
};

const steps = [
  {
    icon: PenTool,
    title: '1. Create your event',
    description:
      'Set up your club, name your race night, choose your races and set a ticket price. Hosting is free — there is no setup fee or subscription.',
  },
  {
    icon: Ticket,
    title: '2. Sell tickets & invite attendees',
    description:
      'Share your event link. Attendees buy tickets and create their own horse — a name, a hilarious backstory and racing silks.',
  },
  {
    icon: Zap,
    title: '3. Run the races with AI commentary',
    description:
      'On the night, run each race with custom AI-generated commentary that calls every horse by name for maximum craic.',
  },
  {
    icon: Trophy,
    title: '4. Track the live leaderboard',
    description:
      'Credits and results update in real time on a big-screen leaderboard, so everyone can follow the action and cheer on their horse.',
  },
  {
    icon: HeartHandshake,
    title: '5. Funds go to your club',
    description:
      'A small platform fee comes off ticket sales and the large majority of the proceeds go straight to your fundraiser.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-night text-gray-300">
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-8 py-6 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
            <span className="text-xl">🏇</span>
          </div>
          <span className="font-display text-xl font-bold gradient-text">MyRaceNight</span>
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Back to home
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 sm:px-8 pb-24">
        <h1 className="text-4xl font-display font-bold text-white mb-3">How It Works</h1>
        <p className="text-gray-400 mb-12 max-w-2xl">
          From setup to the final furlong, MyRaceNight handles the tech so your club can focus on a
          great night out. Here&apos;s the whole journey.
        </p>

        <div className="space-y-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-5 p-6 bg-night-light border border-night-lighter rounded-2xl"
            >
              <div className="w-12 h-12 flex-shrink-0 bg-gold/10 rounded-xl flex items-center justify-center">
                <step.icon className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">{step.title}</h2>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-night font-bold text-lg rounded-xl hover:bg-gold-light transition-all shadow-lg shadow-gold/25"
          >
            Host Your Race Night
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-6 text-sm text-gray-500">
            Questions first? Read our{' '}
            <Link href="/faq" className="text-gold hover:text-gold-light">
              FAQ
            </Link>{' '}
            or see{' '}
            <Link href="/pricing" className="text-gold hover:text-gold-light">
              pricing
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
