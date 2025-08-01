import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useSatelliteStore } from '../stores/satelliteStore';
import { Satellite } from '../types/satellite.types';
import ErrorBoundary from './ErrorBoundary';

// Earth component with realistic texture and proper scaling
const Earth: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Scale Earth to be proportional to satellites with visibility multiplier
  const earthRadius = 5; // Increased from 1 to be more proportional to scaled satellites
  
  // Load real Earth texture
  const earthTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load('/earth-texture.jpg', undefined, undefined, (error) => {
      console.warn('Failed to load Earth texture, using fallback:', error);
    });
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      // Earth rotates 360 degrees in 24 hours = 0.25 degrees per minute = 0.004167 degrees per second
      // In our 60fps animation, that's 0.004167/60 = 0.0000694 radians per frame
      meshRef.current.rotation.y += 0.0000694; // Realistic Earth rotation speed
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[earthRadius, 64, 32]} />
      <meshPhongMaterial 
        map={earthTexture}
        shininess={0.1}
        transparent={false}
      />
    </mesh>
  );
};

// Individual satellite component with distance-based scaling
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
  const markerRef = useRef<THREE.Mesh>(null);
  const modelRef = useRef<THREE.Group>(null);
  const { globeSettings } = useSatelliteStore();
  const [isVisible, setIsVisible] = React.useState(true);
  
  // Calculate satellite position from REAL TLE data - no fallbacks
  const position = useMemo(() => {
    const earthRadius = 5;
    
    // Only use real position data from TLE calculations
    if (!satellite?.position?.latitude || !satellite?.position?.longitude || !satellite?.position?.altitude) {
      console.warn('Missing real position data for satellite:', satellite?.id);
      return null; // Don't render satellites without real data
    }
    
    const lat = (satellite.position.latitude * Math.PI) / 180;
    const lon = (satellite.position.longitude * Math.PI) / 180;
    
    // Use real altitude with minimal scaling for visibility
    const altitudeScale = Math.max(0.01, satellite.position.altitude / 50000);
    const radius = earthRadius + altitudeScale;
    
    const x = radius * Math.cos(lat) * Math.cos(lon);
    const y = radius * Math.sin(lat);
    const z = radius * Math.cos(lat) * Math.sin(lon);
    
    return [x, y, z] as [number, number, number];
  }, [satellite.position?.latitude, satellite.position?.longitude, satellite.position?.altitude]);

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

  // Real-world satellite scaling helper with visibility multiplier
  const getRealWorldScale = (satelliteType: string) => {
    // Real satellite dimensions (in meters) vs Earth radius (6371000m)
    // Our Earth in scene has radius = 1, so scale factor = 1 / 6371000
    const earthRadiusMeters = 6371000;
    const scaleToScene = 1 / earthRadiusMeters;
    
    // Visibility multiplier to make satellites actually visible at scale
    // This represents a compromise between realism and visibility
    const visibilityMultiplier = 5000; // Makes satellites visible while maintaining proportions
    
    // Real satellite dimensions in meters
    const satelliteDimensions = {
      'space-station': { length: 108, width: 51, height: 20 }, // ISS
      'constellation': { length: 5.4, width: 2.9, height: 1.6 }, // Starlink
      'navigation': { length: 6.5, width: 6.5, height: 3.0 }, // GPS satellite
      'communication': { length: 7, width: 7, height: 3.5 }, // Typical comsat
      'weather': { length: 4, width: 4, height: 6 }, // Weather satellite
      'earth-observation': { length: 8, width: 4, height: 3 }, // Landsat-like
      'scientific': { length: 13.3, width: 4.3, height: 4.3 }, // Hubble
      'military': { length: 6, width: 6, height: 4 }, // Generic military
    };
    
    const dims = satelliteDimensions[satelliteType as keyof typeof satelliteDimensions] || 
                 satelliteDimensions['constellation'];
    
    return {
      x: dims.length * scaleToScene * visibilityMultiplier,
      y: dims.height * scaleToScene * visibilityMultiplier,
      z: dims.width * scaleToScene * visibilityMultiplier
    };
  };

  // ISS 3D Model Component
  const ISSModel: React.FC = () => {
    try {
      const { scene } = useGLTF('/src/assets/models/iss.glb');
      const groupRef = useRef<THREE.Group>(null);
      const scale = getRealWorldScale('space-station');
      
      useFrame((state) => {
        if (groupRef.current) {
          // Use time-based rotation to prevent resetting when position updates
          // ISS rotates at about 4 RPM = 0.4188 rad/min = 0.006981 rad/s
          groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.006981;
        }
      });

      return (
        <group ref={groupRef} scale={[scale.x, scale.y, scale.z]}>
          <primitive object={scene.clone()} />
        </group>
      );
    } catch (error) {
      console.warn('Failed to load ISS model, using fallback');
      // Fallback to procedural ISS model
      const groupRef = useRef<THREE.Group>(null);
      
      useFrame((state) => {
        if (groupRef.current) {
          groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.006981;
        }
      });
      
      return (
        <group ref={groupRef} scale={[getRealWorldScale('space-station').x, getRealWorldScale('space-station').y, getRealWorldScale('space-station').z]}>
          <mesh>
            <boxGeometry args={[2, 0.4, 1]} />
            <meshPhongMaterial color={color} />
          </mesh>
          <mesh position={[-2.5, 0, 0]}>
            <boxGeometry args={[2, 0.1, 1.5]} />
            <meshPhongMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[2.5, 0, 0]}>
            <boxGeometry args={[2, 0.1, 1.5]} />
            <meshPhongMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
          </mesh>
        </group>
      );
    }
  };

  // Create realistic 3D satellite models based on type with real-world scaling
  const SatelliteModel: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);
    const scale = getRealWorldScale(satellite.type);
    
    useFrame((state) => {
      if (groupRef.current) {
        // Use time-based rotation to prevent janky resets on position updates
        // Different satellites rotate at different speeds for realism
        const rotationSpeed = satellite.type === 'space-station' ? 0.006981 : 0.02; // rad/s
        groupRef.current.rotation.y = state.clock.getElapsedTime() * rotationSpeed;
      }
    });

    // Use real ISS model for space stations
    if (satellite.type === 'space-station') {
      return <ISSModel />;
    }

    switch (satellite.type) {
      case 'constellation': // Starlink-like
        return (
          <group ref={groupRef} scale={[scale.x, scale.y, scale.z]}>
            {/* Main body - flat rectangular */}
            <mesh>
              <boxGeometry args={[1, 0.3, 0.6]} />
              <meshPhongMaterial color={color} />
            </mesh>
            {/* Solar panel array */}
            <mesh position={[0, 0, 0.8]}>
              <boxGeometry args={[0.8, 0.05, 1.2]} />
              <meshPhongMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
            </mesh>
          </group>
        );
      
      case 'communication':
        return (
          <group ref={groupRef} scale={[scale.x, scale.y, scale.z]}>
            {/* Main cylindrical body */}
            <mesh>
              <cylinderGeometry args={[0.5, 0.5, 1]} />
              <meshPhongMaterial color={color} />
            </mesh>
            {/* Large dish antenna */}
            <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 6, 0, 0]}>
              <cylinderGeometry args={[0.6, 0.6, 0.1]} />
              <meshPhongMaterial color="#e5e7eb" />
            </mesh>
            {/* Solar panels */}
            <mesh position={[-1.2, 0, 0]}>
              <boxGeometry args={[1.5, 0.05, 1]} />
              <meshPhongMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[1.2, 0, 0]}>
              <boxGeometry args={[1.5, 0.05, 1]} />
              <meshPhongMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
            </mesh>
          </group>
        );
      
      case 'scientific': // Hubble-like
        return (
          <group ref={groupRef} scale={[scale.x, scale.y, scale.z]}>
            {/* Main telescope tube */}
            <mesh>
              <cylinderGeometry args={[0.4, 0.4, 1]} />
              <meshPhongMaterial color="#f3f4f6" />
            </mesh>
            {/* Solar panels */}
            <mesh position={[-1, 0, 0]}>
              <boxGeometry args={[1.2, 0.05, 2]} />
              <meshPhongMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[1, 0, 0]}>
              <boxGeometry args={[1.2, 0.05, 2]} />
              <meshPhongMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
            </mesh>
          </group>
        );
      
      default: // Generic satellite
        return (
          <group ref={groupRef} scale={[scale.x, scale.y, scale.z]}>
            {/* Main body */}
            <mesh>
              <boxGeometry args={[1, 1, 1.5]} />
              <meshPhongMaterial color={color} />
            </mesh>
            {/* Solar panels */}
            <mesh position={[-1.2, 0, 0]}>
              <boxGeometry args={[1.5, 0.1, 1]} />
              <meshPhongMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[1.2, 0, 0]}>
              <boxGeometry args={[1.5, 0.1, 1]} />
              <meshPhongMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
            </mesh>
          </group>
        );
    }
  };

  const [cameraDistance, setCameraDistance] = React.useState(10);

  // Optimized frame updates - reduced frequency for better performance
  useFrame((state) => {
    if (!markerRef.current) return;

    const currentDistance = state.camera.position.distanceTo(new THREE.Vector3(...position));
    
    // Update only every 30th frame for performance
    const frameCount = Math.floor(state.clock.getElapsedTime() * 60);
    if (frameCount % 30 !== 0) return;
    
    setCameraDistance(currentDistance);
    
    // Simple distance-based visibility culling
    const maxRenderDistance = 150;
    const shouldRender = currentDistance < maxRenderDistance;
    setIsVisible(shouldRender);
    
    if (!shouldRender) {
      markerRef.current.visible = false;
      if (modelRef.current) modelRef.current.visible = false;
      return;
    }
    
    if (markerRef.current && modelRef.current) {
      // Simple scaling based on distance
      const baseScale = Math.max(0.02, Math.min(1.0, currentDistance * 0.3));
      
      // Only show 3D model when very close
      const showModel = currentDistance < 0.1;
      
      markerRef.current.visible = !showModel;
      modelRef.current.visible = showModel;
      
      if (showModel) {
        modelRef.current.scale.setScalar(1.0);
      } else {
        // Simple pulsing for selected satellite
        if (isSelected) {
          const pulse = Math.sin(state.clock.getElapsedTime() * 3) * 0.1 + 1.0;
          markerRef.current.scale.setScalar(baseScale * pulse);
        } else {
          markerRef.current.scale.setScalar(baseScale);
        }
        
        // Less frequent billboard updates
        if (frameCount % 60 === 0) {
          markerRef.current.lookAt(state.camera.position);
        }
      }
    }
  });

  // Don't render if position is null (no real TLE data)
  if (!position) return null;
  
  // Don't render if not visible (performance optimization)
  if (!isVisible) return null;

  return (
    <group position={position}>
      {/* Distance-based marker (circles) - optimized geometry */}
      <mesh
        ref={markerRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshBasicMaterial 
          color={color} 
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* Simple glow effect only for selected satellites */}
      {isSelected && (
        <mesh>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshBasicMaterial 
            color={color} 
            transparent={true}
            opacity={0.4}
          />
        </mesh>
      )}
      
      {/* 3D satellite model when zoomed in close */}
      <group 
        ref={modelRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <SatelliteModel />
      </group>
    </group>
  );
});



