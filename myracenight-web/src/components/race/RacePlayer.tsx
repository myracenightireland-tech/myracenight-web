'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, 
  AlertCircle, Trophy, Loader 
} from 'lucide-react';
import { Horse } from '@/types';

interface RacePlayerProps {
  videoUrl?: string;
  horses: Horse[];
  raceName: string;
  onRaceComplete?: (winnerPosition: number) => void;
  onManualStop?: () => void;
  commentaryAudioUrl?: string;
  autoStart?: boolean;
}

interface HorsePosition {
  horseId: string;
  position: number; // 1 to horses.length
  progress: number; // 0 to 100 percent
}

export function RacePlayer({
  videoUrl,
  horses,
  raceName,
  onRaceComplete,
  onManualStop,
  commentaryAudioUrl,
  autoStart = false
}: RacePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentaryRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [commentaryMuted, setCommentaryMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [horsePositions, setHorsePositions] = useState<HorsePosition[]>([]);
  const [showWinner, setShowWinner] = useState(false);
  const [winner, setWinner] = useState<Horse | null>(null);
  const [racePhase, setRacePhase] = useState<'countdown' | 'racing' | 'finished'>('countdown');

  // Initialize horse positions
  useEffect(() => {
    const initialPositions: HorsePosition[] = horses.map((horse, idx) => ({
      horseId: horse.id,
      position: idx + 1,
      progress: 0
    }));
    setHorsePositions(initialPositions);
  }, [horses]);

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Simulate horse positions based on video progress
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      updateHorsePositions(progress);
    }
  };

  // Simulate realistic horse racing positions
  const updateHorsePositions = (overallProgress: number) => {
    if (overallProgress >= 100) return;

    setHorsePositions(prevPositions => {
      return prevPositions.map(pos => {
        // Add some randomness to make it realistic
        const baseSpeed = 1;
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 multiplier
        const newProgress = Math.min(
          overallProgress * baseSpeed * randomFactor,
          100
        );

        return {
          ...pos,
          progress: newProgress
        };
      }).sort((a, b) => b.progress - a.progress)
        .map((pos, idx) => ({ ...pos, position: idx + 1 }));
    });
  };

  // Handle video end
  const handleVideoEnd = () => {
    setIsPlaying(false);
    setRacePhase('finished');
    
    // Determine winner (horse with most progress)
    const sortedPositions = [...horsePositions].sort((a, b) => b.progress - a.progress);
    const winningHorse = horses.find(h => h.id === sortedPositions[0].horseId);
    
    if (winningHorse) {
      setWinner(winningHorse);
      setShowWinner(true);
      
      // Call completion callback with winner position
      const winnerOriginalPosition = horses.findIndex(h => h.id === winningHorse.id) + 1;
      setTimeout(() => {
        onRaceComplete?.(winnerOriginalPosition);
      }, 3000); // Show winner for 3 seconds before callback
    }
  };

  // Start countdown then race
  const startRace = () => {
    if (countdown !== null) return; // Already counting down
    
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countInterval);
          // Start race
          setTimeout(() => {
            setCountdown(null);
            setRacePhase('racing');
            playVideo();
          }, 500);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Play video and commentary
  const playVideo = () => {
    videoRef.current?.play();
    if (commentaryAudioUrl && commentaryRef.current && !commentaryMuted) {
      commentaryRef.current.play();
    }
    setIsPlaying(true);
  };

  // Pause video and commentary
  const pauseVideo = () => {
    videoRef.current?.pause();
    commentaryRef.current?.pause();
    setIsPlaying(false);
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      pauseVideo();
    } else {
      if (racePhase === 'countdown') {
        startRace();
      } else {
        playVideo();
      }
    }
  };

  // Restart race
  const restartRace = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    if (commentaryRef.current) {
      commentaryRef.current.currentTime = 0;
    }
    setShowWinner(false);
    setWinner(null);
    setRacePhase('countdown');
    setCountdown(null);
    setIsPlaying(false);
    
    // Reset positions
    const resetPositions: HorsePosition[] = horses.map((horse, idx) => ({
      horseId: horse.id,
      position: idx + 1,
      progress: 0
    }));
    setHorsePositions(resetPositions);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement?.parentElement;
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && videoRef.current && !isLoading) {
      setTimeout(() => startRace(), 1000);
    }
  }, [autoStart, isLoading]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden">
      {/* Video Player */}
      <div className="relative aspect-video bg-black">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnd}
            onError={(e) => setError('Failed to load video')}
            muted={videoMuted}
            playsInline
          />
        ) : (
          // Placeholder for testing without video
          <div className="w-full h-full bg-gradient-to-br from-green-900 via-green-700 to-green-900 flex items-center justify-center">
            <div className="text-center text-white">
              <Play className="w-24 h-24 mx-auto mb-4 opacity-50" />
              <p className="text-2xl font-bold">Race Track Simulation</p>
              <p className="text-gray-300 mt-2">Click play to start the race</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <Loader className="w-12 h-12 text-gold animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-red-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-9xl font-bold text-gold animate-pulse">
                {countdown}
              </div>
              <p className="text-2xl text-white mt-4">Get Ready!</p>
            </div>
          </div>
        )}

        {/* Winner Overlay */}
        {showWinner && winner && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="text-center">
              <Trophy className="w-24 h-24 text-gold mx-auto mb-6 animate-bounce" />
              <p className="text-4xl font-bold text-gold mb-2">Winner!</p>
              <p className="text-6xl font-bold text-white mb-4">{winner.name}</p>
              {winner.jockeyName && (
                <p className="text-2xl text-gray-300">
                  Ridden by {winner.jockeyName}
                </p>
              )}
              <p className="text-lg text-gray-400 mt-4">
                Owner: {winner.ownerName}
              </p>
            </div>
          </div>
        )}

        {/* Race Name Overlay (Top) */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
          <h2 className="text-2xl font-bold text-white text-center">
            {raceName}
          </h2>
        </div>

        {/* Horse Positions Sidebar (Right) */}
        {racePhase === 'racing' && !showWinner && (
          <div className="absolute top-20 right-4 w-64 bg-black/80 backdrop-blur-sm rounded-lg p-3 space-y-2">
            <h3 className="text-white font-bold text-center mb-2 border-b border-white/20 pb-2">
              Live Positions
            </h3>
            {horsePositions.map((pos) => {
              const horse = horses.find(h => h.id === pos.horseId);
              if (!horse) return null;
              
              return (
                <div 
                  key={pos.horseId}
                  className="flex items-center gap-2 text-white"
                >
                  <span className={`
                    font-bold text-lg w-8 text-center
                    ${pos.position === 1 ? 'text-gold' : ''}
                  `}>
                    {pos.position}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium truncate">{horse.name}</div>
                    {horse.jockeyName && (
                      <div className="text-xs text-gray-400 truncate">
                        {horse.jockeyName}
                      </div>
                    )}
                  </div>
                  <div className="w-16 text-right text-sm text-gray-300">
                    {Math.round(pos.progress)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Progress Bar (Bottom) */}
        {racePhase === 'racing' && !showWinner && (
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-2">
              {horsePositions.map((pos) => {
                const horse = horses.find(h => h.id === pos.horseId);
                if (!horse) return null;
                
                const colors = [
                  'bg-red-500',
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-purple-500',
                  'bg-pink-500',
                  'bg-orange-500',
                  'bg-cyan-500'
                ];
                const colorIndex = horses.findIndex(h => h.id === horse.id);
                
                return (
                  <div key={pos.horseId} className="relative h-6 mb-1">
                    <div className="absolute inset-0 bg-white/10 rounded-full" />
                    <div 
                      className={`absolute inset-y-0 left-0 ${colors[colorIndex % colors.length]} rounded-full transition-all duration-300 flex items-center justify-end pr-2`}
                      style={{ width: `${pos.progress}%` }}
                    >
                      <span className="text-xs font-bold text-white">
                        {pos.position}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Commentary Audio (hidden) */}
      {commentaryAudioUrl && (
        <audio ref={commentaryRef} src={commentaryAudioUrl} />
      )}

      {/* Controls */}
      <div className="bg-night border-t border-night-lighter p-4">
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="p-3 bg-gold hover:bg-gold/80 rounded-full transition-colors"
            disabled={isLoading}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-night" />
            ) : (
              <Play className="w-6 h-6 text-night" />
            )}
          </button>

          {/* Time */}
          <div className="text-sm text-gray-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Progress Bar */}
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = parseFloat(e.target.value);
                }
              }}
              className="w-full"
            />
          </div>

          {/* Volume Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVideoMuted(!videoMuted)}
              className="p-2 hover:bg-white/10 rounded transition-colors"
            >
              {videoMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            
            {commentaryAudioUrl && (
              <button
                onClick={() => setCommentaryMuted(!commentaryMuted)}
                className="p-2 hover:bg-white/10 rounded transition-colors"
                title="Toggle commentary"
              >
                <span className={commentaryMuted ? 'line-through' : ''}>
                  🎙️
                </span>
              </button>
            )}
          </div>

          {/* Restart */}
          <button
            onClick={restartRace}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            title="Restart race"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            title="Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
