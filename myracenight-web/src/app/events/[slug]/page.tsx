'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, MapPin, Clock, Ticket, Trophy, Users, 
  Sparkles, ChevronRight, Gift, CreditCard, Share2
} from 'lucide-react';
import { Button, Badge, Card, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Event } from '@/types';

export default function PublicEventPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvent = async () => {
      try {
        // Fetch event by slug
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app'}/api/events/by-slug/${slug}`
        );
        if (!response.ok) throw new Error('Event not found');
        const data = await response.json();
        setEvent(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };
    loadEvent();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <Trophy className="w-16 h-16 text-gold mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-gray-400 mb-6">This event may have ended or the link is incorrect.</p>
          <Link href="/">
            <Button>Go to Homepage</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const eventDate = new Date(event.eventDate);
  const isUpcoming = eventDate > new Date();
  const horseDeadline = new Date(event.horseDeadline);
  const canSubmitHorse = horseDeadline > new Date();

  return (
    <div className="min-h-screen bg-night">
      {/* Header - Clean, just logo */}
      <header className="bg-night-light border-b border-night-lighter">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏇</span>
            <span className="font-display font-bold text-xl">MyRaceNight</span>
          </Link>
        </div>
      </header>

      {/* Hero Section - Mobile optimized */}
      <div className="relative bg-gradient-to-br from-racing-green via-night to-night-light py-8 sm:py-16">
        <div className="absolute inset-0 bg-racing-stripes opacity-5" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
            <Badge variant={event.status === 'LIVE' ? 'live' : event.status === 'PUBLISHED' ? 'success' : 'default'}>
              {event.status === 'LIVE' ? '🔴 Live Now' : isUpcoming ? 'Upcoming' : 'Past Event'}
            </Badge>
            {event.club && (
              <Badge variant="default">{event.club.name}</Badge>
            )}
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold mb-3 sm:mb-4">
            {event.name}
          </h1>
          
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-6 text-gray-300 text-sm sm:text-base mb-6 sm:mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gold flex-shrink-0" />
              <span>{eventDate.toLocaleDateString('en-IE', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gold flex-shrink-0" />
              <span>{eventDate.toLocaleTimeString('en-IE', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gold flex-shrink-0" />
              <span>{event.venue}</span>
            </div>
          </div>

          {/* CTA Buttons - Stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {isAuthenticated ? (
              /* Logged in user - go to dashboard */
              <Link href={`/events/${slug}/my-dashboard`} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto" leftIcon={<Trophy className="w-5 h-5" />}>
                  Go to My Dashboard
                </Button>
              </Link>
            ) : (
              /* Not logged in - get tickets or sign in */
              <>
                {isUpcoming && event.status !== 'CANCELLED' && (
                  <Link href={`/events/${slug}/tickets`} className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto" leftIcon={<Ticket className="w-5 h-5" />}>
                      Get Tickets - €{event.ticketPrice}
                    </Button>
                  </Link>
                )}
                <Link href={`/auth/login?redirect=/events/${slug}/my-dashboard`} className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Already have a ticket? Sign In
                  </Button>
                </Link>
              </>
            )}
            <Button variant="ghost" size="lg" className="w-full sm:w-auto" leftIcon={<Share2 className="w-5 h-5" />}>
              Share Event
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-8">
            {/* About Section */}
            {event.description && (
              <Card>
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">About This Event</h2>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{event.description}</p>
              </Card>
            )}

            {/* How It Works */}
            <Card>
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">How Race Night Works</h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">1. Get Your Ticket</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Purchase your ticket for €{event.ticketPrice} and receive {(event.ticketPrice * 1000).toLocaleString()} betting credits.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">2. Create Your Horse</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Name your horse and give it a hilarious backstory. Our AI commentator will bring it to life!
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">3. Place Your Bets</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Use your credits to bet on races throughout the night. Back your favourites!
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">4. Win Prizes!</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Top 3 players with the most credits win prizes! Plus spot prizes throughout.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* What's Included */}
            <Card>
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">What's Included</h2>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-center gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-racing-green rounded-full flex items-center justify-center flex-shrink-0">
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <span className="text-sm sm:text-base">{(event.ticketPrice * 1000).toLocaleString()} betting credits</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-racing-green rounded-full flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span>{event.numberOfRaces} exciting races with AI commentary</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-racing-green rounded-full flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span>Create and name your own horse</span>
                </li>
                {event.welcomeDrinkIncluded && (
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                      <Gift className="w-4 h-4 text-night" />
                    </div>
                    <span className="text-gold font-medium">Welcome drink included!</span>
                  </li>
                )}
              </ul>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Submit Horse Card - For logged in users */}
            {isAuthenticated && canSubmitHorse && (
              <Card className="bg-gradient-to-br from-racing-green/20 to-night border-gold/30">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-gold" />
                  <h3 className="font-bold">Submit Your Horse</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Create your horse and give it a hilarious backstory for the AI commentator!
                </p>
                <Link href={`/events/${slug}/horses/submit`} className="block">
                  <Button className="w-full">
                    Create Horse
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Deadline: {horseDeadline.toLocaleDateString('en-IE', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </Card>
            )}

            {/* Event Details */}
            <Card>
              <h3 className="font-bold mb-4">Event Details</h3>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-gray-500">Date & Time</dt>
                  <dd className="font-medium">
                    {eventDate.toLocaleDateString('en-IE', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })} at {eventDate.toLocaleTimeString('en-IE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Venue</dt>
                  <dd className="font-medium">{event.venue}</dd>
                  {event.address && (
                    <dd className="text-gray-400 text-xs mt-1">{event.address}</dd>
                  )}
                </div>
                <div>
                  <dt className="text-gray-500">Organised by</dt>
                  <dd className="font-medium">{event.club?.name || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Number of Races</dt>
                  <dd className="font-medium">{event.numberOfRaces} races</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-night-light border-t border-night-lighter py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Powered by <span className="text-gold font-semibold">MyRaceNight</span></p>
          <p className="mt-1">Making fundraising unforgettable 🏇</p>
        </div>
      </footer>
    </div>
  );
}