// Optimized scene component
const Scene: React.FC = () => {
  const { filteredSatellites, setSelectedSatellite, globeSettings } = useSatelliteStore();

  // Optimized satellite filtering with performance limits
  const visibleSatellites = useMemo(() => {
    const { selectedSatelliteId } = globeSettings;
    
    // If a satellite is selected, only show that one
    if (selectedSatelliteId) {
      const selectedSat = filteredSatellites.find(sat => sat.id === selectedSatelliteId);
      return selectedSat && 
        selectedSat?.position?.latitude != null && 
        selectedSat?.position?.longitude != null && 
        selectedSat?.position?.altitude != null 
        ? [selectedSat] 
        : [];
    }
    
    // Show all satellites with valid data (limit to 2000 for performance)
    const satellitesWithValidData = filteredSatellites.filter(sat => 
      sat?.position?.latitude != null && 
      sat?.position?.longitude != null && 
      sat?.position?.altitude != null
    );
    
    return satellitesWithValidData.slice(0, 2000); // Reduced from 5000
  }, [filteredSatellites, globeSettings.selectedSatelliteId]);

  return (
    <>
      {/* Simplified lighting setup */}
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={0.7} 
        color="#ffffff"
      />
      
      {/* Earth */}
      <Earth />
      
      {/* Satellites with improved rendering - filtered by selection */}
      {visibleSatellites.map((satellite) => (
        <SatelliteMarker
          key={satellite.id}
          satellite={satellite}
          isSelected={globeSettings.selectedSatelliteId === satellite.id}
          onClick={() => {
            // Toggle selection: if clicking the same satellite, deselect it
            if (globeSettings.selectedSatelliteId === satellite.id) {
              setSelectedSatellite(null);
            } else {
              setSelectedSatellite(satellite.id);
            }
          }}
        />
      ))}
      
      
      {/* Stars background removed */}
    </>
  );
};

