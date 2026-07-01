import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - MyRaceNight',
  description:
    'How MyRaceNight collects, uses and protects your personal data — names, emails and payment information — under GDPR and Irish data protection law, and the rights you have over your data.',
};

const lastUpdated = '1 July 2026';

export default function PrivacyPage() {
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

        <h1 className="text-4xl font-display font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-10">Last updated: {lastUpdated}</p>

        <div className="space-y-8 leading-relaxed">
          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              This Privacy Policy explains how MyRaceNight (&ldquo;we&rdquo;, &ldquo;us&rdquo;)
              collects, uses and protects your personal data when you use our fundraising race night
              platform. We are committed to handling your data in line with the EU General Data
              Protection Regulation (GDPR) and Irish data protection law. This is a draft policy for
              our beta and will be finalised before public launch.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">2. What data we collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account details</strong> — your name, email address and, where relevant, a
                phone number and password or PIN used to sign in.
              </li>
              <li>
                <strong>Event data</strong> — information you create when hosting or joining an event,
                such as club details, horse names and backstories.
              </li>
              <li>
                <strong>Payment information</strong> — where tickets are paid for, transaction details
                needed to process and reconcile payments. Card details are handled by our payment
                providers, not stored by us directly.
              </li>
              <li>
                <strong>Usage data</strong> — basic technical information such as device and log data
                needed to operate and secure the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">3. How we use your data</h2>
            <p>
              We use your data to create and manage your account, run events and process ticket sales,
              provide customer support, keep the Service secure, meet our legal obligations, and
              improve the platform. We rely on lawful bases under the GDPR including performance of a
              contract with you, your consent (for example when you agree to these terms at
              registration), our legitimate interests in running and improving the Service, and
              compliance with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">4. Sharing your data</h2>
            <p>
              We do not sell your personal data. We share it only with service providers who help us
              run the platform (such as hosting and payment processors), the club or host of an event
              you take part in for the purpose of running that event, and authorities where we are
              legally required to do so. Where providers process data on our behalf, they are bound to
              protect it and use it only as instructed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">5. International transfers</h2>
            <p>
              Some providers may process data outside the European Economic Area. Where that happens
              we take steps to ensure appropriate safeguards are in place, such as standard
              contractual clauses, so that your data remains protected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">6. How long we keep it</h2>
            <p>
              We keep personal data only for as long as needed for the purposes described above, to
              meet legal and accounting obligations, and to resolve disputes. When it is no longer
              needed we delete or anonymise it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">7. Your rights</h2>
            <p>
              Under the GDPR you have the right to access your data, to have it corrected or deleted,
              to restrict or object to certain processing, to data portability, and to withdraw
              consent where we rely on it. You also have the right to lodge a complaint with the Irish
              Data Protection Commission (www.dataprotection.ie). To exercise any of these rights,
              contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">8. Security</h2>
            <p>
              We use appropriate technical and organisational measures to protect your data against
              loss, misuse and unauthorised access. No online service can be completely secure, but we
              work to keep your information safe and to respond promptly to any issues.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">9. Cookies</h2>
            <p>
              We use only the cookies and similar technologies needed to keep you signed in and to
              operate the Service securely. A fuller cookie notice will be provided before public
              launch.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">10. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy as the Service develops. Where changes are material we
              will take reasonable steps to let you know.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">11. Contact us</h2>
            <p>
              For any privacy question or to exercise your rights, email us at{' '}
              <a href="mailto:myracenightireland@gmail.com" className="text-gold hover:text-gold-light">
                myracenightireland@gmail.com
              </a>
              . See also our{' '}
              <Link href="/terms" className="text-gold hover:text-gold-light">
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
