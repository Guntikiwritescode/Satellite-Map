import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { useSatelliteStore } from '../stores/satelliteStore';
import { Satellite } from '../types/satellite.types';
import ErrorBoundary from './ErrorBoundary';

// Earth component with slow realistic rotation
const Earth: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const earthRadius = 5;
  
  const earthTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load('/earth-texture.jpg');
  }, []);

  // Earth is now stationary - no rotation

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[earthRadius, 32, 16]} />
      <meshPhongMaterial map={earthTexture} />
    </mesh>
  );
};

// Real-time satellite marker at exact reported coordinates
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
  
  // Calculate EXACT position from real coordinates and altitude
  const position = useMemo(() => {
    const { latitude, longitude, altitude } = satellite.position;
    if (!latitude || !longitude || !altitude) return null;
    
    const earthRadius = 5;
    const lat = (latitude * Math.PI) / 180;
    const lon = (longitude * Math.PI) / 180;
    
    // Use EXACT altitude scaling: Earth radius = 6371km in real life, 5 units in scene
    const radius = earthRadius + (altitude * 5) / 6371;
    
    // Convert spherical coordinates to Cartesian (standard GPS to 3D conversion)
    const x = radius * Math.cos(lat) * Math.cos(lon);
    const y = radius * Math.sin(lat);
    const z = radius * Math.cos(lat) * Math.sin(lon);
    
    return [x, y, z] as [number, number, number];
  }, [satellite.position]);

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
      'military': '#ef4444',
      'commercial': '#f59e0b',
      'rocket-body': '#9ca3af'
    };
    return colors[satellite.type as keyof typeof colors] || '#6b7280';
  }, [satellite.type]);

  // Simple pulsing animation for selected satellites only
  useFrame((state) => {
    if (meshRef.current && isSelected) {
      const pulse = Math.sin(state.clock.getElapsedTime() * 3) * 0.1 + 1.0;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  if (!position) return null;

  return (
    <group position={position}>
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

// Orbital path component for selected satellite
interface OrbitalPathProps {
  satellite: Satellite;
}

const OrbitalPath: React.FC<OrbitalPathProps> = ({ satellite: sat }) => {
  const pathPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const earthRadius = 5;
    
    try {
      const satrec = satellite.twoline2satrec(sat.tle.line1, sat.tle.line2);
      const now = new Date();
      const period = sat.orbital.period; // minutes
      const totalPoints = 100;
      
      for (let i = 0; i <= totalPoints; i++) {
        const timeOffset = (i / totalPoints) * period * 60 * 1000; // convert to milliseconds
        const time = new Date(now.getTime() + timeOffset);
        
        const positionAndVelocity = satellite.propagate(satrec, time);
        
        if (positionAndVelocity.position && typeof positionAndVelocity.position === 'object') {
          const positionEci = positionAndVelocity.position as any;
          const gmst = satellite.gstime(time);
          const positionGd = satellite.eciToGeodetic(positionEci, gmst);
          
          const longitude = satellite.degreesLong(positionGd.longitude);
          const latitude = satellite.degreesLat(positionGd.latitude);
          const altitude = positionGd.height;
          
          if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(altitude)) {
            const lat = (latitude * Math.PI) / 180;
            const lon = (longitude * Math.PI) / 180;
            const radius = earthRadius + (altitude * 5) / 6371;
            
            const x = radius * Math.cos(lat) * Math.cos(lon);
            const y = radius * Math.sin(lat);
            const z = radius * Math.cos(lat) * Math.sin(lon);
            
            points.push(new THREE.Vector3(x, y, z));
          }
        }
      }
    } catch (error) {
      console.warn('Error calculating orbital path:', error);
    }
    
    return points;
  }, [sat]);

  if (pathPoints.length === 0) return null;

  return (
    <group>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={pathPoints.length}
            array={new Float32Array(pathPoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00d9ff" opacity={0.6} transparent />
      </lineSegments>
    </group>
  );
};

// Camera controller for focusing on selected satellites
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
      return;
    }

    // Find selected satellite and focus on its REAL position
    const selectedSatellite = filteredSatellites.find(
      sat => sat.id === globeSettings.selectedSatelliteId
    );
    
    if (selectedSatellite && controlsRef.current) {
      const { latitude, longitude, altitude } = selectedSatellite.position;
      if (!latitude || !longitude || !altitude) return;
      
      // Calculate satellite's EXACT real position
      const earthRadius = 5;
      const lat = (latitude * Math.PI) / 180;
      const lon = (longitude * Math.PI) / 180;
      const radius = earthRadius + (altitude * 5) / 6371;
      
      const satellitePosition = new THREE.Vector3(
        radius * Math.cos(lat) * Math.cos(lon),
        radius * Math.sin(lat),
        radius * Math.cos(lat) * Math.sin(lon)
      );
      
      // Position camera to get good view of satellite
      const offset = satellitePosition.clone().normalize().multiplyScalar(2);
      const cameraPosition = satellitePosition.clone().add(offset);
      
      // Smooth transition to satellite's real location
      const startPosition = camera.position.clone();
      const startTarget = controlsRef.current.target.clone();
      
      let progress = 0;
      const animate = () => {
        progress += 0.03;
        if (progress <= 1) {
          camera.position.lerpVectors(startPosition, cameraPosition, progress);
          controlsRef.current.target.lerpVectors(startTarget, satellitePosition, progress);
          controlsRef.current.update();
          requestAnimationFrame(animate);
        }
      };
      animate();
    }
  }, [globeSettings.selectedSatelliteId, camera]);

  return (
    <OrbitControls 
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={0.1}
      maxDistance={200}
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
      .slice(0, 1000); // Performance limit
  }, [filteredSatellites, globeSettings.selectedSatelliteId]);

  const selectedSatellite = useMemo(() => {
    if (!globeSettings.selectedSatelliteId) return null;
    return filteredSatellites.find(sat => sat.id === globeSettings.selectedSatelliteId);
  }, [filteredSatellites, globeSettings.selectedSatelliteId]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} />
      
      <Earth />
      
      {/* Show orbital path for selected satellite */}
      {selectedSatellite && <OrbitalPath satellite={selectedSatellite} />}
      
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