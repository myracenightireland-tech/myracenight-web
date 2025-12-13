import { useRef, useEffect, useState } from 'react';

interface RacePlayerProps {
  race: {
    id: string;
    videoUrl: string;
    commentaryAudioUrl?: string;
    horses: any[];
  };
  onFinish?: () => void;
}

/**
 * Race Player Component
 * - Plays race video
 * - Automatically mutes video when custom commentary exists
 * - Plays commentary audio in sync with video
 * - Handles play/pause/seek synchronization
 */
export function RacePlayer({ race, onFinish }: RacePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCommentary, setHasCommentary] = useState(false);

  // Check if commentary exists
  useEffect(() => {
    setHasCommentary(!!race.commentaryAudioUrl);
    console.log('Commentary available:', !!race.commentaryAudioUrl);
  }, [race.commentaryAudioUrl]);

  // CRITICAL: Mute video when commentary exists
  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    if (hasCommentary) {
      video.muted = true;
      video.volume = 0;
      console.log('Video muted - custom commentary will play');
    } else {
      video.muted = false;
      video.volume = 1;
      console.log('Video unmuted - original audio will play');
    }
  }, [hasCommentary]);

  // Sync audio with video
  useEffect(() => {
    if (!videoRef.current || !audioRef.current || !hasCommentary) return;
    
    const video = videoRef.current;
    const audio = audioRef.current;
    
    const handlePlay = () => {
      audio.play().catch(err => {
        console.error('Audio play failed:', err);
      });
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      audio.pause();
      setIsPlaying(false);
    };
    
    const handleSeeked = () => {
      // Sync audio to video position
      audio.currentTime = video.currentTime;
    };
    
    const handleEnded = () => {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      onFinish?.();
    };
    
    const handleRateChange = () => {
      // Sync playback speed
      audio.playbackRate = video.playbackRate;
    };
    
    // Add event listeners
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('ratechange', handleRateChange);
    
    // Cleanup
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('ratechange', handleRateChange);
    };
  }, [hasCommentary, onFinish]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Commentary Status Badge */}
      {hasCommentary && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10 shadow-lg">
          🎙️ Custom Commentary
        </div>
      )}
      
      {/* Video Player */}
      <video
        ref={videoRef}
        src={race.videoUrl}
        className="w-full h-full"
        playsInline
        muted={hasCommentary}  // CRITICAL: Mute when commentary exists
        controls
        preload="auto"
      />
      
      {/* Commentary Audio (hidden, synced with video) */}
      {hasCommentary && race.commentaryAudioUrl && (
        <audio
          ref={audioRef}
          src={race.commentaryAudioUrl}
          preload="auto"
          // Audio plays automatically when video plays
        />
      )}
    </div>
  );
}

export default RacePlayer;
