import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - MyRaceNight',
  description:
    'The terms governing use of MyRaceNight, the Irish fundraising race night platform for clubs — hosting events, ticket sales, platform fees and your responsibilities as a host or attendee.',
};

const lastUpdated = '1 July 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-night text-gray-300">
      {/* Nav */}
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
        {/* DRAFT note */}
        <div className="mb-8 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-yellow-300 text-sm">
          <strong>DRAFT — pending legal review before public launch.</strong> This document is a
          working draft provided for internal review only. It is not final and does not constitute
          legal advice.
        </div>

        <h1 className="text-4xl font-display font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-10">Last updated: {lastUpdated}</p>

        <div className="space-y-8 leading-relaxed">
          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">1. Who we are</h2>
            <p>
              MyRaceNight (&ldquo;MyRaceNight&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) provides an
              online platform that helps clubs, schools and community groups in Ireland run
              fundraising race night events. These Terms of Service (&ldquo;Terms&rdquo;) govern your
              access to and use of our website and services (the &ldquo;Service&rdquo;). By creating
              an account or using the Service you agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">2. Eligibility &amp; accounts</h2>
            <p>
              You must be at least 18 years old to create a host account. You are responsible for
              keeping your login credentials secure and for all activity that happens under your
              account. Please tell us promptly if you believe your account has been accessed without
              your permission. Information you provide when registering must be accurate and kept up
              to date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">3. Hosting events</h2>
            <p>
              As a host you are responsible for organising and running your event lawfully, including
              any obligations relating to fundraising, gaming, lotteries and licensing that may apply
              to your event under Irish law. Race nights on MyRaceNight are intended as fundraising
              entertainment for your community. You are responsible for the accuracy of the event
              details, ticket prices and any prizes you advertise.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">4. Tickets, fees &amp; payments</h2>
            <p>
              Hosting on MyRaceNight is free to set up. A small platform fee is deducted from ticket
              sales to cover the cost of running the Service. During our current beta the platform fee
              scales with the venue&rsquo;s ticket price and the exact rate is confirmed for each
              event before it goes live; the large majority of proceeds go to your club. Fees and
              payout arrangements are subject to confirmation and may change as the Service develops.
              Payment processing may be handled by third-party providers, and their terms will also
              apply to those transactions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">5. Acceptable use</h2>
            <p>
              You agree not to misuse the Service, including by attempting to disrupt it, access it
              without authorisation, upload unlawful, offensive or infringing content, or use it to
              defraud attendees. We may suspend or remove content or accounts that breach these Terms
              or that we reasonably believe put attendees, clubs or the Service at risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">6. Intellectual property</h2>
            <p>
              The Service, including its software, design and branding, belongs to MyRaceNight or its
              licensors. Content you create for your event (such as horse names and backstories)
              remains yours, but you grant us the licence we need to host and display it in order to
              run your event.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">7. Availability &amp; beta status</h2>
            <p>
              The Service is currently offered on a beta basis. We work hard to keep it available and
              reliable but we do not guarantee that it will be uninterrupted or error-free, and
              features may change while we improve the product.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">8. Liability</h2>
            <p>
              To the fullest extent permitted by law, MyRaceNight is not liable for indirect or
              consequential loss arising from your use of the Service. Nothing in these Terms limits
              any liability that cannot be limited under Irish law. This does not affect the statutory
              rights of consumers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">9. Privacy</h2>
            <p>
              Our{' '}
              <Link href="/privacy" className="text-gold hover:text-gold-light">
                Privacy Policy
              </Link>{' '}
              explains how we collect and use personal data such as names, email addresses and payment
              information. Please read it carefully — by using the Service you also accept our Privacy
              Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">10. Changes to these Terms</h2>
            <p>
              We may update these Terms from time to time. Where changes are material we will take
              reasonable steps to let you know. Continued use of the Service after changes take effect
              means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">11. Governing law</h2>
            <p>
              These Terms are governed by the laws of Ireland, and the courts of Ireland have
              jurisdiction over any dispute arising from them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">12. Contact</h2>
            <p>
              Questions about these Terms? Email us at{' '}
              <a href="mailto:myracenightireland@gmail.com" className="text-gold hover:text-gold-light">
                myracenightireland@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
