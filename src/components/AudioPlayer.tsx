import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface Track {
  id: string;
  title: string;
  file: string;
}

const tracks: Track[] = [
  {
    id: '1',
    title: 'GLIMMER',
    file: '/audio/glimmer.mp3'
  },
  {
    id: '2', 
    title: 'NEON WIND',
    file: '/audio/neon-wind.mp3'
  }
];

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([30]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
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
  }, [handleTrackEnd]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const nextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
    if (isPlaying) {
      setTimeout(() => {
        audioRef.current?.play();
      }, 100);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume[0] / 100;
    }
  };

  return (
    <div className="glass-panel p-2">
      <audio
        ref={audioRef}
        src={currentTrack.file}
        loop={false}
        preload="metadata"
      />
      
      {/* Track Info */}
      <div className="mb-2">
        <div className="text-xs text-primary font-medium">
          Audio
        </div>
        <div className="text-xs text-foreground truncate">
          {currentTrack.title}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlay}
            className="h-6 w-6 p-0"
          >
            {isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={nextTrack}
            className="h-6 w-6 p-0"
          >
            <SkipForward className="h-3 w-3" />
          </Button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={toggleMute}
          className="h-6 w-6 p-0"
        >
          {isMuted ? (
            <VolumeX className="h-3 w-3 text-destructive" />
          ) : (
            <Volume2 className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-2 mb-1">
        <VolumeX className="h-2 w-2 text-muted-foreground" />
        <div className="flex-1 bg-muted/30 rounded-full h-1">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-200"
            style={{ width: `${volume[0]}%` }}
          />
        </div>
        <Volume2 className="h-2 w-2 text-muted-foreground" />
        <span className="text-xs font-mono text-muted-foreground min-w-[2rem] text-right">
          {volume[0]}%
        </span>
      </div>

      {/* Track Counter */}
      <div className="text-xs text-muted-foreground text-center">
        {currentTrackIndex + 1} / {tracks.length}
      </div>
    </div>
  );
};

export default AudioPlayer;