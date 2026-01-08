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
  selectEvent: (eventId: string) => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

const SELECTED_EVENT_KEY = 'myracenight_selected_event_id';

export function EventProvider({ children }: { children: ReactNode }) {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCurrentEvent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if there's a selected event in localStorage
      const selectedEventId = typeof window !== 'undefined' 
        ? localStorage.getItem(SELECTED_EVENT_KEY) 
        : null;
      
      // Get all events the user is organising
      const events = await api.getEvents();
      
      // If there's a selected event ID, try to use it
      if (selectedEventId) {
        const selectedEvent = events.find(e => e.id === selectedEventId);
        if (selectedEvent) {
          const fullEvent = await api.getEvent(selectedEvent.id);
          setCurrentEvent(fullEvent);
          return;
        } else {
          // Selected event no longer exists or user doesn't own it - clear selection
          localStorage.removeItem(SELECTED_EVENT_KEY);
        }
      }
      
      // Fallback: Priority LIVE > PUBLISHED > DRAFT
      const liveEvent = events.find(e => e.status === 'LIVE');
      const publishedEvent = events.find(e => e.status === 'PUBLISHED');
      const draftEvent = events.find(e => e.status === 'DRAFT');
      
      const activeEvent = liveEvent || publishedEvent || draftEvent || null;
      
      if (activeEvent) {
        const fullEvent = await api.getEvent(activeEvent.id);
        setCurrentEvent(fullEvent);
        // Store selection
        localStorage.setItem(SELECTED_EVENT_KEY, activeEvent.id);
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

  // Select a specific event by ID
  const selectEvent = async (eventId: string) => {
    try {
      setIsLoading(true);
      const fullEvent = await api.getEvent(eventId);
      setCurrentEvent(fullEvent);
      // Store selection in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(SELECTED_EVENT_KEY, eventId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EventContext.Provider value={{
      currentEvent,
      isLoading,
      error,
      refreshEvent,
      setCurrentEvent,
      selectEvent,
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
