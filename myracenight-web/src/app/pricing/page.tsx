import Link from 'next/link';
import type { Metadata } from 'next';
import { Check, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing - MyRaceNight',
  description:
    'MyRaceNight pricing is simple and honest: free to host, a small platform fee comes off ticket sales, and the exact rate is confirmed per event. Currently in beta and subject to confirmation.',
};

const points = [
  {
    title: 'Free to host',
    description:
      'Create your club, build events and sell tickets with no setup fee and no monthly subscription. You only ever pay through the small fee on tickets sold.',
  },
  {
    title: 'A small platform fee on tickets',
    description:
      'A modest fee comes off ticket sales to keep the platform running. During our beta the fee scales with the venue’s ticket price — a higher ticket price means a lower fee.',
  },
  {
    title: 'Most proceeds go to your club',
    description:
      'The large majority of every ticket goes straight to your fundraiser. The exact rate is confirmed with you for each event before it goes live, so there are no surprises.',
  },
];

export default function PricingPage() {
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
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-sm text-gold mb-6">
          <span>Beta pricing — subject to confirmation</span>
        </div>
        <h1 className="text-4xl font-display font-bold text-white mb-3">Pricing</h1>
        <p className="text-gray-400 mb-12 max-w-2xl">
          We only do well when your club does. There&apos;s no upfront cost — a small platform fee
          simply comes off ticket sales, and the large majority of proceeds go to your fundraiser.
        </p>

        <div className="space-y-5">
          {points.map((point, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-6 bg-night-light border border-night-lighter rounded-2xl"
            >
              <div className="w-8 h-8 flex-shrink-0 bg-gold/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">{point.title}</h2>
                <p className="text-gray-400 leading-relaxed">{point.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-5 bg-night-light border border-night-lighter rounded-2xl text-sm text-gray-400 leading-relaxed">
          <strong className="text-gray-300">Please note:</strong> MyRaceNight is in beta and there is
          no fixed percentage yet. Pricing is confirmed per event and may change as the platform
          develops. If you have any questions about fees for your event, email us at{' '}
          <a href="mailto:myracenightireland@gmail.com" className="text-gold hover:text-gold-light">
            myracenightireland@gmail.com
          </a>{' '}
          and we&apos;ll talk it through.
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-night font-bold text-lg rounded-xl hover:bg-gold-light transition-all shadow-lg shadow-gold/25"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
