'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';
import { Event } from '@/types';

interface EventContextType {
  currentEvent: Event | null;
  isLoading: boolean;
  error: string | null;
  refreshEvent: () => Promise<void>;
  setCurrentEvent: (event: Event | null) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCurrentEvent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get all events and find the most recent non-completed one
      const events = await api.getEvents();
      
      // Priority: LIVE > PUBLISHED > DRAFT
      const liveEvent = events.find(e => e.status === 'LIVE');
      const publishedEvent = events.find(e => e.status === 'PUBLISHED');
      const draftEvent = events.find(e => e.status === 'DRAFT');
      
      const activeEvent = liveEvent || publishedEvent || draftEvent || null;
      
      if (activeEvent) {
        // Get full event details
        const fullEvent = await api.getEvent(activeEvent.id);
        setCurrentEvent(fullEvent);
      } else {
        setCurrentEvent(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
      setCurrentEvent(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentEvent();
  }, []);

  const refreshEvent = async () => {
    if (currentEvent) {
      try {
        const updated = await api.getEvent(currentEvent.id);
        setCurrentEvent(updated);
      } catch (err) {
        await loadCurrentEvent();
      }
    } else {
      await loadCurrentEvent();
    }
  };

  return (
    <EventContext.Provider value={{
      currentEvent,
      isLoading,
      error,
      refreshEvent,
      setCurrentEvent,
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useCurrentEvent() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useCurrentEvent must be used within an EventProvider');
  }
  return context;
}
