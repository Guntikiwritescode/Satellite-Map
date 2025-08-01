import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useSatelliteStore } from '../stores/satelliteStore';
import { Satellite } from '../types/satellite.types';

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
  
  // Calculate satellite's actual 3D position using real-time altitude data
  const position = useMemo(() => {
    const earthRadius = 5; // Updated to match new Earth radius
    const earthRadiusKm = 6371;
    
    // Validate input data
    if (!satellite?.position || !satellite?.orbital) {
      console.warn('Missing position or orbital data for satellite:', satellite?.id);
      return [0, earthRadius + 1, 0] as [number, number, number];
    }
    
    // Use REAL altitude from TLE calculation, not the orbital.altitude fallback
    const realAltitudeKm = satellite.position.altitude || satellite.orbital.altitude || 400;
    const period = satellite.orbital.period || 90;
    const inclination = satellite.orbital.inclination || 0;
    
    // Convert real altitude to 3D scene scale
    const orbitalRadiusKm = earthRadiusKm + realAltitudeKm;
    const orbitalRadius = (orbitalRadiusKm / earthRadiusKm) * earthRadius; // Scale to Earth size
    const safeOrbitalRadius = Math.max(orbitalRadius, earthRadius + 0.1); // Prevent intersection with Earth
    
    // Get orbital inclination
    const inclinationRad = (inclination * Math.PI) / 180;
    
    // Calculate satellite's position along its orbital path
    // Use current time and satellite's orbital period to determine where it is on the orbit
    const time = Date.now() / 1000;
    const orbitPeriodSeconds = period * 60; // Convert minutes to seconds
    const orbitSpeed = (2 * Math.PI) / orbitPeriodSeconds; // radians per second
    
    // Add satellite-specific offset based on its ID for distribution
    const satelliteIdNum = parseInt(satellite.id) || 0;
    const satelliteOffset = (satelliteIdNum % 1000) / 1000 * Math.PI * 2;
    const angle = (time * orbitSpeed + satelliteOffset) % (Math.PI * 2);
    
    // Position on orbital path at the REAL altitude
    let x = safeOrbitalRadius * Math.cos(angle);
    let y = 0;
    let z = safeOrbitalRadius * Math.sin(angle);
    
    // Apply inclination rotation
    const newY = y * Math.cos(inclinationRad) - z * Math.sin(inclinationRad);
    const newZ = y * Math.sin(inclinationRad) + z * Math.cos(inclinationRad);
    
    // Validate final position
    const finalPos = [x, newY, newZ] as [number, number, number];
    
    // Check for NaN values and log them
    if (isNaN(finalPos[0]) || isNaN(finalPos[1]) || isNaN(finalPos[2])) {
      console.error('Invalid position calculated for satellite:', satellite.id, {
        position: finalPos,
        realAltitude: realAltitudeKm,
        fallbackAltitude: satellite.orbital.altitude,
        period: period,
        inclination: inclination,
        orbitalRadius: safeOrbitalRadius,
        angle: angle
      });
      return [0, earthRadius + 1, 0] as [number, number, number];
    }
    
    return finalPos;
  }, [satellite.id, satellite.position?.altitude, satellite.orbital?.altitude, satellite.orbital?.inclination, satellite.orbital?.period]);

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

  // Optimize frame updates with distance-based LOD and performance improvements
  useFrame((state) => {
    if (!markerRef.current) return;

    const currentDistance = state.camera.position.distanceTo(new THREE.Vector3(...position));
    
    // Performance optimization: Only update if distance changed significantly or every 10th frame
    const frameCount = state.clock.getElapsedTime() * 60; // Approximate frame count
    const shouldUpdate = Math.abs(currentDistance - cameraDistance) > 1.0 || frameCount % 10 === 0;
    
    if (!shouldUpdate) return;
    
    if (Math.abs(currentDistance - cameraDistance) > 1.0) {
      setCameraDistance(currentDistance);
    }
    
    // Aggressive distance-based visibility culling for 1000 satellites
    const maxRenderDistance = 200; // Increased for better viewing
    const shouldRender = currentDistance < maxRenderDistance;
    setIsVisible(shouldRender);
    
    if (!shouldRender) {
      markerRef.current.visible = false;
      if (modelRef.current) modelRef.current.visible = false;
      return;
    }
    
    if (markerRef.current && modelRef.current) {
      // Distance-based scaling for marker - scales down as you get closer
      const baseScale = Math.max(0.01, Math.min(1.5, currentDistance * 0.5));
      
      // Show 3D model only when EXTREMELY close - realistic satellite scale
      const showModel = currentDistance < 0.05;
      
      // Performance: Use simple visibility toggle
      markerRef.current.visible = !showModel;
      modelRef.current.visible = showModel;
      
      
      if (showModel) {
        // Keep 3D model at fixed scale when viewing it
        const fixedModelScale = 1.0;
        modelRef.current.scale.setScalar(fixedModelScale);
      } else {
        // Optimized pulsing effect for selected satellite (reduced frequency)
        if (isSelected) {
          const pulse = Math.sin(state.clock.getElapsedTime() * 2) * 0.2 + 1.1; // Reduced intensity
          markerRef.current.scale.setScalar(baseScale * pulse);
        } else {
          markerRef.current.scale.setScalar(baseScale);
        }
        
        // Billboard effect - always face camera (less frequent updates for performance)
        // Update every 15th frame for 1000 satellites
        if (frameCount % 15 === 0) {
          markerRef.current.lookAt(state.camera.position);
        }
      }
    }
  });

  // Don't render if not visible (performance optimization)
  if (!isVisible) return null;

  return (
    <group position={position}>
      {/* Distance-based marker (circles) - optimized geometry */}
      <mesh
        ref={markerRef}
        onClick={(e) => {
          e.stopPropagation();
          try {
            onClick();
          } catch (error) {
            console.error('Error selecting satellite:', error);
          }
        }}
      >
        <sphereGeometry args={[0.015, 4, 4]} />  {/* Reduced geometry complexity */}
        <meshBasicMaterial 
          color={color} 
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* Simplified glow effect for better performance with 1000 satellites */}
      {(isSelected || cameraDistance < 20) && (
        <mesh>
          <sphereGeometry args={[0.025, 4, 4]} />  {/* Reduced geometry complexity */}
          <meshBasicMaterial 
            color={color} 
            transparent={true}
            opacity={0.3}
          />
        </mesh>
      )}
      
      {/* 3D satellite model when zoomed in close */}
      <group 
        ref={modelRef}
        onClick={(e) => {
          e.stopPropagation();
          try {
            onClick();
          } catch (error) {
            console.error('Error selecting satellite model:', error);
          }
        }}
      >
        <SatelliteModel />
      </group>
      
      {/* Simple selection indicator - only when selected */}
      {isSelected && (
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshBasicMaterial 
            color="#ffffff" 
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
});

