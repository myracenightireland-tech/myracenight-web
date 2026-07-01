import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Trophy, Users, Zap, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'MyRaceNight - Fundraising Race Nights for Irish Clubs',
  description:
    'MyRaceNight helps Irish clubs run unforgettable fundraising race nights — sell tickets, create horses with AI commentary and follow a live leaderboard. Free to host, most proceeds go to your club.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-night relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 racing-stripes opacity-50" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-racing-green/20 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-gold/10 via-transparent to-transparent" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/20">
            <span className="text-2xl">🏇</span>
          </div>
          <span className="font-display text-2xl font-bold gradient-text">MyRaceNight</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="px-5 py-2.5 text-gray-300 hover:text-white transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-5 py-2.5 bg-gold text-night font-semibold rounded-lg hover:bg-gold-light transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-racing-green/30 border border-racing-green-light/30 rounded-full text-sm text-racing-green-light mb-8 animate-fade-in">
            <Star className="w-4 h-4 text-gold" />
            <span>Trusted by 500+ clubs across Ireland</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 animate-slide-up">
            <span className="text-white">Unforgettable</span>
            <br />
            <span className="gold-shimmer">Race Night Fundraisers</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-up stagger-1">
            Turn your club night into an electric event. AI-powered commentary, 
            hilarious horse backstories, and a leaderboard that keeps everyone cheering.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-2">
            <Link
              href="/auth/register"
              className="group flex items-center gap-2 px-8 py-4 bg-gold text-night font-bold text-lg rounded-xl hover:bg-gold-light transition-all shadow-lg shadow-gold/25 hover:shadow-xl hover:shadow-gold/30 hover:-translate-y-1"
            >
              Host Your Race Night
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-4 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/5 transition-all"
            >
              See How It Works
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 animate-slide-up stagger-3">
          {[
            { value: '€2.5M+', label: 'Raised for clubs' },
            { value: '500+', label: 'Events hosted' },
            { value: '50K+', label: 'Happy attendees' },
            { value: '4.9★', label: 'Average rating' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl md:text-5xl font-display font-bold gradient-text mb-2">
                {stat.value}
              </p>
              <p className="text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div id="how-it-works" className="mt-32">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">
            Everything You Need for an
            <span className="gradient-text"> Epic Night</span>
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
            From ticket sales to trophy ceremonies, we handle the tech so you can focus on the craic.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Trophy,
                title: 'Create Your Horses',
                description: 'Attendees name their horse, write a hilarious backstory, and design their racing silks.',
              },
              {
                icon: Zap,
                title: 'AI Commentary',
                description: 'Watch races with custom AI-generated commentary that mentions every horse by name.',
              },
              {
                icon: Users,
                title: 'Live Leaderboard',
                description: 'Track credits in real-time. Top betters win prizes and eternal glory.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 bg-night-light border border-night-lighter rounded-2xl hover:border-gold/30 transition-all duration-300 card-hover"
              >
                <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div id="pricing" className="mt-32">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-sm text-gold mb-6">
              <Star className="w-4 h-4" />
              <span>Beta pricing — subject to confirmation</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Simple, Honest
              <span className="gradient-text"> Pricing</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We only do well when your club does. There&apos;s no upfront cost — a small platform
              fee simply comes off ticket sales, and the large majority of proceeds go straight to
              your club.
            </p>
          </div>

          <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Free to host',
                description:
                  'Create your club, build events and sell tickets with no setup fee and no subscription.',
              },
              {
                title: 'Small platform fee',
                description:
                  'A modest fee comes off ticket sales to keep the platform running. During beta it scales with your ticket price — a higher ticket price means a lower fee.',
              },
              {
                title: 'Most goes to your club',
                description:
                  'The large majority of every ticket goes to your fundraiser. The exact rate is confirmed with you for each event before it goes live.',
              },
            ].map((tier, i) => (
              <div
                key={i}
                className="p-6 bg-night-light border border-night-lighter rounded-2xl text-center"
              >
                <h3 className="text-lg font-semibold mb-3 text-gold">{tier.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{tier.description}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm mt-8 max-w-2xl mx-auto">
            MyRaceNight is in beta and there is no fixed percentage yet — pricing is confirmed per
            event and may change as the platform develops. Questions? Email{' '}
            <a href="mailto:myracenightireland@gmail.com" className="text-gold hover:text-gold-light">
              myracenightireland@gmail.com
            </a>
            .
          </p>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center">
          <div className="inline-block p-12 bg-gradient-to-br from-racing-green/20 to-racing-green/5 border border-racing-green-light/20 rounded-3xl">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Raise Some Funds?
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Join hundreds of clubs who've transformed their fundraising with MyRaceNight.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-night font-bold text-lg rounded-xl hover:bg-gold-light transition-all shadow-lg shadow-gold/25"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-night-lighter py-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col gap-8">
          {/* Footer nav */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
            <Link href="/how-it-works" className="text-gray-400 hover:text-gold transition-colors">
              How It Works
            </Link>
            <Link href="/pricing" className="text-gray-400 hover:text-gold transition-colors">
              Pricing
            </Link>
            <Link href="/faq" className="text-gray-400 hover:text-gold transition-colors">
              FAQ
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-gold transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-gold transition-colors">
              Privacy
            </Link>
          </nav>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏇</span>
              <span className="font-display text-xl font-bold text-gray-400">MyRaceNight</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-sm">
              <a
                href="mailto:myracenightireland@gmail.com"
                className="text-gray-400 hover:text-gold transition-colors"
              >
                myracenightireland@gmail.com
              </a>
              <p className="text-gray-500">© 2025 MyRaceNight. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
