import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSatelliteStore } from '../stores/satelliteStore';
import { Satellite } from '../types/satellite.types';

// Earth component with realistic texture
const Earth: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Load real Earth texture
  const earthTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load('/earth-texture.jpg', undefined, undefined, (error) => {
      console.warn('Failed to load Earth texture, using fallback:', error);
    });
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001; // Slow realistic rotation
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 32]} />
      <meshPhongMaterial 
        map={earthTexture}
        shininess={0.1}
        transparent={false}
      />
    </mesh>
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
  
  // Convert lat/lon to 3D position with proper altitude scaling
  const position = useMemo(() => {
    const lat = (satellite.position.latitude * Math.PI) / 180;
    const lon = (satellite.position.longitude * Math.PI) / 180;
    
    // Earth radius is 1, satellites should be clearly visible above Earth
    const earthRadius = 1;
    const minAltitude = 0.1; // Minimum distance above Earth surface
    const maxAltitude = 1.5; // Maximum distance for very high satellites
    
    // Scale altitude: LEO satellites (400-2000km) should be close, GEO (35,000km) should be far
    let altitudeScale;
    if (satellite.orbital.altitude < 2000) {
      // Low Earth Orbit - scale from 0.1 to 0.3 above Earth
      altitudeScale = minAltitude + (satellite.orbital.altitude / 2000) * 0.2;
    } else if (satellite.orbital.altitude < 20000) {
      // Medium Earth Orbit - scale from 0.3 to 0.8
      altitudeScale = 0.3 + ((satellite.orbital.altitude - 2000) / 18000) * 0.5;
    } else {
      // Geostationary/High orbits - scale from 0.8 to 1.5
      altitudeScale = 0.8 + Math.min((satellite.orbital.altitude - 20000) / 20000, 0.7);
    }
    
    const radius = earthRadius + altitudeScale;
    
    const x = radius * Math.cos(lat) * Math.cos(lon);
    const y = radius * Math.sin(lat);
    const z = radius * Math.cos(lat) * Math.sin(lon);
    
    return [x, y, z] as [number, number, number];
  }, [satellite.position, satellite.orbital.altitude]);

  // Get color based on satellite type with better contrast
  const color = useMemo(() => {
    switch (satellite.type) {
      case 'space-station': return '#00d9ff'; // bright cyan
      case 'constellation': return '#3b82f6'; // blue
      case 'navigation': return '#fbbf24'; // amber
      case 'weather': return '#a855f7'; // purple
      case 'earth-observation': return '#10b981'; // emerald
      case 'communication': return '#06b6d4'; // cyan
      case 'scientific': return '#8b5cf6'; // violet
      case 'military': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  }, [satellite.type]);

  useFrame((state) => {
    if (markerRef.current) {
      // Pulsing effect for selected satellite
      if (isSelected) {
        const pulse = Math.sin(state.clock.getElapsedTime() * 4) * 0.3 + 1.2;
        markerRef.current.scale.setScalar(pulse);
      } else {
        markerRef.current.scale.setScalar(1);
      }
      
      // Billboard effect - always face camera
      markerRef.current.lookAt(state.camera.position);
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
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial 
          color={color} 
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* Glow effect for better visibility */}
      <mesh>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial 
          color={color} 
          transparent={true}
          opacity={0.3}
        />
      </mesh>
      
      {/* Orbital path visualization - only show when selected or globally enabled */}
      {(isSelected || globeSettings.showOrbits) && (
        <OrbitPath satellite={satellite} />
      )}
      
      {/* Satellite info on selection */}
      {isSelected && (
        <Html 
          position={[0.05, 0.05, 0]} 
          style={{ pointerEvents: 'none' }}
          distanceFactor={8}
        >
          <div className="bg-card/95 backdrop-blur border border-border rounded-lg p-3 text-xs min-w-52 shadow-lg">
            <div className="font-semibold text-foreground mb-1">{satellite.name}</div>
            <div className="text-muted-foreground space-y-1">
              <div>Alt: {satellite.orbital.altitude.toFixed(0)} km</div>
              <div>Vel: {satellite.orbital.velocity.toFixed(2)} km/s</div>
              <div>Pos: {satellite.position.latitude.toFixed(2)}°, {satellite.position.longitude.toFixed(2)}°</div>
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
  const orbitGeometry = useMemo(() => {
    const points = [];
    const earthRadius = 1;
    
    // Use same altitude scaling as satellites
    let altitudeScale;
    if (satellite.orbital.altitude < 2000) {
      altitudeScale = 0.1 + (satellite.orbital.altitude / 2000) * 0.2;
    } else if (satellite.orbital.altitude < 20000) {
      altitudeScale = 0.3 + ((satellite.orbital.altitude - 2000) / 18000) * 0.5;
    } else {
      altitudeScale = 0.8 + Math.min((satellite.orbital.altitude - 20000) / 20000, 0.7);
    }
    
    const radius = earthRadius + altitudeScale;
    const inclination = (satellite.orbital.inclination * Math.PI) / 180;
    
    // Create proper circular orbital path centered on Earth
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      
      // Create orbit in the XZ plane first, then apply inclination
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      const y = 0;
      
      // Apply orbital inclination rotation around X axis
      const rotatedY = y * Math.cos(inclination) - z * Math.sin(inclination);
      const rotatedZ = y * Math.sin(inclination) + z * Math.cos(inclination);
      
      points.push(x, rotatedY, rotatedZ);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    return geometry;
  }, [satellite.orbital.altitude, satellite.orbital.inclination]);

  return (
    <group>
      <primitive 
        object={new THREE.Line(orbitGeometry, new THREE.LineBasicMaterial({ 
          color: '#00d9ff', 
          transparent: true, 
          opacity: 0.6,
          linewidth: 1
        }))}
      />
    </group>
  );
};

// Main scene component with improved lighting and camera
const Scene: React.FC = () => {
  const { camera } = useThree();
  const { filteredSatellites, setSelectedSatellite, globeSettings } = useSatelliteStore();

  useEffect(() => {
    // Set better initial camera position
    camera.position.set(2.5, 1.5, 2.5);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      {/* Improved lighting setup */}
      <ambientLight intensity={0.3} color="#ffffff" />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={0.8} 
        color="#ffffff"
        castShadow
      />
      <directionalLight 
        position={[-5, -5, -5]} 
        intensity={0.3} 
        color="#3b82f6" 
      />
      <pointLight 
        position={[0, 0, 5]} 
        intensity={0.4} 
        color="#22d3ee" 
        distance={10}
      />
      
      {/* Earth with better material */}
      <Earth />
      
      {/* Satellites with improved rendering */}
      {filteredSatellites.map((satellite) => (
        <SatelliteMarker
          key={satellite.id}
          satellite={satellite}
          isSelected={globeSettings.selectedSatelliteId === satellite.id}
          onClick={() => setSelectedSatellite(satellite.id)}
        />
      ))}
      
      {/* Enhanced stars background */}
      <Stars />
    </>
  );
};

// Enhanced stars background
const Stars: React.FC = () => {
  const starsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(6000); // More stars
    const colors = new Float32Array(6000);
    
    for (let i = 0; i < 2000; i++) {
      // Random positions in a sphere around the scene
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Vary star colors - mostly white with some blue/yellow tints
      const colorVariation = Math.random();
      if (colorVariation < 0.1) {
        colors[i * 3] = 0.8; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0; // Blue
      } else if (colorVariation < 0.2) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.7; // Yellow
      } else {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0; // White
      }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, []);

  return (
    <points geometry={starsGeometry}>
      <pointsMaterial 
        size={0.8} 
        transparent 
        opacity={0.8} 
        vertexColors
        sizeAttenuation={false}
      />
    </points>
  );
};

// Main Globe3D component with improved controls
const Globe3D: React.FC = () => {
  return (
    <div className="h-full w-full bg-gradient-cosmic rounded-lg overflow-hidden relative">
      <div className="absolute inset-0">
        <Canvas
          camera={{ 
            position: [2.5, 1.5, 2.5], 
            fov: 75,
            near: 0.1,
            far: 1000
          }}
          style={{ background: 'transparent' }}
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance'
          }}
          onCreated={({ gl, camera }) => {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            gl.setClearColor('#000000', 0);
          }}
        >
          <Scene />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1.2}
            maxDistance={8}
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={0.5}
            zoomSpeed={0.8}
            panSpeed={0.5}
            maxPolarAngle={Math.PI}
            minPolarAngle={0}
          />
        </Canvas>
      </div>
    </div>
  );
};

export default Globe3D;