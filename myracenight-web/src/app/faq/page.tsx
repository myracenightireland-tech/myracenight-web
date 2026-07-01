import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ - MyRaceNight',
  description:
    'Answers to common questions about MyRaceNight — what a race night is, what it costs, how attendees join, how payments and data are handled, and how to get support for your club fundraiser.',
};

const faqs = [
  {
    q: 'What is MyRaceNight?',
    a: 'MyRaceNight is an online platform that helps Irish clubs and community groups run fundraising race night events. Attendees create their own horses, races are run with AI-generated commentary, and a live leaderboard keeps everyone cheering.',
  },
  {
    q: 'How much does it cost?',
    a: 'Hosting is free — there is no setup fee or subscription. A small platform fee comes off ticket sales instead. We are currently in beta, so the exact rate is confirmed per event and the large majority of proceeds go to your club. See the pricing page for details.',
  },
  {
    q: 'How do attendees take part?',
    a: 'You share your event link and attendees buy a ticket. Each person can create a horse with a name, a backstory and racing silks, then follow the races and the leaderboard on the night.',
  },
  {
    q: 'How are payments handled?',
    a: 'Ticket payments are processed securely through our payment providers. Card details are handled by those providers and are not stored by MyRaceNight directly.',
  },
  {
    q: 'What about my data and GDPR?',
    a: 'We handle personal data such as names, emails and payment information in line with the GDPR and Irish data protection law. Our privacy policy explains what we collect, how we use it and the rights you have over your data.',
  },
  {
    q: 'Do I need a licence to run a race night?',
    a: 'Responsibility for any fundraising, gaming or licensing requirements that apply to your event rests with you as the host. We recommend checking what applies to your event under Irish law before you go live.',
  },
  {
    q: 'How do I get help?',
    a: 'Email us any time at myracenightireland@gmail.com and we will be happy to help you set up and run your event.',
  },
];

export default function FaqPage() {
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
        <h1 className="text-4xl font-display font-bold text-white mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-400 mb-12 max-w-2xl">
          Everything you need to know about running a fundraising race night with MyRaceNight.
        </p>

        <div className="space-y-5">
          {faqs.map((faq, i) => (
            <div key={i} className="p-6 bg-night-light border border-night-lighter rounded-2xl">
              <h2 className="text-lg font-semibold text-white mb-2">{faq.q}</h2>
              <p className="text-gray-400 leading-relaxed">
                {faq.q === 'How do I get help?' ? (
                  <>
                    Email us any time at{' '}
                    <a
                      href="mailto:myracenightireland@gmail.com"
                      className="text-gold hover:text-gold-light"
                    >
                      myracenightireland@gmail.com
                    </a>{' '}
                    and we will be happy to help you set up and run your event.
                  </>
                ) : (
                  faq.a
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-night font-bold text-lg rounded-xl hover:bg-gold-light transition-all shadow-lg shadow-gold/25"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-6 text-sm text-gray-500">
            Learn more about{' '}
            <Link href="/how-it-works" className="text-gold hover:text-gold-light">
              how it works
            </Link>{' '}
            or view{' '}
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
