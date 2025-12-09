'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Trophy, Edit, Save, X, ExternalLink, 
  Building2, Image, FileText, Globe, ChevronDown, ChevronUp
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Input, TextArea, Badge, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { Event, Race } from '@/types';

export default function RaceManagementPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
  const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: '',
    sponsorName: '',
    sponsorLogoUrl: '',
    sponsorDescription: '',
    sponsorWebsite: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const eventData = await api.getEvent(eventId);
        setEvent(eventData);
        
        const racesData = await api.getEventRaces(eventId);
        setRaces(racesData);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [eventId]);

  const handleEditClick = (race: Race) => {
    setEditingRaceId(race.id);
    setEditForm({
      name: race.name,
      sponsorName: race.sponsorName || '',
      sponsorLogoUrl: race.sponsorLogoUrl || '',
      sponsorDescription: race.sponsorDescription || '',
      sponsorWebsite: race.sponsorWebsite || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingRaceId(null);
    setEditForm({
      name: '',
      sponsorName: '',
      sponsorLogoUrl: '',
      sponsorDescription: '',
      sponsorWebsite: '',
    });
  };

  const handleSave = async (raceId: string) => {
    setIsSaving(true);
    try {
      const updatedRace = await api.updateRace(raceId, editForm);
      setRaces(races.map(r => r.id === raceId ? { ...r, ...updatedRace } : r));
      setEditingRaceId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="live">In Progress</Badge>;
      case 'BETTING_OPEN':
        return <Badge variant="warning">Betting Open</Badge>;
      case 'BETTING_CLOSED':
        return <Badge variant="default">Betting Closed</Badge>;
      default:
        return <Badge variant="default">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-night">
        <Header title="Race Management" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night">
      <Header title="Race Management" subtitle={event?.name} />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link 
          href={`/dashboard/events/${eventId}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Manage Races</h1>
          <p className="text-gray-400">
            Configure race names and sponsors. Each race can be sponsored by a local business.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {races.map((race) => (
            <Card key={race.id} className="overflow-hidden">
              {/* Race Header */}
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedRaceId(expandedRaceId === race.id ? null : race.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 bg-gold/20 text-gold rounded-full flex items-center justify-center font-bold">
                    {race.raceNumber}
                  </span>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {race.sponsorName ? `${race.sponsorName} presents: ` : ''}{race.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      {race.sponsorName ? (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Sponsored by {race.sponsorName}
                        </span>
                      ) : (
                        <span className="text-gray-500">No sponsor yet</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(race.status)}
                  {expandedRaceId === race.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedRaceId === race.id && (
                <div className="mt-6 pt-6 border-t border-night-lighter">
                  {editingRaceId === race.id ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <Input
                        name="name"
                        label="Race Name"
                        value={editForm.name}
                        onChange={handleChange}
                        placeholder="The Gold Cup"
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          name="sponsorName"
                          label="Sponsor Name"
                          value={editForm.sponsorName}
                          onChange={handleChange}
                          placeholder="Tom Walsh Motors"
                          leftIcon={<Building2 className="w-4 h-4 text-gray-500" />}
                        />
                        
                        <Input
                          name="sponsorWebsite"
                          label="Sponsor Website"
                          value={editForm.sponsorWebsite}
                          onChange={handleChange}
                          placeholder="https://tomwalshmotors.ie"
                          leftIcon={<Globe className="w-4 h-4 text-gray-500" />}
                        />
                      </div>

                      <Input
                        name="sponsorLogoUrl"
                        label="Sponsor Logo URL"
                        value={editForm.sponsorLogoUrl}
                        onChange={handleChange}
                        placeholder="https://example.com/logo.png"
                        leftIcon={<Image className="w-4 h-4 text-gray-500" />}
                        helperText="Paste a URL to the sponsor's logo image"
                      />

                      <TextArea
                        name="sponsorDescription"
                        label="Sponsor Info (for commentary)"
                        value={editForm.sponsorDescription}
                        onChange={handleChange}
                        placeholder="Tom Walsh Motors - your local Ford dealer since 1985. Family-owned business with over 500 happy customers..."
                        rows={3}
                        helperText="💡 The AI commentator will mention this during the race!"
                      />

                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          variant="ghost" 
                          onClick={handleCancelEdit}
                          leftIcon={<X className="w-4 h-4" />}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => handleSave(race.id)}
                          isLoading={isSaving}
                          leftIcon={<Save className="w-4 h-4" />}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div>
                      {race.sponsorName ? (
                        <div className="space-y-4">
                          {/* Sponsor Preview */}
                          <div className="flex items-start gap-4 p-4 bg-night-lighter rounded-lg">
                            {race.sponsorLogoUrl ? (
                              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img 
                                  src={race.sponsorLogoUrl} 
                                  alt={race.sponsorName}
                                  className="max-w-full max-h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-20 bg-night rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-8 h-8 text-gray-500" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{race.sponsorName}</h4>
                              {race.sponsorDescription && (
                                <p className="text-sm text-gray-400 mt-1">{race.sponsorDescription}</p>
                              )}
                              {race.sponsorWebsite && (
                                <a 
                                  href={race.sponsorWebsite}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-gold hover:underline mt-2"
                                >
                                  Visit website <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400">
                          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No sponsor assigned yet</p>
                          <p className="text-sm mt-1">Add a local business sponsor to this race</p>
                        </div>
                      )}

                      <div className="flex justify-end mt-4">
                        <Button 
                          variant="secondary"
                          onClick={() => handleEditClick(race)}
                          leftIcon={<Edit className="w-4 h-4" />}
                        >
                          Edit Race
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>

        {races.length === 0 && (
          <Card className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Races Yet</h3>
            <p className="text-gray-400">
              Races will be automatically created when you create an event.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