// Optimized stars background
const Stars: React.FC = () => {
  const starsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(3000); // Reduced from 6000
    
    for (let i = 0; i < 1000; i++) { // Reduced from 2000
      const radius = 50 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  return (
    <points geometry={starsGeometry}>
      <pointsMaterial 
        size={0.5} 
        transparent 
        opacity={0.6} 
        color="#ffffff"
        sizeAttenuation={false}
      />
    </points>
  );
};

// Optimized Globe3D component
const Globe3D: React.FC = () => {
  return (
    <div className="h-full w-full bg-gradient-cosmic rounded-lg overflow-hidden relative">
      <div className="absolute inset-0">
        <Canvas
          camera={{ 
            position: [12, 8, 12], 
            fov: 45,
            near: 0.1,
            far: 1000
          }}
          gl={{ 
            antialias: false, // Disabled for performance
            alpha: false,
            powerPreference: "high-performance"
          }}
          performance={{ min: 0.8 }} // Maintain good framerate
        >
          <Suspense fallback={null}>
            <ErrorBoundary fallback={<mesh><boxGeometry /><meshBasicMaterial color="red" /></mesh>}>
              <Scene />
              <OrbitControls 
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={6}
                maxDistance={50}
                autoRotate={false}
              />
            </ErrorBoundary>
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
};

export default Globe3D;