'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Trophy, Edit, Save, X, ExternalLink, 
  Building2, Image, FileText, Globe, ChevronDown, ChevronUp,
  Mic, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Input, TextArea, Badge, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { Event, Race, Horse } from '@/types';

export default function RaceManagementPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
  const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingRaceId, setGeneratingRaceId] = useState<string | null>(null);
  const [commentaryStatus, setCommentaryStatus] = useState<Record<string, any>>({});
  
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
        
        const [racesData, horsesData] = await Promise.all([
          api.getEventRaces(eventId),
          api.getEventHorses(eventId),
        ]);
        setRaces(racesData);
        setHorses(horsesData);
        
        // Check commentary status for each race
        const statusPromises = racesData.map(async (race) => {
          try {
            const status = await api.getCommentaryStatus(race.id);
            return { raceId: race.id, status };
          } catch (err) {
            return { raceId: race.id, status: { hasCommentary: false, status: 'PENDING' } };
          }
        });
        
        const statuses = await Promise.all(statusPromises);
        const statusMap: Record<string, any> = {};
        statuses.forEach(({ raceId, status }) => {
          statusMap[raceId] = status;
        });
        setCommentaryStatus(statusMap);
        
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

  const generateCommentary = async (raceId: string) => {
    setGeneratingRaceId(raceId);
    setError('');
    try {
      const result = await api.generateCommentary(raceId);
      
      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes
      
      const pollStatus = async () => {
        const status = await api.getCommentaryStatus(raceId);
        setCommentaryStatus(prev => ({ ...prev, [raceId]: status }));
        
        if (status.status === 'COMPLETE' || status.status === 'COMPLETED') {
          setGeneratingRaceId(null);
          return true;
        }
        
        if (status.status === 'ERROR') {
          throw new Error(status.error || 'Commentary generation failed');
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Commentary generation timed out');
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        return pollStatus();
      };
      
      await pollStatus();
      
    } catch (err: any) {
      setError(err.message || 'Failed to generate commentary');
      setGeneratingRaceId(null);
    }
  };

  const generateAllCommentary = async () => {
    setGeneratingAll(true);
    setError('');
    
    for (const race of races) {
      const status = commentaryStatus[race.id];
      if (!status?.hasCommentary) {
        await generateCommentary(race.id);
      }
    }
    
    setGeneratingAll(false);
  };

  // Get detailed race status based on actual race.status from database
  const getRaceDisplayStatus = (race: Race) => {
    const expectedHorses = race.requiredHorseCount || 8;
    const assignedHorses = horses?.filter(h => h.raceId === race.id).length || 0;

    // Use the actual race.status from the database
    switch (race.status) {
      case 'COMPLETED':
        return { label: 'Finished', variant: 'success' as const, detail: `Winner: Position ${race.winningPosition}` };
      case 'IN_PROGRESS':
        return { label: '🔴 Live', variant: 'live' as const, detail: 'Race in progress' };
      case 'BETTING_CLOSED':
        return { label: 'Betting Closed', variant: 'warning' as const, detail: 'Race starting soon' };
      case 'BETTING_OPEN':
        return { label: 'Betting Open', variant: 'success' as const, detail: 'Players can place bets' };
      case 'READY_TO_RACE':
        return { label: 'Ready to Race', variant: 'success' as const, detail: 'Commentary ready' };
      case 'READY_FOR_COMMENTARY':
        return { label: 'Ready for Commentary', variant: 'warning' as const, detail: `${assignedHorses}/${expectedHorses} horses - Generate commentary` };
      case 'SLOTS_INCOMPLETE':
      default:
        if (assignedHorses === 0) {
          return { label: 'Add Horses', variant: 'error' as const, detail: `0/${expectedHorses} slots to fill` };
        }
        return { label: 'Add Horses', variant: 'warning' as const, detail: `${assignedHorses}/${expectedHorses} slots filled` };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Finished</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="live">🔴 Live</Badge>;
      case 'BETTING_OPEN':
        return <Badge variant="success">Betting Open</Badge>;
      case 'BETTING_CLOSED':
        return <Badge variant="warning">Betting Closed</Badge>;
      case 'READY_TO_RACE':
        return <Badge variant="success">✅ Ready to Race</Badge>;
      case 'READY_FOR_COMMENTARY':
        return <Badge variant="warning">🎙️ Ready for Commentary</Badge>;
      case 'SLOTS_INCOMPLETE':
        return <Badge variant="default">⚪ Add Horses</Badge>;
      default:
        return <Badge variant="default">Setup</Badge>;
    }
  };

  const getCommentaryBadge = (raceId: string) => {
    const status = commentaryStatus[raceId];
    if (!status) return <Badge variant="default"><Clock className="w-3 h-3 mr-1" />Loading...</Badge>;
    
    if (status.hasCommentary) {
      return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>;
    }
    
    if (status.status === 'GENERATING') {
      return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Generating...</Badge>;
    }
    
    if (status.status === 'ERROR') {
      return <Badge variant="error"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    }
    
    return <Badge variant="default"><Clock className="w-3 h-3 mr-1" />No Commentary</Badge>;
  };

  const allHaveCommentary = races.every(race => commentaryStatus[race.id]?.hasCommentary);
  const noneHaveCommentary = races.every(race => !commentaryStatus[race.id]?.hasCommentary);

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold mb-2">Manage Races</h1>
              <p className="text-gray-400">
                Configure races, add sponsors, and generate AI commentary
              </p>
            </div>
            
            {/* Generate All Button */}
            {races.length > 0 && !allHaveCommentary && (
              <Button
                onClick={generateAllCommentary}
                isLoading={generatingAll}
                leftIcon={<Mic className="w-5 h-5" />}
                size="lg"
              >
                Generate All Commentary
              </Button>
            )}
            
            {allHaveCommentary && (
              <Badge variant="success" className="text-lg px-4 py-2">
                <CheckCircle className="w-5 h-5 mr-2" />
                All Ready!
              </Badge>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Commentary Status Overview */}
        {races.length > 0 && (
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Commentary Status</h3>
                <p className="text-sm text-gray-400">
                  {races.filter(r => commentaryStatus[r.id]?.hasCommentary).length} of {races.length} races ready
                </p>
              </div>
              <div className="flex items-center gap-2">
                {races.map((race, idx) => (
                  <div 
                    key={race.id}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      commentaryStatus[race.id]?.hasCommentary 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
            </div>
          </Card>
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
                  {getCommentaryBadge(race.id)}
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
                        placeholder="Tom Walsh Motors - your local Ford dealer since 1985..."
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

                      {/* Commentary Section */}
                      <div className="mt-6 p-4 bg-night-lighter rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">AI Commentary</h4>
                            <p className="text-sm text-gray-400 mt-1">
                              {commentaryStatus[race.id]?.hasCommentary 
                                ? 'Ready to play with custom horse names'
                                : 'Generate AI commentary for this race'
                              }
                            </p>
                          </div>
                          {getCommentaryBadge(race.id)}
                        </div>
                        
                        {!commentaryStatus[race.id]?.hasCommentary && (
                          <Button
                            onClick={() => generateCommentary(race.id)}
                            isLoading={generatingRaceId === race.id}
                            leftIcon={<Mic className="w-4 h-4" />}
                            className="w-full"
                          >
                            {generatingRaceId === race.id ? 'Generating...' : 'Generate Commentary'}
                          </Button>
                        )}
                      </div>

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
              Races will be automatically created when you generate them for the event.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
