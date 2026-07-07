'use client';

/**
 * Legacy attendee dashboard route.
 *
 * The attendee event dashboard was consolidated onto
 * /dashboard/player/events/[id] (live wallet, leaderboard and bet slip with
 * realtime push) — previously this route rendered a second, REST-only
 * dashboard that disagreed with the one the share-event link led to. This
 * page now only resolves the slug to the event id and forwards, so old links
 * and bookmarks keep working.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Card, Button, Spinner } from '@/components/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

export default function AttendeeDashboardRedirect() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const redirect = async () => {
      try {
        const response = await fetch(`${API_URL}/api/events/by-slug/${slug}`);
        if (!response.ok) throw new Error('Event not found');
        const event = await response.json();
        if (!cancelled) router.replace(`/dashboard/player/events/${event.id}`);
      } catch (err) {
        if (!cancelled) setError('We could not find that event.');
      }
    };

    redirect();
    return () => {
      cancelled = true;
    };
  }, [slug, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-racing-black flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Event not found</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Link href="/dashboard/my-events">
            <Button>Back to My Events</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-racing-black flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
