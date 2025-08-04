import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Track {
  name: string;
  file: string;
  duration: number;
}

const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement>(null);

  const tracks: Track[] = [
    { name: 'Cosmic Glimmer', file: '/audio/glimmer.mp3', duration: 180 },
    { name: 'Neon Wind', file: '/audio/neon-wind.mp3', duration: 240 }
  ];

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  const handleTrackEnd = useCallback(() => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
    // Auto-play next track if currently playing
    if (isPlaying) {
      setTimeout(() => {
        audioRef.current?.play();
      }, 100);
    }
  }, [currentTrackIndex, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('ended', handleTrackEnd);
      return () => {
        audio.removeEventListener('ended', handleTrackEnd);
      };
    }
    return undefined;
  }, [handleTrackEnd]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
    
    setTimeout(() => {
      if (isPlaying && audioRef.current) {
        audioRef.current.play();
      }
    }, 100);
  };

  const handlePrevious = () => {
    const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    
    setTimeout(() => {
      if (isPlaying && audioRef.current) {
        audioRef.current.play();
      }
    }, 100);
  };

  const currentTrack = tracks[currentTrackIndex];

  return (
    <Card className="w-full max-w-sm glass-panel">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            <div className="font-medium text-foreground">{currentTrack.name}</div>
            <div className="text-muted-foreground">Ambient Space Audio</div>
          </div>
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handlePrevious}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button onClick={handlePlayPause} className="rounded-full">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNext}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        <audio
          ref={audioRef}
          src={currentTrack.file}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </CardContent>
    </Card>
  );
};

export default AudioPlayer;