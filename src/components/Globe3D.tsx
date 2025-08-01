import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSatelliteStore } from '../stores/satelliteStore';
import { Satellite } from '../types/satellite.types';
import ErrorBoundary from './ErrorBoundary';

// Stationary Earth component
const Earth: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const earthRadius = 5;
  
  const earthTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load('/earth-texture.jpg');
  }, []);

  // Earth stays stationary
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[earthRadius, 32, 16]} />
      <meshPhongMaterial map={earthTexture} />
    </mesh>
  );
};

// Optimized satellite marker with orbital motion
interface SatelliteMarkerProps {
  satellite: Satellite;
  isSelected: boolean;
  onClick: () => void;
}

const SatelliteMarker: React.FC<SatelliteMarkerProps> = React.memo(({ 
  satellite, 
  isSelected, 
  onClick 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Calculate base orbital parameters
  const orbitalData = useMemo(() => {
    const { latitude, longitude, altitude } = satellite.position;
    if (!latitude || !longitude || !altitude) return null;
    
    const earthRadius = 5;
    const radius = earthRadius + (altitude * 5) / 6371; // Proper scaling
    const inclination = (satellite.orbital.inclination * Math.PI) / 180;
    const period = satellite.orbital.period || 90; // minutes
    
    // Convert initial position to orbital parameters
    const lat = (latitude * Math.PI) / 180;
    const lon = (longitude * Math.PI) / 180;
    
    return {
      radius,
      inclination,
      period,
      initialAngle: lon, // Use longitude as starting orbital angle
      initialLat: lat
    };
  }, [satellite.position, satellite.orbital]);

  // Satellite type colors
  const color = useMemo(() => {
    const colors = {
      'space-station': '#00d9ff',
      'constellation': '#3b82f6',
      'navigation': '#fbbf24',
      'weather': '#a855f7',
      'earth-observation': '#10b981',
      'communication': '#06b6d4',
      'scientific': '#8b5cf6',
      'military': '#ef4444'
    };
    return colors[satellite.type as keyof typeof colors] || '#6b7280';
  }, [satellite.type]);

  // Orbital motion animation
  useFrame((state) => {
    if (groupRef.current && orbitalData) {
      const time = state.clock.getElapsedTime();
      
      // Orbital speed based on period (faster for lower orbits)
      const orbitalSpeed = (2 * Math.PI) / (orbitalData.period * 0.1); // Speed up 10x for visibility
      
      // Current orbital angle
      const angle = orbitalData.initialAngle + (time * orbitalSpeed);
      
      // Calculate position in orbital plane
      const x = orbitalData.radius * Math.cos(angle);
      const z = orbitalData.radius * Math.sin(angle);
      const y = 0;
      
      // Apply orbital inclination
      const inclinedY = y * Math.cos(orbitalData.inclination) - z * Math.sin(orbitalData.inclination);
      const inclinedZ = y * Math.sin(orbitalData.inclination) + z * Math.cos(orbitalData.inclination);
      
      // Update position
      groupRef.current.position.set(x, inclinedY, inclinedZ);
    }
    
    // Pulsing animation for selected satellites
    if (meshRef.current && isSelected) {
      const pulse = Math.sin(state.clock.getElapsedTime() * 3) * 0.1 + 1.0;
      meshRef.current.scale.setScalar(pulse);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  if (!orbitalData) return null;

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      
      {isSelected && (
        <mesh>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
});

// Camera controller component
const CameraController: React.FC = () => {
  const { camera } = useThree();
  const { filteredSatellites, globeSettings } = useSatelliteStore();
  const controlsRef = useRef<any>(null);
  
  useEffect(() => {
    if (!globeSettings.selectedSatelliteId) {
      // Return to Earth view when no satellite selected
      if (controlsRef.current) {
        const earthTarget = new THREE.Vector3(0, 0, 0);
        const earthPosition = new THREE.Vector3(12, 8, 12);
        
        // Smooth transition back to Earth
        const startPosition = camera.position.clone();
        const startTarget = controlsRef.current.target.clone();
        
        let progress = 0;
        const animate = () => {
          progress += 0.02;
          if (progress <= 1) {
            camera.position.lerpVectors(startPosition, earthPosition, progress);
            controlsRef.current.target.lerpVectors(startTarget, earthTarget, progress);
            controlsRef.current.update();
            requestAnimationFrame(animate);
          }
        };
        animate();
      }
    }
  }, [globeSettings.selectedSatelliteId, camera]);

  return (
    <OrbitControls 
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2}
      maxDistance={50}
    />
  );
};

// Main scene component
const Scene: React.FC = () => {
  const { filteredSatellites, setSelectedSatellite, globeSettings } = useSatelliteStore();

  const visibleSatellites = useMemo(() => {
    const { selectedSatelliteId } = globeSettings;
    
    if (selectedSatelliteId) {
      const selected = filteredSatellites.find(sat => sat.id === selectedSatelliteId);
      return selected ? [selected] : [];
    }
    
    return filteredSatellites
      .filter(sat => sat?.position?.latitude && sat?.position?.longitude && sat?.position?.altitude)
      .slice(0, 500); // Reduced for performance
  }, [filteredSatellites, globeSettings.selectedSatelliteId]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} />
      
      <Earth />
      
      {visibleSatellites.map((satellite) => (
        <SatelliteMarker
          key={satellite.id}
          satellite={satellite}
          isSelected={globeSettings.selectedSatelliteId === satellite.id}
          onClick={() => {
            const newSelection = globeSettings.selectedSatelliteId === satellite.id ? null : satellite.id;
            setSelectedSatellite(newSelection);
          }}
        />
      ))}
    </>
  );
};

// Main Globe3D component
const Globe3D: React.FC = () => {
  return (
    <div className="h-full w-full bg-gradient-cosmic rounded-lg overflow-hidden">
      <ErrorBoundary>
        <Canvas
          camera={{ position: [12, 8, 12], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          performance={{ min: 0.5 }}
        >
          <Scene />
          <CameraController />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
};

export default Globe3D;