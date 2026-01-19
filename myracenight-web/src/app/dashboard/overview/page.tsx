'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import {
  Calendar, MapPin, Users, Flag, Clock, Globe, 
  CheckCircle, AlertCircle, ExternalLink, Copy, Play,
  Ticket, TrendingUp, Settings, ChevronRight,
  UserCheck, FileEdit, Sparkles, Trophy
} from 'lucide-react';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useCurrentEvent } from '@/lib/eventContext';

export default function OverviewPage() {
  const { currentEvent, isLoading, refreshEvent } = useCurrentEvent();
  const [copied, setCopied] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);
  const [horseCount, setHorseCount] = useState(0);
  const [raceCount, setRaceCount] = useState(0);
  const [commentaryReady, setCommentaryReady] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      if (!currentEvent?.id) return;
      
      try {
        // Load tickets
        const tickets = await api.getEventTickets(currentEvent.id);
        setTicketCount(tickets?.length || 0);
        
        // Load horses
        const horses = await api.getEventHorses(currentEvent.id);
        setHorseCount(horses?.length || 0);
        
        // Load races
        const races = await api.getEventRaces(currentEvent.id);
        setRaceCount(races?.length || 0);
        
        // Check commentary status
        let readyCount = 0;
        for (const race of races) {
          try {
            const status = await api.getCommentaryStatus(race.id);
            if (status?.hasCommentary) readyCount++;
          } catch (e) {}
        }
        setCommentaryReady(readyCount);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };

    loadStats();
  }, [currentEvent?.id]);

  const copyLink = () => {
    if (!currentEvent) return;
    const url = `${window.location.origin}/events/${currentEvent.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    if (!currentEvent) return null;
    const statusConfig: Record<string, { color: string; label: string }> = {
      DRAFT: { color: 'bg-gray-500', label: 'Draft' },
      PUBLISHED: { color: 'bg-blue-500', label: 'Published' },
      RACECARD_PUBLISHED: { color: 'bg-purple-500', label: 'Race Card Published' },
      LIVE: { color: 'bg-red-500 animate-pulse', label: '🔴 LIVE' },
      COMPLETED: { color: 'bg-green-500', label: 'Completed' },
      CANCELLED: { color: 'bg-gray-600', label: 'Cancelled' },
    };
    const config = statusConfig[currentEvent.status] || statusConfig.DRAFT;
    return (
      <span className={`${config.color} px-3 py-1 rounded-full text-sm font-semibold`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="p-8">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No Event Selected</h2>
          <p className="text-gray-400 mb-6">Create or select an event to get started</p>
          <Link href="/dashboard/events/new">
            <Button>Create New Event</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const eventDate = new Date(currentEvent.eventDate);
  const daysUntil = differenceInDays(eventDate, new Date());
  const isPast = daysUntil < 0;
  const isToday = daysUntil === 0;

  // Calculate progress
  const horsesNeeded = (currentEvent.numberOfRaces || 6) * (currentEvent.horsesPerRace || 8);
  const horseProgress = Math.min(100, Math.round((horseCount / horsesNeeded) * 100));
  const attendeeProgress = Math.min(100, Math.round((ticketCount / (currentEvent.maxAttendees || 100)) * 100));
  const commentaryProgress = raceCount > 0 ? Math.round((commentaryReady / raceCount) * 100) : 0;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">{currentEvent.name}</h1>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(eventDate, 'EEEE, d MMMM yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {format(eventDate, 'h:mm a')}
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
            <MapPin className="w-4 h-4" />
            {currentEvent.venue}
          </div>
        </div>

        <div className="flex gap-3">
          {currentEvent.status !== 'DRAFT' && (
            <Button
              variant="secondary"
              onClick={copyLink}
              leftIcon={copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          )}
          <Link href="/dashboard/event">
            <Button variant="secondary" leftIcon={<Settings className="w-4 h-4" />}>
              Edit Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Countdown Banner */}
      {!isPast && currentEvent.status !== 'COMPLETED' && (
        <Card className={`${isToday ? 'bg-red-500/20 border-red-500/50' : 'bg-gold/10 border-gold/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isToday ? 'text-red-300' : 'text-gold'}`}>
                {isToday ? '🔥 Event is TODAY!' : 'Time until event'}
              </p>
              <p className="text-2xl font-bold">
                {isToday ? 'Starting soon!' : `${daysUntil} days to go`}
              </p>
            </div>
            {currentEvent.status === 'PUBLISHED' && (
              <Link href="/dashboard/host">
                <Button leftIcon={<Play className="w-4 h-4" />}>
                  Go Live
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Main Stats - ATTENDEES PROMINENT */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Attendees - LARGE AND PROMINENT */}
        <Card className="col-span-2 md:col-span-1 bg-racing-green/20 border-racing-green/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-racing-green/30 rounded-lg">
              <Users className="w-6 h-6 text-racing-green-light" />
            </div>
            <span className="text-gray-400 text-sm">Attendees</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-racing-green-light">{ticketCount}</span>
            <span className="text-gray-500">/ {currentEvent.maxAttendees}</span>
          </div>
          <div className="mt-2 h-2 bg-night-lighter rounded-full overflow-hidden">
            <div 
              className="h-full bg-racing-green transition-all duration-500"
              style={{ width: `${attendeeProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{attendeeProgress}% capacity</p>
        </Card>

        {/* Tickets Sold */}
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gold/20 rounded-lg">
              <Ticket className="w-5 h-5 text-gold" />
            </div>
            <span className="text-gray-400 text-sm">Tickets Sold</span>
          </div>
          <p className="text-3xl font-bold">{ticketCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            €{(ticketCount * (currentEvent.ticketPrice || 0)).toLocaleString()} revenue
          </p>
        </Card>

        {/* Horses */}
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <span className="text-lg">🐎</span>
            </div>
            <span className="text-gray-400 text-sm">Horses</span>
          </div>
          <p className="text-3xl font-bold">{horseCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {horsesNeeded - horseCount > 0 ? `${horsesNeeded - horseCount} more needed` : 'All filled!'}
          </p>
        </Card>

        {/* Races */}
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Flag className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-gray-400 text-sm">Races</span>
          </div>
          <p className="text-3xl font-bold">{raceCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {commentaryReady}/{raceCount} commentary ready
          </p>
        </Card>
      </div>

      {/* Progress & Checklist */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Setup Progress */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold" />
            Event Setup Progress
          </h2>
          
          <div className="space-y-4">
            {/* Event Details */}
            <div className="flex items-center justify-between p-3 bg-night-lighter rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentEvent.name ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {currentEvent.name ? <CheckCircle className="w-4 h-4" /> : <FileEdit className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-medium">Event Details</p>
                  <p className="text-xs text-gray-500">Name, date, venue</p>
                </div>
              </div>
              <Link href="/dashboard/event">
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </Link>
            </div>

            {/* Races Setup */}
            <div className="flex items-center justify-between p-3 bg-night-lighter rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${raceCount > 0 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {raceCount > 0 ? <CheckCircle className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-medium">Races & Sponsors</p>
                  <p className="text-xs text-gray-500">{raceCount} races configured</p>
                </div>
              </div>
              <Link href="/dashboard/races">
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </Link>
            </div>

            {/* Horses */}
            <div className="flex items-center justify-between p-3 bg-night-lighter rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${horseProgress >= 100 ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  {horseProgress >= 100 ? <CheckCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-medium">Horse Submissions</p>
                  <p className="text-xs text-gray-500">{horseCount}/{horsesNeeded} horses ({horseProgress}%)</p>
                </div>
              </div>
              <Link href="/dashboard/horses">
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </Link>
            </div>

            {/* Commentary */}
            <div className="flex items-center justify-between p-3 bg-night-lighter rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${commentaryProgress >= 100 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {commentaryProgress >= 100 ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm">🎙️</span>}
                </div>
                <div>
                  <p className="font-medium">AI Commentary</p>
                  <p className="text-xs text-gray-500">{commentaryReady}/{raceCount} races ready</p>
                </div>
              </div>
              <Link href="/dashboard/races">
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Quick Actions & Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/horses">
                <Button variant="secondary" className="w-full" leftIcon={<Sparkles className="w-4 h-4" />}>
                  Review Horses
                </Button>
              </Link>
              <Link href="/dashboard/races">
                <Button variant="secondary" className="w-full" leftIcon={<Flag className="w-4 h-4" />}>
                  Manage Races
                </Button>
              </Link>
              <Link href="/dashboard/leaderboard">
                <Button variant="secondary" className="w-full" leftIcon={<Trophy className="w-4 h-4" />}>
                  Leaderboard
                </Button>
              </Link>
              <Link href={`/events/${currentEvent.slug}`} target="_blank">
                <Button variant="secondary" className="w-full" leftIcon={<ExternalLink className="w-4 h-4" />}>
                  View Public Page
                </Button>
              </Link>
            </div>
          </Card>

          {/* Event Info Summary */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Event Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Ticket Price</span>
                <span className="font-medium">€{currentEvent.ticketPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Number of Races</span>
                <span className="font-medium">{currentEvent.numberOfRaces}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Horses per Race</span>
                <span className="font-medium">{currentEvent.horsesPerRace}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Horse Deadline</span>
                <span className="font-medium">
                  {currentEvent.horseDeadline 
                    ? format(new Date(currentEvent.horseDeadline), 'd MMM, h:mm a')
                    : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Welcome Drink</span>
                <span className="font-medium">
                  {currentEvent.welcomeDrinkIncluded ? '✅ Included' : '❌ Not included'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
