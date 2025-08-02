import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const AudioControl = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(20);
  const [currentMode, setCurrentMode] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  // Synthwave audio modes
  const modes = [
    { name: "TERMINAL AMBIENT", freq: [80, 120, 160] },
    { name: "CYBERPUNK PULSE", freq: [100, 150, 200, 250] },
    { name: "NEON GRID", freq: [90, 135, 180, 270] }
  ];

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const createSynthwave = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }

    const frequencies = modes[currentMode].freq;
    oscillatorsRef.current = [];

    frequencies.forEach((freq, index) => {
      const oscillator = audioContextRef.current!.createOscillator();
      const gainNode = audioContextRef.current!.createGain();
      
      oscillator.type = index % 2 === 0 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(freq, audioContextRef.current!.currentTime);
      
      // Create slow LFO for ambient feel
      const lfo = audioContextRef.current!.createOscillator();
      const lfoGain = audioContextRef.current!.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.1 + (index * 0.05), audioContextRef.current!.currentTime);
      lfoGain.gain.setValueAtTime(freq * 0.1, audioContextRef.current!.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      
      gainNode.gain.setValueAtTime(0.05 / frequencies.length, audioContextRef.current!.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(gainNodeRef.current!);
      
      oscillator.start();
      lfo.start();
      
      oscillatorsRef.current.push(oscillator);
    });
  };

  const stopAudio = () => {
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator already stopped
      }
    });
    oscillatorsRef.current = [];
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      createSynthwave();
    }
    setIsPlaying(!isPlaying);
  };

  const nextMode = () => {
    setCurrentMode((prev) => (prev + 1) % modes.length);
    if (isPlaying) {
      stopAudio();
      setTimeout(createSynthwave, 100);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0]);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVolume[0] / 100, audioContextRef.current!.currentTime);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background/90 backdrop-blur-sm border border-primary/20 rounded-lg p-4 shadow-lg shadow-primary/10">
      <div className="flex items-center gap-3">
        <div className="text-xs text-primary font-mono tracking-wider">
          SYNTHWAVE: {modes[currentMode]?.name}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlay}
            className="h-8 w-8 p-0 hover:bg-primary/20 text-primary"
          >
            {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMode}
            className="h-8 w-8 p-0 hover:bg-primary/20 text-primary"
          >
            <Music size={16} />
          </Button>
          
          <div className="w-20">
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioControl;