'use client';

import { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player/lazy';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  onComplete: () => void;
  startTime?: number;
  className?: string;
}

export function VideoPlayer({
  videoId,
  onComplete,
  startTime = 0,
  className,
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<Error | string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasTriggeredEnd, setHasTriggeredEnd] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);

  // URL für den Vimeo-Player
  const videoUrl = `https://player.vimeo.com/video/${videoId}`;

  const handleReady = () => {
    console.log('Video ist bereit für die Wiedergabe');
    setIsLoading(false);
  };

  const handleError = (error: Error | string) => {
    console.error('Fehler beim Laden des Videos:', error);
    setHasError(error);
    setIsLoading(false);
  };

  const handleEnded = () => {
    console.log('Video ended event triggered');
    setIsPlaying(false);

    // Zusätzlich sicherstellen, dass der Player wirklich anhält
    if (playerRef.current && playerRef.current.getInternalPlayer) {
      try {
        const internalPlayer = playerRef.current.getInternalPlayer();
        if (internalPlayer && typeof internalPlayer.pause === 'function') {
          internalPlayer.pause();
        }
      } catch (err) {
        console.error('Fehler beim Pausieren des internen Players:', err);
      }
    }

    // Completion Callback aufrufen
    if (!hasTriggeredEnd && onComplete) {
      setHasTriggeredEnd(true);
      onComplete();
    }
  };

  const handleProgress = (state: {
    playedSeconds: number;
    loadedSeconds: number;
  }) => {
    // Wenn das Video fast am Ende ist (>99%), als beendet markieren
    // Dies ist ein Fallback, falls onEnded nicht zuverlässig ist
    if (state.playedSeconds > state.loadedSeconds - 1 && !hasTriggeredEnd) {
      // Video pausieren
      setIsPlaying(false);

      // Completion-Callback aufrufen
      setHasTriggeredEnd(true);
      if (onComplete) {
        onComplete();
      }
      handlePause();
    }
  };

  const handlePlay = () => {
    console.log('Video wird abgespielt');
    setIsPlaying(true);
  };

  const handlePause = () => {
    console.log('Video wurde pausiert');
    setIsPlaying(false);
  };

  // Video zur Startzeit setzen, sobald es geladen ist
  useEffect(() => {
    if (startTime > 0 && playerRef.current && !isLoading) {
      try {
        playerRef.current.seekTo(startTime);
        console.log(`Zu Startzeit ${startTime}s gesprungen`);
      } catch (err) {
        console.error('Fehler beim Setzen der Startzeit:', err);
      }
    }
  }, [startTime, isLoading]);

  // Zustand zurücksetzen beim Wechsel des Videos
  useEffect(() => {
    setHasTriggeredEnd(false);
    setIsPlaying(false);
  }, [videoId]);

  return (
    <div className={`relative aspect-video ${className}`}>
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800'>
          <Loader2 className='h-8 w-8 animate-spin text-[#4AA4DE]' />
        </div>
      )}

      {hasError ? (
        <div className='absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20 p-4 text-center'>
          <div>
            <p className='text-red-600 dark:text-red-400 font-medium'>
              Fehler beim Laden des Videos
            </p>
            <p className='text-red-500 dark:text-red-300 text-sm mt-1'>
              {hasError instanceof Error ? hasError.message : String(hasError)}
            </p>
          </div>
        </div>
      ) : (
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          width='100%'
          height='100%'
          controls={true}
          playing={isPlaying}
          onReady={handleReady}
          onError={handleError}
          onEnded={handleEnded}
          onProgress={handleProgress}
          onPlay={handlePlay}
          onPause={handlePause}
          config={{
            vimeo: {
              playerOptions: {
                responsive: true,
                autopause: true,
                dnt: true,
                playsinline: true,
              },
            },
          }}
        />
      )}
    </div>
  );
}
