import React, { useState, useRef, useEffect } from 'react';
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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleTrackEnd);
      return () => {
        audioRef.current?.removeEventListener('ended', handleTrackEnd);
      };
    }
  }, [currentTrackIndex]);

  const handleTrackEnd = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
    // Auto-play next track if currently playing
    if (isPlaying) {
      setTimeout(() => {
        audioRef.current?.play();
      }, 100);
    }
  };

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
    <div className="fixed bottom-4 right-4 z-50">
      <div className="terminal-panel bg-black border-2 border-neon-cyan p-3 min-w-[280px]">
        <audio
          ref={audioRef}
          src={currentTrack.file}
          loop={false}
          preload="metadata"
        />
        
        {/* Track Info */}
        <div className="mb-3">
          <div className="text-xs font-terminal text-neon-cyan mb-1">
            [ AUDIO CHANNEL ACTIVE ]
          </div>
          <div className="text-sm font-terminal text-terminal-green truncate">
            {currentTrack.title}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlay}
              className="terminal-button h-8 w-8 p-0 hover:bg-neon-cyan/20"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 text-neon-cyan" />
              ) : (
                <Play className="h-4 w-4 text-neon-cyan" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={nextTrack}
              className="terminal-button h-8 w-8 p-0 hover:bg-neon-cyan/20"
            >
              <SkipForward className="h-4 w-4 text-neon-cyan" />
            </Button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={toggleMute}
            className="terminal-button h-8 w-8 p-0 hover:bg-neon-cyan/20"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-danger-red" />
            ) : (
              <Volume2 className="h-4 w-4 text-neon-cyan" />
            )}
          </Button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center space-x-2">
          <VolumeX className="h-3 w-3 text-neon-cyan" />
          <Slider
            value={volume}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1"
          />
          <Volume2 className="h-3 w-3 text-neon-cyan" />
        </div>

        {/* Track Counter */}
        <div className="text-xs font-terminal text-neon-cyan mt-2 text-center">
          {currentTrackIndex + 1} / {tracks.length}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;