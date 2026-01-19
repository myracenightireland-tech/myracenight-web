'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Ticket, Calendar, MapPin, Trophy, Coins, Plus, ChevronRight, Lock, Clock, Play, CheckCircle, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, Button, Spinner, Badge } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Event, Race, Horse, Ticket as TicketType, Bet } from '@/types';
import BettingModal from '@/components/BettingModal';

export default function PlayerEventPage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [myHorses, setMyHorses] = useState<Horse[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [showBettingModal, setShowBettingModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    loadEventData();
  }, [eventId, isAuthenticated, router]);

  const loadEventData = async () => {
    try {
      const eventData = await api.getEvent(eventId);
      setEvent(eventData);

      const tickets = await api.getMyTickets();
      const myTicket = tickets.find((t: TicketType) => t.eventId === eventId);
      if (!myTicket) { setError('You do not have a ticket for this event'); setIsLoading(false); return; }
      setTicket(myTicket);

      try { const racesData = await api.getEventRaces(eventId); setRaces(racesData); } catch (err) { console.log('Races not available yet'); }
      try {
        const horsesData = await api.getEventHorses(eventId);
        setHorses(horsesData);
        setMyHorses(horsesData.filter((h: Horse) => h.userId === user?.id));
      } catch (err) { console.log('Horses not available yet'); }
      try { const creditsData = await api.getMyBalance(eventId); setCredits(creditsData.balance || myTicket.startingCredits || 0); } catch (err) { setCredits(myTicket.startingCredits || 0); }
      try { const betsData = await api.getMyBets(eventId); setMyBets(betsData); } catch (err) { console.log('No bets yet'); }
    } catch (err: any) { setError(err.message || 'Failed to load event'); }
    finally { setIsLoading(false); }
  };

  const handleBetPlaced = () => { setShowBettingModal(false); loadEventData(); };

  const getRaceStatusBadge = (race: Race) => {
    switch (race.status) {
      case 'BETTING_OPEN': return <Badge className="bg-green-500">Betting Open</Badge>;
      case 'BETTING_CLOSED': return <Badge className="bg-yellow-500">Betting Closed</Badge>;
      case 'IN_PROGRESS': return <Badge className="bg-red-500">Racing!</Badge>;
      case 'COMPLETED': return <Badge className="bg-gray-500">Completed</Badge>;
      case 'READY_TO_RACE': return <Badge className="bg-blue-500">Ready</Badge>;
      default: return <Badge className="bg-gray-600">Upcoming</Badge>;
    }
  };

  const canBetOnRace = (race: Race) => race.status === 'BETTING_OPEN';

  if (isLoading) return <div className="min-h-screen bg-racing-black flex items-center justify-center"><Spinner size="lg" /></div>;

  if (error || !event || !ticket) {
    return (
      <div className="min-h-screen bg-racing-black flex items-center justify-center">
        <Card className="max-w-md text-center"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">Access Denied</h2><p className="text-gray-400 mb-4">{error || 'You need a ticket to view this event.'}</p><Link href="/dashboard/player"><Button>Back to Dashboard</Button></Link></Card>
      </div>
    );
  }

  const canSubmitHorses = new Date(event.horseDeadline) > new Date();
  // Show races if racecard is published, event is live, OR test mode is active, OR any race has betting open
  const hasActiveBetting = races.some(r => r.status === 'BETTING_OPEN' || r.status === 'BETTING_CLOSED' || r.status === 'IN_PROGRESS' || r.status === 'COMPLETED');
  const racecardPublished = event.status === 'RACECARD_PUBLISHED' || event.status === 'LIVE' || event.isTestMode || hasActiveBetting;

  return (
    <div className="min-h-screen bg-racing-black">
      <div className="bg-racing-black/80 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard/player" className="flex items-center gap-2 text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" />My Events</Link>
          <button onClick={loadEventData} className="flex items-center gap-2 text-gray-400 hover:text-white"><RefreshCw className="w-5 h-5" />Refresh</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{event.name}</h1>
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{new Date(event.eventDate).toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' })}</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{event.venue}</span></div>
              </div>
            </div>
            {event.status === 'LIVE' && <Badge className="bg-red-500 text-lg px-4 py-2">LIVE</Badge>}
          </div>

          <Card className="bg-gradient-to-r from-gold/20 to-gold/5 border-gold/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gold/20 rounded-full flex items-center justify-center"><Coins className="w-7 h-7 text-gold" /></div>
                <div><p className="text-gray-400 text-sm">Your Credits</p><p className="text-3xl font-bold text-gold">{credits.toLocaleString()}</p></div>
              </div>
              <div className="text-right"><p className="text-gray-400 text-sm">Ticket Status</p><p className="text-green-400 font-semibold capitalize">{ticket.status?.toLowerCase()}</p></div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {canSubmitHorses ? (
            <Link href={`/events/${event.slug}/horses/submit`}>
              <Card className="hover:border-gold/50 transition-all cursor-pointer h-full">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center"><Plus className="w-6 h-6 text-gold" /></div>
                  <div><h3 className="text-white font-semibold">Submit a Horse</h3><p className="text-gray-400 text-sm">Deadline: {new Date(event.horseDeadline).toLocaleDateString()}</p></div>
                </div>
              </Card>
            </Link>
          ) : (
            <Card className="opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center"><Lock className="w-6 h-6 text-gray-500" /></div>
                <div><h3 className="text-gray-400 font-semibold">Horse Submission Closed</h3><p className="text-gray-500 text-sm">Deadline has passed</p></div>
              </div>
            </Card>
          )}
          <Card className="hover:border-gold/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center"><Trophy className="w-6 h-6 text-blue-400" /></div>
              <div><h3 className="text-white font-semibold">{event.numberOfRaces} Races</h3><p className="text-gray-400 text-sm">{racecardPublished ? 'Racecard available' : 'Coming soon'}</p></div>
            </div>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold" />My Horses ({myHorses.length})</h2>
          {myHorses.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-400 mb-4">You haven't submitted any horses yet</p>
              {canSubmitHorses && <Link href={`/events/${event.slug}/horses/submit`}><Button><Plus className="w-5 h-5 mr-2" />Submit Your First Horse</Button></Link>}
            </Card>
          ) : (
            <div className="space-y-3">
              {myHorses.map((horse) => (
                <Card key={horse.id} className="flex items-center justify-between">
                  <div><h3 className="text-white font-semibold">{horse.name || horse.horseName}</h3><p className="text-gray-400 text-sm">{horse.raceNumber ? `Race ${horse.raceNumber}` : 'Race TBD'} • {horse.ownerName}</p></div>
                  <Badge className={horse.approvalStatus === 'APPROVED' ? 'bg-green-500' : horse.approvalStatus === 'PENDING' ? 'bg-yellow-500' : horse.approvalStatus === 'FLAGGED' ? 'bg-orange-500' : 'bg-red-500'}>{horse.approvalStatus}</Badge>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-gold" />Races</h2>
          {!racecardPublished ? (
            <Card className="text-center py-8"><Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" /><h3 className="text-lg font-semibold text-white mb-2">Racecard Coming Soon</h3><p className="text-gray-400">The host is preparing the racecard. Check back soon!</p></Card>
          ) : races.length === 0 ? (
            <Card className="text-center py-8"><p className="text-gray-400">No races available yet</p></Card>
          ) : (
            <div className="space-y-4">
              {races.map((race) => {
                const raceHorses = horses.filter(h => h.raceId === race.id || h.raceNumber === race.raceNumber);
                const myBetOnRace = myBets.find(b => b.raceId === race.id);
                return (
                  <Card key={race.id} className={canBetOnRace(race) ? 'border-green-500/30' : ''}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1"><h3 className="text-lg font-semibold text-white">Race {race.raceNumber}: {race.name || `Race ${race.raceNumber}`}</h3>{getRaceStatusBadge(race)}</div>
                        {race.sponsorName && <p className="text-gray-400 text-sm">Sponsored by {race.sponsorName}</p>}
                      </div>
                      {canBetOnRace(race) && !myBetOnRace && <Button onClick={() => { setSelectedRace(race); setShowBettingModal(true); }} className="bg-green-500 hover:bg-green-600">Place Bet</Button>}
                      {myBetOnRace && <div className="text-right"><p className="text-sm text-gray-400">Your Bet</p><p className="text-gold font-bold">{myBetOnRace.amount} credits</p></div>}
                    </div>
                    {raceHorses.length > 0 && (
                      <div className="border-t border-gray-700 pt-4">
                        <p className="text-sm text-gray-400 mb-3">{raceHorses.length} Horses</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {raceHorses.map((horse, idx) => (
                            <div key={horse.id} className={`p-2 rounded-lg ${horse.userId === user?.id ? 'bg-gold/10 border border-gold/30' : 'bg-gray-800/50'}`}>
                              <div className="flex items-center gap-2"><span className="text-gray-500 text-sm">{idx + 1}.</span><span className="text-white text-sm font-medium truncate">{horse.name || horse.horseName}</span></div>
                              {horse.odds && <p className="text-gold text-xs ml-4">{horse.odds}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {race.status === 'COMPLETED' && race.winningPosition && (
                      <div className="border-t border-gray-700 pt-4 mt-4">
                        <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-gold" /><span className="text-white font-semibold">Winner: Position {race.winningPosition}</span></div>
                        {myBetOnRace && <div className={`mt-2 p-2 rounded-lg ${myBetOnRace.status === 'WON' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>{myBetOnRace.status === 'WON' ? <p className="text-green-400">🎉 You won {myBetOnRace.potentialWinnings} credits!</p> : <p className="text-red-400">Better luck next time!</p>}</div>}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {myBets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Ticket className="w-5 h-5 text-gold" />My Bets ({myBets.length})</h2>
            <Card>
              <div className="space-y-3">
                {myBets.map((bet) => (
                  <div key={bet.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <div><p className="text-white">Race {races.find(r => r.id === bet.raceId)?.raceNumber || '?'}</p><p className="text-gray-400 text-sm">{horses.find(h => h.id === bet.horseId)?.name || 'Horse'} @ {bet.odds}</p></div>
                    <div className="text-right"><p className="text-gold font-bold">{bet.amount} credits</p><Badge className={bet.status === 'WON' ? 'bg-green-500' : bet.status === 'LOST' ? 'bg-red-500' : bet.status === 'PENDING' ? 'bg-yellow-500' : 'bg-gray-500'}>{bet.status}</Badge></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {showBettingModal && selectedRace && (
        <BettingModal isOpen={showBettingModal} race={selectedRace} eventId={eventId} horses={horses.filter(h => h.raceId === selectedRace.id || h.raceNumber === selectedRace.raceNumber)} balance={credits} onClose={() => setShowBettingModal(false)} onBetPlaced={handleBetPlaced} />
      )}
    </div>
  );
}
