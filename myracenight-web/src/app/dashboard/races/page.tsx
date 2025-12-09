'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Flag, ChevronDown, ChevronUp, Building2, Globe, Image, 
  Save, X, Sparkles, Eye, Plus, AlertCircle, CheckCircle,
  GripVertical, Upload
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, EmptyState, Spinner, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { useCurrentEvent } from '@/lib/eventContext';
import { Race, Horse as HorseType } from '@/types';

export default function RacesSponsorsPage() {
  const { currentEvent, isLoading: eventLoading, refreshEvent } = useCurrentEvent();
  const [races, setRaces] = useState<Race[]>([]);
  const [horses, setHorses] = useState<HorseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRace, setExpandedRace] = useState<string | null>(null);
  const [editingRace, setEditingRace] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    sponsorName: '',
    sponsorLogoUrl: '',
    sponsorDescription: '',
    sponsorWebsite: '',
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (currentEvent) {
      loadData();
    }
  }, [currentEvent]);

  // Add paste handler for images
  useEffect(() => {
    if (!editingRace) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
              setEditForm(prev => ({ ...prev, sponsorLogoUrl: e.target?.result as string }));
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [editingRace]);

  const loadData = async () => {
    if (!currentEvent) return;
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleGenerateRaces = async () => {
    if (!currentEvent) return;
    setGenerating(true);
    setError('');
    try {
      await api.generateRaces(currentEvent.id);
      await loadData();
      await refreshEvent();
    } catch (err: any) {
      setError(err.message || 'Failed to generate races');
    } finally {
      setGenerating(false);
    }
  };

  const startEditing = (race: Race) => {
    setEditingRace(race.id);
    setEditForm({
      name: race.name,
      sponsorName: race.sponsorName || '',
      sponsorLogoUrl: race.sponsorLogoUrl || '',
      sponsorDescription: race.sponsorDescription || '',
      sponsorWebsite: race.sponsorWebsite || '',
    });
    setExpandedRace(race.id);
  };

  const cancelEditing = () => {
    setEditingRace(null);
    setEditForm({
      name: '',
      sponsorName: '',
      sponsorLogoUrl: '',
      sponsorDescription: '',
      sponsorWebsite: '',
    });
  };

  const saveRace = async () => {
    if (!editingRace) return;
    setSaving(true);
    setError('');
    try {
      await api.updateRace(editingRace, editForm);
      await loadData();
      setEditingRace(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save race');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (raceId: string) => {
    if (editingRace === raceId) return; // Don't collapse while editing
    setExpandedRace(expandedRace === raceId ? null : raceId);
  };

  // Calculate stats
  const approvedHorses = horses.filter(h => h.approvalStatus === 'APPROVED');
  const assignedCount = approvedHorses.filter(h => h.raceId).length;
  const horsesPerRace = currentEvent?.horsesPerRace || 8;
  const totalSlotsNeeded = races.length * horsesPerRace;
  const sponsoredRaces = races.filter(r => r.sponsorName).length;

  if (eventLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen">
        <Header title="Races & Sponsors" subtitle="Configure your race card" />
        <div className="p-8">
          <Card>
            <EmptyState
              icon={<Flag className="w-12 h-12" />}
              title="No event selected"
              description="Create an event first to configure races"
              action={
                <Link href="/dashboard/events/new">
                  <Button>Create Event</Button>
                </Link>
              }
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Races & Sponsors"
        subtitle={`Configure races for ${currentEvent.name}`}
      />

      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Status Banner */}
        <Card className="mb-6 bg-night-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-gray-400">Races</p>
                <p className="text-2xl font-bold">{races.length}</p>
              </div>
              <div className="w-px h-12 bg-night-lighter" />
              <div>
                <p className="text-sm text-gray-400">Sponsored</p>
                <p className="text-2xl font-bold text-gold">{sponsoredRaces}</p>
              </div>
              <div className="w-px h-12 bg-night-lighter" />
              <div>
                <p className="text-sm text-gray-400">Horses Assigned</p>
                <p className="text-2xl font-bold">{assignedCount} / {totalSlotsNeeded}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary" 
                leftIcon={<Eye className="w-4 h-4" />}
                onClick={() => setShowPreview(true)}
                disabled={races.length === 0}
              >
                Preview Race Card
              </Button>
            </div>
          </div>
        </Card>

        {/* No Races State */}
        {races.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Flag className="w-10 h-10 text-gold" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No races configured yet</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Generate races for your event. Race names will be automatically created based on your club name.
            </p>
            <Button 
              onClick={handleGenerateRaces}
              isLoading={generating}
              leftIcon={<Sparkles className="w-5 h-5" />}
              size="lg"
            >
              Generate {currentEvent.numberOfRaces} Races
            </Button>
          </Card>
        ) : (
          /* Races List */
          <div className="space-y-4">
            {races.map((race, index) => {
              const isExpanded = expandedRace === race.id;
              const isEditing = editingRace === race.id;
              const horsesInRace = horses.filter(h => h.raceId === race.id);

              return (
                <Card key={race.id} padding="none" className="overflow-hidden">
                  {/* Race Header */}
                  <div 
                    className={`p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors ${isExpanded ? 'border-b border-night-lighter' : ''}`}
                    onClick={() => toggleExpand(race.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                        <span className="text-xl font-bold text-gold">{race.raceNumber}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            {race.sponsorName ? `${race.sponsorName} presents: ` : ''}{race.name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          {race.sponsorName ? (
                            <span className="text-gold">Sponsored by {race.sponsorName}</span>
                          ) : (
                            <span>No sponsor yet</span>
                          )}
                          {' • '}
                          {horsesInRace.length} / {horsesPerRace} horses
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {race.sponsorName && (
                        <Badge variant="success">Sponsored</Badge>
                      )}
                      {horsesInRace.length === horsesPerRace && (
                        <Badge variant="success">Full</Badge>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-6 bg-night/50">
                      {isEditing ? (
                        /* Edit Form */
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Race Name
                            </label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold"
                              placeholder="e.g., The Murphy's Gold Cup"
                            />
                          </div>

                          <div className="border-t border-night-lighter pt-6">
                            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-gold" />
                              Sponsor Details
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Sponsor Name
                                </label>
                                <input
                                  type="text"
                                  value={editForm.sponsorName}
                                  onChange={(e) => setEditForm({ ...editForm, sponsorName: e.target.value })}
                                  className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold"
                                  placeholder="e.g., Murphy's Bar"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Website
                                </label>
                                <div className="relative">
                                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                  <input
                                    type="url"
                                    value={editForm.sponsorWebsite}
                                    onChange={(e) => setEditForm({ ...editForm, sponsorWebsite: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold"
                                    placeholder="https://..."
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Logo
                              </label>
                              
                              {/* File Upload */}
                              <div className="mb-3">
                                <label className="block">
                                  <div className="border-2 border-dashed border-night-lighter rounded-lg p-6 text-center cursor-pointer hover:border-gold transition-colors">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (e) => {
                                            setEditForm({ ...editForm, sponsorLogoUrl: e.target?.result as string });
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-300 font-medium">Click to upload logo</p>
                                    <p className="text-xs text-gray-500 mt-1">Or paste an image from clipboard</p>
                                  </div>
                                </label>
                              </div>

                              {/* Logo Preview */}
                              {editForm.sponsorLogoUrl && (
                                <div className="mb-3 p-4 bg-night-light rounded-lg">
                                  <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                                      <img 
                                        src={editForm.sponsorLogoUrl} 
                                        alt="Logo preview" 
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '';
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">Logo uploaded</p>
                                      <p className="text-xs text-gray-500">Click upload again to replace</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditForm({ ...editForm, sponsorLogoUrl: '' })}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              {/* URL Input as Alternative */}
                              <div>
                                <p className="text-xs text-gray-400 mb-2">Or enter a logo URL:</p>
                                <div className="flex gap-3">
                                  <div className="relative flex-1">
                                    <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                      type="url"
                                      value={editForm.sponsorLogoUrl}
                                      onChange={(e) => setEditForm({ ...editForm, sponsorLogoUrl: e.target.value })}
                                      className="w-full pl-10 pr-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold"
                                      placeholder="https://..."
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Description for AI Commentary
                              </label>
                              <textarea
                                value={editForm.sponsorDescription}
                                onChange={(e) => setEditForm({ ...editForm, sponsorDescription: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold resize-none"
                                placeholder="Tell us about the sponsor - the AI commentator will mention this during the race!"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                💡 The AI commentator will mention this during the race!
                              </p>
                            </div>
                          </div>

                          {/* Edit Actions */}
                          <div className="flex items-center gap-3 pt-4 border-t border-night-lighter">
                            <Button
                              onClick={saveRace}
                              isLoading={saving}
                              leftIcon={<Save className="w-4 h-4" />}
                            >
                              Save Changes
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={cancelEditing}
                              leftIcon={<X className="w-4 h-4" />}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div>
                          {race.sponsorName ? (
                            <div className="flex items-start gap-6 mb-6">
                              {race.sponsorLogoUrl ? (
                                <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                  <img 
                                    src={race.sponsorLogoUrl} 
                                    alt={race.sponsorName}
                                    className="w-16 h-16 object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-20 h-20 bg-night-lighter rounded-xl flex items-center justify-center flex-shrink-0">
                                  <Building2 className="w-10 h-10 text-gray-500" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="text-xl font-semibold">{race.sponsorName}</h4>
                                {race.sponsorDescription && (
                                  <p className="text-gray-400 mt-1">{race.sponsorDescription}</p>
                                )}
                                {race.sponsorWebsite && (
                                  <a 
                                    href={race.sponsorWebsite}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gold hover:underline text-sm mt-2 inline-flex items-center gap-1"
                                  >
                                    <Globe className="w-4 h-4" />
                                    {race.sponsorWebsite}
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-night-lighter/50 rounded-lg mb-6">
                              <Building2 className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                              <p className="text-gray-400">No sponsor assigned to this race</p>
                              <p className="text-sm text-gray-500">Click Edit to add a sponsor</p>
                            </div>
                          )}

                          {/* Horses in Race */}
                          {horsesInRace.length > 0 && (
                            <div className="mb-6">
                              <h5 className="text-sm font-medium text-gray-300 mb-3">
                                Horses in this race ({horsesInRace.length}/{horsesPerRace})
                              </h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {horsesInRace.map((horse, idx) => (
                                  <div 
                                    key={horse.id}
                                    className="px-3 py-2 bg-night-light rounded-lg text-sm"
                                  >
                                    <span className="text-gold mr-2">{idx + 1}.</span>
                                    {horse.horseName}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Button
                            variant="secondary"
                            onClick={() => startEditing(race)}
                          >
                            Edit Race
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-night-light rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-night-lighter flex items-center justify-between">
                <h2 className="text-xl font-bold">Race Card Preview</h2>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="text-center mb-8">
                  <p className="text-gold uppercase tracking-widest text-sm mb-2">Race Night</p>
                  <h3 className="text-2xl font-display font-bold">{currentEvent.name}</h3>
                </div>
                <div className="space-y-4">
                  {races.map((race) => (
                    <div 
                      key={race.id}
                      className="p-4 bg-night rounded-lg border border-night-lighter"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                          <span className="font-bold text-gold">{race.raceNumber}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {race.sponsorName ? `The ${race.sponsorName} ` : ''}{race.name}
                          </h4>
                          {race.sponsorName && (
                            <p className="text-sm text-gray-400 flex items-center gap-2">
                              {race.sponsorLogoUrl && (
                                <img src={race.sponsorLogoUrl} alt="" className="w-4 h-4 object-contain" />
                              )}
                              Sponsored by {race.sponsorName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
