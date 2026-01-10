import { useState, useEffect } from 'react';

interface HostRaceControlsProps {
  eventId: string;
  raceId: string;
}

/**
 * Host Race Controls Component
 * - Shows commentary status
 * - Allows generating commentary for single race
 * - Allows batch generating for all races in event
 */
export function HostRaceControls({ eventId, raceId }: HostRaceControlsProps) {
  const [generating, setGenerating] = useState(false);
  const [commentaryStatus, setCommentaryStatus] = useState<string>('PENDING');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Check commentary status on mount and poll if generating
  useEffect(() => {
    checkStatus();
    
    const interval = setInterval(() => {
      if (commentaryStatus === 'GENERATING') {
        checkStatus();
      }
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [raceId, commentaryStatus]);

  const checkStatus = async () => {
    try {
      const response = await fetch(`/api/commentary/status/${raceId}`);
      const data = await response.json();
      
      if (data.success) {
        setCommentaryStatus(data.status.status || 'PENDING');
        setAudioUrl(data.status.audioUrl || null);
      }
    } catch (error) {
      console.error('Failed to check commentary status:', error);
    }
  };

  const handleGenerateCommentary = async () => {
    if (!confirm('Generate custom commentary for this race? This may take 2-3 minutes.')) {
      return;
    }
    
    setGenerating(true);
    
    try {
      const response = await fetch(`/api/commentary/generate/${raceId}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Commentary generation started! It will be ready in 2-3 minutes.');
        setCommentaryStatus('GENERATING');
      } else {
        alert('Failed to generate commentary: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to generate commentary:', error);
      alert('Failed to generate commentary. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAllCommentary = async () => {
    if (!confirm('Generate commentary for ALL races in this event? This may take 15-20 minutes.')) {
      return;
    }
    
    setGenerating(true);
    
    try {
      const response = await fetch(`/api/commentary/generate-event/${eventId}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Commentary generation started for all races! Check back in 15-20 minutes.');
      } else {
        alert('Failed to generate commentary: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to generate all commentary:', error);
      alert('Failed to generate commentary. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = () => {
    switch (commentaryStatus) {
      case 'GENERATED':
        return 'bg-green-100 text-green-800';
      case 'GENERATING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = () => {
    switch (commentaryStatus) {
      case 'GENERATED':
        return '✅';
      case 'GENERATING':
        return '⏳';
      case 'FAILED':
        return '❌';
      default:
        return '⚪';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Commentary Controls</h3>
      
      {/* Commentary Status */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Commentary Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor()}`}>
            {getStatusIcon()} {commentaryStatus}
          </span>
        </div>
        
        {/* Status Messages */}
        {commentaryStatus === 'PENDING' && (
          <p className="text-sm text-gray-600 mb-3">
            No custom commentary yet. Generate it to replace generic horse names with user names!
          </p>
        )}
        
        {commentaryStatus === 'GENERATING' && (
          <div className="mb-3">
            <p className="text-sm text-yellow-600 mb-2">
              ⏳ Generating commentary... This takes 2-3 minutes.
            </p>
            <p className="text-xs text-gray-500">
              Page will update automatically. Feel free to navigate away.
            </p>
          </div>
        )}
        
        {commentaryStatus === 'GENERATED' && (
          <div className="mb-3">
            <p className="text-sm text-green-600 mb-2">
              ✅ Custom commentary ready! Users will hear their horse names in the race.
            </p>
            {audioUrl && (
              <p className="text-xs text-gray-500">
                Audio URL: {audioUrl.substring(0, 50)}...
              </p>
            )}
          </div>
        )}
        
        {commentaryStatus === 'FAILED' && (
          <p className="text-sm text-red-600 mb-3">
            ❌ Commentary generation failed. Try again or contact support.
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleGenerateCommentary}
            disabled={generating || commentaryStatus === 'GENERATING'}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
          >
            {generating ? 'Generating...' : commentaryStatus === 'GENERATED' ? 'Regenerate' : 'Generate Commentary'}
          </button>
        </div>
      </div>
      
      {/* Batch Generate All Races */}
      <div className="p-4 border rounded-lg bg-blue-50">
        <h4 className="font-bold mb-2">Batch Generate</h4>
        <p className="text-sm text-gray-600 mb-3">
          Generate custom commentary for all races in this event at once. Takes ~15-20 minutes.
        </p>
        <button
          onClick={handleGenerateAllCommentary}
          disabled={generating}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
        >
          Generate Commentary for All Races
        </button>
      </div>
    </div>
  );
}

export default HostRaceControls;
