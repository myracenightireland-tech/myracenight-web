'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCurrentEvent } from '@/lib/eventContext';
import { Spinner } from '@/components/ui';

/**
 * This page handles selecting a specific event for management
 * When user clicks "Manage" on an event from the dashboard,
 * this selects that event and redirects to the event details page
 */
export default function ManageEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const { selectEvent, isLoading } = useCurrentEvent();

  useEffect(() => {
    const handleSelect = async () => {
      if (eventId) {
        // Store the selected event ID and select it
        localStorage.setItem('myracenight_selected_event_id', eventId);
        await selectEvent(eventId);
        // Redirect to the overview page
        router.replace('/dashboard/overview');
      }
    };

    handleSelect();
  }, [eventId, selectEvent, router]);

  return (
    <div className="min-h-screen bg-night flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-400">Loading event...</p>
      </div>
    </div>
  );
}
