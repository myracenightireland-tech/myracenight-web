'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Users, MapPin, Trophy, Edit, MoreVertical } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, EmptyState, PageLoading, Badge } from '@/components/ui';
import { api } from '@/lib/api';
import { Club } from '@/types';

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const data = await api.getClubs();
        setClubs(data);
      } catch (error) {
        console.error('Failed to load clubs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadClubs();
  }, []);

  if (isLoading) return <PageLoading />;

  return (
    <div className="min-h-screen">
      <Header
        title="Clubs"
        subtitle="Manage your sports clubs"
      />

      <div className="p-8">
        {/* Actions */}
        <div className="flex justify-end mb-8">
          <Link href="/dashboard/clubs/new">
            <Button leftIcon={<Plus className="w-5 h-5" />}>
              New Club
            </Button>
          </Link>
        </div>

        {/* Clubs Grid */}
        {clubs.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title="No clubs yet"
              description="Create your first club to start hosting race night events"
              action={
                <Link href="/dashboard/clubs/new">
                  <Button leftIcon={<Plus className="w-5 h-5" />}>
                    Create Club
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <Card key={club.id} hover padding="none" className="overflow-hidden">
                {/* Club Header */}
                <div className="h-32 bg-gradient-to-br from-racing-green to-racing-green-dark relative overflow-hidden">
                  <div className="absolute inset-0 racing-stripes opacity-30" />
                  {club.logoUrl ? (
                    <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl">🏆</span>
                    </div>
                  )}
                </div>

                {/* Club Details */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{club.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default">{club.sport}</Badge>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{club.county}</span>
                    </div>
                    {club.achievements && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Trophy className="w-4 h-4" />
                        <span className="line-clamp-1">{club.achievements}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{club.members?.length || 0} members</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-night-lighter">
                    <Link href={`/dashboard/clubs/${club.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/dashboard/clubs/${club.id}/edit`}>
                      <button className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
