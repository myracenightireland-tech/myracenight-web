import { useEffect, useState } from 'react';

interface Race {
  id: string;
  videoUrl: string;
  commentaryAudioUrl?: string;
  commentaryStatus?: 'PENDING' | 'GENERATING' | 'GENERATED' | 'FAILED';
  horses: any[];
  [key: string]: any;
}

/**
 * Hook to fetch race data including commentary status
 * Automatically includes commentary audio URL if available
 */
export function useRaceData(raceId: string) {
  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRace() {
      if (!raceId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch race data
        const raceResponse = await fetch(`/api/races/${raceId}`);
        if (!raceResponse.ok) {
          throw new Error('Failed to fetch race');
        }
        const raceData = await raceResponse.json();
        
        // Check if commentary exists
        let commentaryAudioUrl = null;
        let commentaryStatus = 'PENDING';
        
        try {
          const commentaryResponse = await fetch(`/api/commentary/status/${raceId}`);
          if (commentaryResponse.ok) {
            const commentaryData = await commentaryResponse.json();
            if (commentaryData.success && commentaryData.status) {
              commentaryAudioUrl = commentaryData.status.audioUrl || null;
              commentaryStatus = commentaryData.status.status || 'PENDING';
            }
          }
        } catch (err) {
          console.warn('Commentary not available for this race');
        }
        
        setRace({
          ...raceData,
          commentaryAudioUrl,
          commentaryStatus,
        });
      } catch (err) {
        console.error('Failed to fetch race:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch race');
      } finally {
        setLoading(false);
      }
    }
    
    fetchRace();
  }, [raceId]);

  return { race, loading, error };
}

export default useRaceData;
