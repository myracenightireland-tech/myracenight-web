'use client';

import { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface RacePlayerProps {
  race: any;
  onFinish?: () => void;
  isTestMode?: boolean;
}

export default function RacePlayer({ race, onFinish, isTestMode = false }: RacePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const hasCommentary = !!race.commentaryAudioUrl;
  const hasBackgroundAudio = !!race.backgroundAudioUrl;

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    const backgroundAudio = backgroundAudioRef.current;

    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      // Play commentary audio
      if (audio && hasCommentary) {
        audio.play().catch(console.error);
      }
      // Play background audio
      if (backgroundAudio && hasBackgroundAudio) {
        backgroundAudio.play().catch(console.error);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (audio) {
        audio.pause();
      }
      if (backgroundAudio) {
        backgroundAudio.pause();
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (backgroundAudio) {
        backgroundAudio.pause();
      }
      if (onFinish) {
        onFinish();
      }
    };

    const handleTimeUpdate = () => {
      // Keep commentary audio in sync with video
      if (audio && hasCommentary) {
        const timeDiff = Math.abs(video.currentTime - audio.currentTime);
        if (timeDiff > 0.3) {
          audio.currentTime = video.currentTime;
        }
      }
      // Keep background audio in sync with video
      if (backgroundAudio && hasBackgroundAudio) {
        const timeDiff = Math.abs(video.currentTime - backgroundAudio.currentTime);
        if (timeDiff > 0.3) {
          backgroundAudio.currentTime = video.currentTime;
        }
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [hasCommentary, hasBackgroundAudio, onFinish]);

  // Set background audio volume on mount
  useEffect(() => {
    const backgroundAudio = backgroundAudioRef.current;
    if (backgroundAudio) {
      backgroundAudio.volume = 0.35; // 35% volume for background noise
    }
  }, [hasBackgroundAudio]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    const backgroundAudio = backgroundAudioRef.current;
    if (!video) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Mute/unmute commentary
    if (audio) {
      audio.muted = newMutedState;
    }
    // Mute/unmute background audio
    if (backgroundAudio) {
      backgroundAudio.muted = newMutedState;
    }
    // Always keep video muted if we have commentary
    video.muted = hasCommentary ? true : newMutedState;
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={race.videoUrl}
        muted={hasCommentary} // Auto-mute if commentary exists
        playsInline
      />

      {/* Audio Element for Commentary */}
      {hasCommentary && (
        <audio
          ref={audioRef}
          src={race.commentaryAudioUrl}
          preload="auto"
        />
      )}

      {/* Audio Element for Background (crowd noise, horse sounds) */}
      {hasBackgroundAudio && (
        <audio
          ref={backgroundAudioRef}
          src={race.backgroundAudioUrl}
          preload="auto"
        />
      )}

      {/* Test Mode Badge - PROMINENT */}
      {isTestMode && (
        <div className="absolute top-4 left-4 bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-bold shadow-lg border-2 border-blue-300 animate-pulse flex items-center gap-2">
          <span className="text-2xl">🧪</span>
          TEST MODE
        </div>
      )}

      {/* Custom Commentary Badge */}
      {hasCommentary && (
        <div className="absolute top-4 right-4 bg-gold/90 text-night px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          Custom Commentary
        </div>
      )}

      {/* Simple Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>

          {/* Mute Button (only show if commentary exists) */}
          {hasCommentary && (
            <button
              onClick={toggleMute}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          )}

          {/* Race Info */}
          <div className="flex-1">
            <p className="text-white font-semibold">{race.name}</p>
            {race.sponsorName && (
              <p className="text-white/70 text-sm">Sponsored by {race.sponsorName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Play Button Overlay (when not playing) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <button
            onClick={togglePlay}
            className="w-20 h-20 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all transform hover:scale-110"
          >
            <Play className="w-10 h-10 text-white ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