// Orbital path component
interface OrbitPathProps {
  satellite: Satellite;
}

const OrbitPath: React.FC<OrbitPathProps> = ({ satellite }) => {
  // Create stable orbital path geometry - updated for new Earth scaling
  const orbitGeometry = useMemo(() => {
    const points = [];
    const earthRadius = 5; // Updated to match new Earth radius
    const earthRadiusKm = 6371;
    
    // Validate orbital data
    if (!satellite?.orbital) {
      console.warn('Missing orbital data for orbit path:', satellite?.id);
      return new THREE.BufferGeometry();
    }
    
    // Use REAL altitude from position data, same as SatelliteMarker
    const realAltitudeKm = satellite.position?.altitude || satellite.orbital.altitude || 400;
    const inclination = satellite.orbital.inclination || 0;
    
    const orbitalRadiusKm = earthRadiusKm + realAltitudeKm;
    const orbitalRadius = (orbitalRadiusKm / earthRadiusKm) * earthRadius; // Scale to new Earth size
    const safeOrbitalRadius = Math.max(orbitalRadius, earthRadius + 0.1); // Prevent intersection with Earth
    
    const inclinationRad = (inclination * Math.PI) / 180;
    
    const numPoints = 128;
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      
      let x = safeOrbitalRadius * Math.cos(angle);
      let y = 0;
      let z = safeOrbitalRadius * Math.sin(angle);
      
      const newY = y * Math.cos(inclinationRad) - z * Math.sin(inclinationRad);
      const newZ = y * Math.sin(inclinationRad) + z * Math.cos(inclinationRad);
      
      // Validate calculated points
      if (!isNaN(x) && !isNaN(newY) && !isNaN(newZ)) {
        points.push(x, newY, newZ);
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    if (points.length > 0) {
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    }
    return geometry;
  }, [satellite.id, satellite.orbital?.altitude, satellite.orbital?.inclination]); // Added orbital deps

  // Stable color based on satellite type  
  const orbitColor = useMemo(() => {
    switch (satellite.type) {
      case 'space-station': return '#00d9ff';
      case 'constellation': return '#3b82f6';
      case 'navigation': return '#fbbf24';
      case 'weather': return '#a855f7';
      case 'earth-observation': return '#10b981';
      case 'communication': return '#06b6d4';
      case 'scientific': return '#8b5cf6';
      case 'military': return '#ef4444';
      default: return '#6b7280';
    }
  }, [satellite.type]);

  return (
    <group>
      <primitive 
        object={new THREE.Line(orbitGeometry, new THREE.LineBasicMaterial({ 
          color: orbitColor, 
          transparent: true, 
          opacity: 0.4
        }))}
      />
    </group>
  );
};

// Camera focus controller component with collision detection
const CameraFocusController: React.FC = () => {
  const controlsRef = useRef<any>(null);
  const { filteredSatellites, globeSettings } = useSatelliteStore();

  // Handle camera focus changes when satellite selection changes
  useEffect(() => {
    if (!controlsRef.current) return;
    
    if (globeSettings.selectedSatelliteId) {
      const selectedSatellite = filteredSatellites.find(sat => sat.id === globeSettings.selectedSatelliteId);
      if (selectedSatellite?.orbital) {
        try {
          // Calculate satellite position for camera focus - updated for new Earth scaling
          const earthRadius = 5; // Updated to match new Earth radius
          const earthRadiusKm = 6371;
          const altitudeKm = selectedSatellite.orbital.altitude || 400;
          const period = selectedSatellite.orbital.period || 90;
          const inclination = selectedSatellite.orbital.inclination || 0;
          
          const orbitalRadiusKm = earthRadiusKm + altitudeKm;
          const orbitalRadius = (orbitalRadiusKm / earthRadiusKm) * earthRadius; // Scale to new Earth size
          const safeOrbitalRadius = Math.max(orbitalRadius, earthRadius + 0.1);
          
          const inclinationRad = (inclination * Math.PI) / 180;
          const time = Date.now() / 1000;
          const orbitPeriodSeconds = period * 60;
          const orbitSpeed = (2 * Math.PI) / orbitPeriodSeconds;
          const satelliteIdNum = parseInt(selectedSatellite.id) || 0;
          const satelliteOffset = (satelliteIdNum % 1000) / 1000 * Math.PI * 2;
          const angle = (time * orbitSpeed + satelliteOffset) % (Math.PI * 2);
          
          let x = safeOrbitalRadius * Math.cos(angle);
          let y = 0;
          let z = safeOrbitalRadius * Math.sin(angle);
          
          const newY = y * Math.cos(inclinationRad) - z * Math.sin(inclinationRad);
          const newZ = y * Math.sin(inclinationRad) + z * Math.cos(inclinationRad);
          
          // Validate position before setting camera target
          if (!isNaN(x) && !isNaN(newY) && !isNaN(newZ)) {
            // Smoothly transition camera focus to satellite
            controlsRef.current.target.set(x, newY, newZ);
            controlsRef.current.update();
          } else {
            console.warn('Invalid camera target position for satellite:', selectedSatellite.id);
            // Return focus to Earth center as fallback
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
          }
        } catch (error) {
          console.error('Error calculating camera focus position:', error);
          // Return focus to Earth center as fallback
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }
    } else {
      // Return focus to Earth center
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [globeSettings.selectedSatelliteId, filteredSatellites]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={0.1} // Increased from 0.001 to prevent camera issues
      maxDistance={200} // Much further zoom out for system overview
      enableDamping={true}
      dampingFactor={0.05}
      rotateSpeed={0.5}
      zoomSpeed={1.2} // Faster zoom speed for better UX
      panSpeed={0.8} // Faster pan speed
      maxPolarAngle={Math.PI}
      minPolarAngle={0}
    />
  );
};

// Main scene component with improved lighting and camera
const Scene: React.FC = () => {
  const { camera } = useThree();
  const { filteredSatellites, setSelectedSatellite, globeSettings } = useSatelliteStore();

  useEffect(() => {
    // Set better initial camera position for new Earth scale (radius = 5)
    camera.position.set(12, 8, 12); // Adjusted for larger Earth
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Filter satellites based on selection - render all satellites with optimizations
  const visibleSatellites = useMemo(() => {
    if (globeSettings.selectedSatelliteId) {
      // When a satellite is selected, show only that satellite
      return filteredSatellites.filter(sat => sat.id === globeSettings.selectedSatelliteId);
    }
    // When no satellite is selected, show all filtered satellites (optimized rendering)
    return filteredSatellites;
  }, [filteredSatellites, globeSettings.selectedSatelliteId]);

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
      
      {/* Orbital paths - rendered separately and centered on Earth */}
      {visibleSatellites.map((satellite) => {
        const isSelected = globeSettings.selectedSatelliteId === satellite.id;
        return (globeSettings.showOrbits || isSelected) && (
          <OrbitPath key={`orbit-${satellite.id}`} satellite={satellite} />
        );
      })}
      
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
            position: [12, 8, 12], // Updated for new Earth scale (radius = 5)
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
          <CameraFocusController />
        </Canvas>
      </div>
    </div>
  );
};

export default Globe3D;