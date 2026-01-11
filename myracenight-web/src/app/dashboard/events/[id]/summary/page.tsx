'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Trophy, Medal, Users, Flag, 
  TrendingUp, Target, Award, Crown
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Badge, Spinner } from '@/components/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

interface EventSummary {
  event: {
    id: string;
    name: string;
    status: string;
    date: string;
    venue: string;
    club: string;
  };
  statistics: {
    totalRaces: number;
    completedRaces: number;
    totalParticipants: number;
    totalBetsPlaced: number;
    totalCreditsWagered: number;
    winningBets: number;
    userHorsesWon: number;
  };
  raceResults: Array<{
    raceNumber: number;
    raceName: string;
    status: string;
    podium: {
      first: { horseName: string; ownerName: string; isUserSubmitted: boolean; submittedBy: string | null } | null;
      second: { horseName: string; ownerName: string; isUserSubmitted: boolean; submittedBy: string | null } | null;
      third: { horseName: string; ownerName: string; isUserSubmitted: boolean; submittedBy: string | null } | null;
    };
  }>;
  topPunters: Array<{
    rank: number;
    userId: string;
    name: string;
    finalBalance: number;
    winningBets: number;
    totalBets: number;
    winRate: number;
  }>;
  topPunter: {
    rank: number;
    userId: string;
    name: string;
    finalBalance: number;
  } | null;
}

export default function EventSummaryPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/api/events/${eventId}/summary`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!response.ok) {
          throw new Error('Failed to load event summary');
        }
        
        const data = await response.json();
        setSummary(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load summary');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSummary();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-8">
          <p className="text-red-400 mb-4">{error || 'Summary not available'}</p>
          <Link href={`/dashboard/events/${eventId}`}>
            <span className="text-gold hover:underline">Back to Event</span>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Event Summary"
        subtitle={summary.event.name}
      />

      <div className="p-8">
        {/* Back Button */}
        <Link 
          href={`/dashboard/events/${eventId}`} 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>

        {/* Top Punter Spotlight */}
        {summary.topPunter && (
          <Card className="bg-gradient-to-br from-gold/20 to-transparent border-gold/50 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gold/30 rounded-full flex items-center justify-center">
                <Crown className="w-10 h-10 text-gold" />
              </div>
              <div>
                <p className="text-sm text-gold font-semibold mb-1">🏆 TOP PUNTER</p>
                <h2 className="text-3xl font-bold">{summary.topPunter.name}</h2>
                <p className="text-xl text-gold mt-1">
                  Final Balance: {summary.topPunter.finalBalance.toLocaleString()} credits
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center py-6">
            <Flag className="w-8 h-8 text-gold mx-auto mb-2" />
            <p className="text-3xl font-bold">{summary.statistics.totalRaces}</p>
            <p className="text-sm text-gray-400">Races</p>
          </Card>
          <Card className="text-center py-6">
            <Users className="w-8 h-8 text-gold mx-auto mb-2" />
            <p className="text-3xl font-bold">{summary.statistics.totalParticipants}</p>
            <p className="text-sm text-gray-400">Participants</p>
          </Card>
          <Card className="text-center py-6">
            <Target className="w-8 h-8 text-gold mx-auto mb-2" />
            <p className="text-3xl font-bold">{summary.statistics.totalBetsPlaced}</p>
            <p className="text-sm text-gray-400">Bets Placed</p>
          </Card>
          <Card className="text-center py-6">
            <TrendingUp className="w-8 h-8 text-gold mx-auto mb-2" />
            <p className="text-3xl font-bold">{summary.statistics.totalCreditsWagered.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Credits Wagered</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Race Results */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              Race Results
            </h2>
            
            {summary.raceResults.map((race) => (
              <Card key={race.raceNumber}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Badge variant="default">Race {race.raceNumber}</Badge>
                    <h3 className="font-semibold mt-1">{race.raceName}</h3>
                  </div>
                  <Badge variant={race.status === 'COMPLETED' ? 'success' : 'default'}>
                    {race.status}
                  </Badge>
                </div>
                
                {race.podium.first && (
                  <div className="space-y-2">
                    {/* 1st Place */}
                    <div className="flex items-center gap-3 p-3 bg-gold/10 rounded-lg border border-gold/30">
                      <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                        <span className="text-night font-bold">1st</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{race.podium.first.horseName}</p>
                        <p className="text-sm text-gray-400">
                          {race.podium.first.isUserSubmitted ? (
                            <span className="text-green-400">
                              ✨ Submitted by {race.podium.first.submittedBy}
                            </span>
                          ) : (
                            `Owner: ${race.podium.first.ownerName}`
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 2nd Place */}
                    {race.podium.second && (
                      <div className="flex items-center gap-3 p-3 bg-gray-500/10 rounded-lg">
                        <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                          <span className="text-night font-bold">2nd</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{race.podium.second.horseName}</p>
                          <p className="text-sm text-gray-400">
                            {race.podium.second.isUserSubmitted ? (
                              <span className="text-green-400">
                                ✨ Submitted by {race.podium.second.submittedBy}
                              </span>
                            ) : (
                              `Owner: ${race.podium.second.ownerName}`
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {race.podium.third && (
                      <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg">
                        <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">3rd</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{race.podium.third.horseName}</p>
                          <p className="text-sm text-gray-400">
                            {race.podium.third.isUserSubmitted ? (
                              <span className="text-green-400">
                                ✨ Submitted by {race.podium.third.submittedBy}
                              </span>
                            ) : (
                              `Owner: ${race.podium.third.ownerName}`
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Leaderboard */}
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Medal className="w-5 h-5 text-gold" />
              Top Punters
            </h2>
            
            <Card>
              <div className="space-y-3">
                {summary.topPunters.map((punter, index) => (
                  <div 
                    key={punter.userId}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      index === 0 ? 'bg-gold/10 border border-gold/30' :
                      index === 1 ? 'bg-gray-500/10' :
                      index === 2 ? 'bg-orange-500/10' :
                      'bg-night-lighter'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-gold text-night' :
                      index === 1 ? 'bg-gray-400 text-night' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-night-light text-gray-400'
                    }`}>
                      {punter.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{punter.name}</p>
                      <p className="text-xs text-gray-400">
                        {punter.winningBets}/{punter.totalBets} bets won ({punter.winRate}%)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${index === 0 ? 'text-gold' : 'text-white'}`}>
                        {punter.finalBalance.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">credits</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4">
              <h3 className="font-semibold mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">User Horses Won:</span>
                  <span className="font-medium">{summary.statistics.userHorsesWon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Winning Bets:</span>
                  <span className="font-medium">{summary.statistics.winningBets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Bets:</span>
                  <span className="font-medium">{summary.statistics.totalBetsPlaced}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
