import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSatelliteStore } from '../stores/satelliteStore';
import { Satellite } from '../types/satellite.types';

// Earth component
const Earth: React.FC = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  
  // Create Earth texture (in production, load real Earth textures)
  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create a simple blue marble effect
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1e3a8a'); // Dark blue
    gradient.addColorStop(0.3, '#2563eb'); // Blue
    gradient.addColorStop(0.7, '#3b82f6'); // Light blue
    gradient.addColorStop(1, '#1e3a8a'); // Dark blue
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    // Add some landmass-like shapes
    ctx.fillStyle = '#22c55e';
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * 1024, 
        Math.random() * 512, 
        Math.random() * 50 + 20, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001; // Slow rotation
    }
  });

  return (
    <Sphere ref={earthRef} args={[1, 64, 32]}>
      <meshPhongMaterial map={earthTexture} />
    </Sphere>
  );
};

// Individual satellite component
interface SatelliteMarkerProps {
  satellite: Satellite;
  isSelected: boolean;
  onClick: () => void;
}

const SatelliteMarker: React.FC<SatelliteMarkerProps> = ({ 
  satellite, 
  isSelected, 
  onClick 
}) => {
  const markerRef = useRef<THREE.Mesh>(null);
  const { globeSettings } = useSatelliteStore();
  
  // Convert lat/lon to 3D position
  const position = useMemo(() => {
    const lat = (satellite.position.latitude * Math.PI) / 180;
    const lon = (satellite.position.longitude * Math.PI) / 180;
    const radius = 1 + (satellite.orbital.altitude / 6371) * 0.5; // Scale altitude
    
    const x = radius * Math.cos(lat) * Math.cos(lon);
    const y = radius * Math.sin(lat);
    const z = radius * Math.cos(lat) * Math.sin(lon);
    
    return [x, y, z] as [number, number, number];
  }, [satellite.position, satellite.orbital.altitude]);

  // Get color based on satellite type
  const color = useMemo(() => {
    switch (satellite.type) {
      case 'space-station': return '#22d3ee'; // stellar-cyan
      case 'constellation': return '#3b82f6'; // cosmic-blue
      case 'navigation': return '#f59e0b'; // jupiter-amber
      case 'weather': return '#8b5cf6'; // nebula-purple
      case 'earth-observation': return '#10b981'; // emerald
      case 'communication': return '#06b6d4'; // cyan
      case 'scientific': return '#a855f7'; // violet
      case 'military': return '#ef4444'; // mars-red
      default: return '#6b7280'; // gray
    }
  }, [satellite.type]);

  useFrame((state) => {
    if (markerRef.current) {
      // Animate satellite movement
      if (!globeSettings.isPaused) {
        // Simple orbital simulation - move along longitude
        const time = state.clock.getElapsedTime() * globeSettings.timeSpeed;
        const orbitalSpeed = 2 * Math.PI / (satellite.orbital.period * 60); // rad/s
        const newLon = (satellite.position.longitude + orbitalSpeed * time * 180 / Math.PI) % 360;
        
        const lat = (satellite.position.latitude * Math.PI) / 180;
        const lon = (newLon * Math.PI) / 180;
        const radius = 1 + (satellite.orbital.altitude / 6371) * 0.5;
        
        markerRef.current.position.set(
          radius * Math.cos(lat) * Math.cos(lon),
          radius * Math.sin(lat),
          radius * Math.cos(lat) * Math.sin(lon)
        );
      }
      
      // Pulsing effect for selected satellite
      if (isSelected) {
        const pulse = Math.sin(state.clock.getElapsedTime() * 4) * 0.3 + 1;
        markerRef.current.scale.setScalar(pulse);
      } else {
        markerRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={markerRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Orbital path visualization */}
      {(isSelected || globeSettings.showOrbits) && (
        <OrbitPath satellite={satellite} />
      )}
      
      {/* Satellite info on hover */}
      {isSelected && (
        <Html position={[0.02, 0.02, 0]} style={{ pointerEvents: 'none' }}>
          <div className="bg-card/90 backdrop-blur border border-border rounded-lg p-2 text-xs min-w-48">
            <div className="font-semibold text-foreground">{satellite.name}</div>
            <div className="text-muted-foreground">
              {satellite.orbital.altitude.toFixed(0)} km • {satellite.orbital.velocity.toFixed(2)} km/s
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              {satellite.position.latitude.toFixed(2)}°, {satellite.position.longitude.toFixed(2)}°
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Orbital path component
interface OrbitPathProps {
  satellite: Satellite;
}

const OrbitPath: React.FC<OrbitPathProps> = ({ satellite }) => {
  const orbitPoints = useMemo(() => {
    const points = [];
    const radius = 1 + (satellite.orbital.altitude / 6371) * 0.5;
    const inclination = (satellite.orbital.inclination * Math.PI) / 180;
    
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle) * Math.sin(inclination);
      const z = radius * Math.sin(angle) * Math.cos(inclination);
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return points;
  }, [satellite.orbital.altitude, satellite.orbital.inclination]);

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={orbitPoints.length}
            array={new Float32Array(orbitPoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" transparent opacity={0.6} />
      </line>
    </group>
  );
};

// Main scene component
const Scene: React.FC = () => {
  const { camera } = useThree();
  const { filteredSatellites, setSelectedSatellite, globeSettings } = useSatelliteStore();

  useEffect(() => {
    // Set initial camera position
    camera.position.set(3, 1, 3);
  }, [camera]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#3b82f6" />
      
      {/* Earth */}
      <Earth />
      
      {/* Satellites */}
      {filteredSatellites.map((satellite) => (
        <SatelliteMarker
          key={satellite.id}
          satellite={satellite}
          isSelected={globeSettings.selectedSatelliteId === satellite.id}
          onClick={() => setSelectedSatellite(satellite.id)}
        />
      ))}
      
      {/* Stars background */}
      <Stars />
    </>
  );
};

// Stars background
const Stars: React.FC = () => {
  const starsRef = useRef<THREE.Points>(null);
  
  const starGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(3000);
    
    for (let i = 0; i < 1000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  return (
    <points ref={starsRef} geometry={starGeometry}>
      <pointsMaterial color="#ffffff" size={0.5} transparent opacity={0.8} />
    </points>
  );
};

// Main Globe3D component
const Globe3D: React.FC = () => {
  return (
    <div className="h-full w-full bg-gradient-cosmic rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [3, 1, 3], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <Scene />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1.5}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
};

export default Globe3D;