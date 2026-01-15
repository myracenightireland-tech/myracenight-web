'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  Users,
  Trophy,
  Plus,
  ArrowRight,
  Clock,
  Ticket,
  Flag,
  CheckCircle,
  AlertCircle,
  Play,
  FileEdit,
  Gamepad2,
  Eye,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, StatCard, Badge, Button, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useCurrentEvent } from '@/lib/eventContext';
import { api } from '@/lib/api';
import { Race, Horse as HorseType } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { currentEvent, isLoading, refreshEvent } = useCurrentEvent();
  const [races, setRaces] = useState<Race[]>([]);
  const [horses, setHorses] = useState<HorseType[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Redirect players to player dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === 'PLAYER') {
      router.push('/dashboard/player');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    const loadEventDetails = async () => {
      if (currentEvent) {
        setLoadingDetails(true);
        try {
          const [racesData, horsesData] = await Promise.all([
            api.getEventRaces(currentEvent.id),
            api.getEventHorses(currentEvent.id),
          ]);
          setRaces(racesData);
          setHorses(horsesData);
        } catch (err) {
          console.log('No races or horses yet');
        } finally {
          setLoadingDetails(false);
        }
      }
    };
    loadEventDetails();
  }, [currentEvent]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // No event - show create prompt
  if (!currentEvent) {
    return (
      <div className="min-h-screen">
        <Header
          title={`Welcome, ${user?.firstName}! 👋`}
          subtitle="Let's set up your first race night"
        />
        <div className="p-8">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-racing-green/20 to-racing-green/5 border-racing-green-light/20">
            <div className="text-center py-8">
              <div className="text-6xl mb-6">🏇</div>
              <h2 className="text-2xl font-display font-bold mb-3">
                Ready to host your race night?
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Create your event in minutes. Set up races, add sponsors, and share with your community.
              </p>
              <Link href="/dashboard/events/new">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Create Your Event
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate stats
  const ticketCount = currentEvent.tickets?.length || 0;
  const ticketRevenue = ticketCount * (currentEvent.ticketPrice || 0);
  const pendingHorses = horses.filter(h => h.approvalStatus === 'PENDING').length;
  const approvedHorses = horses.filter(h => h.approvalStatus === 'APPROVED').length;
  const assignedHorses = horses.filter(h => h.raceId).length;
  const racesWithSponsors = races.filter(r => r.sponsorName).length;
  
  // Fix time until event calculation
  const eventDate = new Date(currentEvent.eventDate);
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const isEventPast = diffMs < 0;
  const isToday = diffDays === 0 && diffMs > 0;
  
  // Format time until event
  const getTimeUntilEvent = () => {
    if (isEventPast) return { value: 'Past', subtitle: 'Event has ended' };
    if (isToday) {
      if (diffHours <= 0) return { value: 'Now!', subtitle: 'Starting soon' };
      return { value: `${diffHours}h`, subtitle: 'hours to go' };
    }
    if (diffDays === 1) return { value: '1', subtitle: 'day to go' };
    return { value: `${diffDays}`, subtitle: 'days to go' };
  };
  const timeUntilEvent = getTimeUntilEvent();

  // Determine workflow stage and next action
  const getWorkflowStatus = () => {
    if (currentEvent.status === 'COMPLETED') {
      return { stage: 'completed', message: 'Event completed!', action: null };
    }
    if (currentEvent.status === 'LIVE') {
      return { 
        stage: 'live', 
        message: 'Event is LIVE!', 
        action: { label: 'Go to Host Mode', href: '/dashboard/host', icon: Gamepad2 }
      };
    }
    if (currentEvent.status === 'DRAFT') {
      if (races.length === 0) {
        return { 
          stage: 'setup', 
          message: 'Generate races for your event', 
          action: { label: 'Set Up Races', href: '/dashboard/races', icon: Flag }
        };
      }
      return { 
        stage: 'setup', 
        message: 'Configure races and sponsors, then publish', 
        action: { label: 'Configure Races', href: '/dashboard/races', icon: Flag }
      };
    }
    if (currentEvent.status === 'PUBLISHED') {
      if (pendingHorses > 0) {
        return { 
          stage: 'manage', 
          message: `${pendingHorses} horses waiting for review`, 
          action: { label: 'Review Horses', href: '/dashboard/horses', icon: Trophy }
        };
      }
      if (approvedHorses > assignedHorses) {
        return { 
          stage: 'manage', 
          message: `${approvedHorses - assignedHorses} horses need to be assigned to races`, 
          action: { label: 'Assign Horses', href: '/dashboard/horses', icon: Trophy }
        };
      }
      if (isToday || isEventPast) {
        return { 
          stage: 'ready', 
          message: 'Ready to go live!', 
          action: { label: 'Enter Host Mode', href: '/dashboard/host', icon: Play }
        };
      }
      return { 
        stage: 'collecting', 
        message: `Collecting entries • ${diffDays} day${diffDays !== 1 ? 's' : ''} until event`, 
        action: { label: 'View Public Page', href: `/events/${currentEvent.slug}`, icon: Eye, external: true }
      };
    }
    return { stage: 'unknown', message: 'Unknown status', action: null };
  };

  const workflow = getWorkflowStatus();

  const getStatusBadge = () => {
    switch (currentEvent.status) {
      case 'DRAFT':
        return <Badge variant="default">Draft</Badge>;
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>;
      case 'LIVE':
        return <Badge variant="live">🔴 Live</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      default:
        return <Badge variant="default">{currentEvent.status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Overview"
        subtitle={currentEvent.name}
      />

      <div className="p-8">
        {/* Event Status Banner */}
        <Card className="mb-8 bg-gradient-to-r from-night-light to-night border-gold/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center text-3xl">
                🏇
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold">{currentEvent.name}</h2>
                  {getStatusBadge()}
                </div>
                <p className="text-gray-400">
                  {format(new Date(currentEvent.eventDate), 'EEEE, MMMM d, yyyy • h:mm a')}
                </p>
                <p className="text-sm text-gray-500">{currentEvent.venue}</p>
              </div>
            </div>
            <Link href="/dashboard/event">
              <Button variant="secondary" leftIcon={<FileEdit className="w-4 h-4" />}>
                Edit Event
              </Button>
            </Link>
          </div>
        </Card>

        {/* What's Next Card */}
        <Card className="mb-8 border-gold/30 bg-gold/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {workflow.stage === 'live' ? (
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-4 h-4 bg-red-500 rounded-full" />
                </div>
              ) : workflow.stage === 'completed' ? (
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              ) : pendingHorses > 0 ? (
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-gold" />
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wide">What's Next</p>
                <p className="text-lg font-semibold">{workflow.message}</p>
              </div>
            </div>
            {workflow.action && (
              <Link href={workflow.action.href} target={workflow.action.external ? '_blank' : undefined}>
                <Button leftIcon={<workflow.action.icon className="w-5 h-5" />}>
                  {workflow.action.label}
                </Button>
              </Link>
            )}
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tickets Sold"
            value={ticketCount}
            subtitle={`€${ticketRevenue.toLocaleString()} revenue`}
            icon={<Ticket className="w-6 h-6" />}
          />
          <StatCard
            title="Horses Submitted"
            value={horses.length}
            subtitle={pendingHorses > 0 ? `${pendingHorses} pending review` : 'All reviewed'}
            icon={<Trophy className="w-6 h-6" />}
          />
          <StatCard
            title="Races"
            value={races.length}
            subtitle={`${racesWithSponsors} sponsored`}
            icon={<Flag className="w-6 h-6" />}
          />
          <StatCard
            title="Time Until Event"
            value={timeUntilEvent.value}
            subtitle={timeUntilEvent.subtitle}
            icon={<Clock className="w-6 h-6" />}
          />
        </div>

        {/* Workflow Progress */}
        <Card className="mb-8">
          <h3 className="text-lg font-semibold mb-6">Event Progress</h3>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-night-lighter" />
            
            <div className="relative flex justify-between">
              {[
                { name: 'Create Event', done: true },
                { name: 'Publish & Share', done: currentEvent.status !== 'DRAFT' },
                { name: 'Publish Racecard', done: currentEvent.status === 'RACECARD_PUBLISHED' || currentEvent.status === 'LIVE' || currentEvent.status === 'COMPLETED' },
                { name: 'Go Live', done: currentEvent.status === 'LIVE' || currentEvent.status === 'COMPLETED' },
                { name: 'Complete', done: currentEvent.status === 'COMPLETED' },
              ].map((step, index) => (
                <div key={step.name} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                    step.done 
                      ? 'bg-green-500 text-white' 
                      : 'bg-night-lighter text-gray-500'
                  }`}>
                    {step.done ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <span className="font-bold">{index + 1}</span>
                    )}
                  </div>
                  <span className={`mt-2 text-sm text-center max-w-[80px] ${step.done ? 'text-white' : 'text-gray-500'}`}>
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/races">
            <Card hover className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                  <Flag className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold">Races & Sponsors</h3>
                  <p className="text-sm text-gray-500">
                    {races.length} races • {racesWithSponsors} sponsored
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/horses">
            <Card hover className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-racing-green/10 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-racing-green-light" />
                </div>
                <div>
                  <h3 className="font-semibold">Horses</h3>
                  <p className="text-sm text-gray-500">
                    {approvedHorses} approved • {pendingHorses} pending
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/events/${currentEvent.slug}`} target="_blank">
            <Card hover className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-track/20 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-track-light" />
                </div>
                <div>
                  <h3 className="font-semibold">Public Page</h3>
                  <p className="text-sm text-gray-500">
                    View as attendee
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
