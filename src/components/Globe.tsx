import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { gstime, jday, json2satrec, sunPos } from 'satellite.js';
import { live, matches, set, useStore } from '../store.ts';
import { CATEGORIES, eciToScene, propagateAt, type Sat } from '../lib/satellites.ts';

function sunDirection(date: Date) {
  const [x, y, z] = sunPos(jday(date)).rsun;
  const p = [0, 0, 0];
  eciToScene({ x, y, z }, p);
  return new THREE.Vector3(p[0], p[1], p[2]).normalize();
}

function StartView() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.position.copy(sunDirection(new Date()).setY(0.35).setLength(3.4));
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

function Earth() {
  const dayNight = useStore((s) => s.dayNight);
  const texture = useLoader(THREE.TextureLoader, '/earth.jpg');
  const earth = useRef<THREE.Mesh>(null);
  const sun = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame(() => {
    const now = new Date();
    if (earth.current) earth.current.rotation.y = gstime(now);
    if (sun.current) sun.current.position.copy(sunDirection(now).multiplyScalar(10));
  });

  return (
    <>
      <ambientLight intensity={dayNight ? 0.35 : 1.2} />
      <directionalLight ref={sun} intensity={dayNight ? 2.4 : 0} />
      <mesh ref={earth} onClick={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()}>
        <sphereGeometry args={[1, 128, 64]} />
        <meshStandardMaterial map={texture} roughness={1} />
      </mesh>
    </>
  );
}

function dotTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.arc(16, 16, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

function hasPosition(index: number) {
  const p = live.positions;
  return p[index * 3] !== 0 || p[index * 3 + 1] !== 0 || p[index * 3 + 2] !== 0;
}

function positionOf(index: number): [number, number, number] {
  const p = live.positions;
  return [p[index * 3], p[index * 3 + 1], p[index * 3 + 2]];
}

function Satellites() {
  const sats = useStore((s) => s.sats);
  const filters = useStore((s) => s.filters);
  const selectedId = useStore((s) => s.selectedId);
  const tick = useStore((s) => s.tick);
  const [hovered, setHovered] = useState<number | null>(null);
  const { raycaster, camera } = useThree();
  const texture = useMemo(dotTexture, []);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const position = new THREE.BufferAttribute(new Float32Array(sats.length * 3), 3);
    position.setUsage(THREE.DynamicDrawUsage);
    const colors = new Float32Array(sats.length * 3);
    const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c.id, new THREE.Color(c.color)]));
    sats.forEach((sat, i) => byCategory[sat.category].toArray(colors, i * 3));
    g.setAttribute('position', position);
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
    return g;
  }, [sats]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  // the index holds only the shown satellites, so hidden ones are not drawn or clickable
  useEffect(() => {
    const shown: number[] = [];
    sats.forEach((sat, i) => {
      if (selectedId === null ? matches(sat, filters) : sat.id === selectedId) shown.push(i);
    });
    geometry.setIndex(shown);
  }, [sats, filters, selectedId, geometry]);

  useEffect(() => {
    if (live.positions.length !== sats.length * 3) return;
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
    (attr.array as Float32Array).set(live.positions);
    attr.needsUpdate = true;
  }, [tick, geometry, sats.length]);

  useFrame(() => {
    raycaster.params.Points = { threshold: camera.position.length() * 0.006 };
  });

  const showHover = hovered !== null && hovered < sats.length && sats[hovered].id !== selectedId && hasPosition(hovered);

  return (
    <>
      <points
        geometry={geometry}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.index !== undefined) set({ selectedId: sats[e.index].id });
        }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered(e.index ?? null);
        }}
        onPointerOut={() => setHovered(null)}
      >
        <pointsMaterial size={4} sizeAttenuation={false} vertexColors map={texture} alphaTest={0.5} />
      </points>
      {showHover && (
        <Html position={positionOf(hovered)} style={{ pointerEvents: 'none' }}>
          <div className="label">{sats[hovered].name}</div>
        </Html>
      )}
    </>
  );
}

function orbitPath(sat: Sat, start: number) {
  const satrec = json2satrec(sat.omm);
  const points: [number, number, number][] = [];
  for (let i = 0; i <= 240; i++) {
    const pv = propagateAt(satrec, new Date(start + (i / 240) * sat.period * 60000));
    if (!pv) continue;
    const p: [number, number, number] = [0, 0, 0];
    eciToScene(pv.position, p);
    points.push(p);
  }
  return points;
}

function Selected() {
  const sats = useStore((s) => s.sats);
  const selectedId = useStore((s) => s.selectedId);
  const tick = useStore((s) => s.tick);
  const index = useMemo(() => sats.findIndex((s) => s.id === selectedId), [sats, selectedId]);
  const sat = index >= 0 ? sats[index] : undefined;
  const minute = Math.floor(tick / 60000);
  const path = useMemo(() => (sat ? orbitPath(sat, minute * 60000) : []), [sat, minute]);

  if (!sat || live.positions.length !== sats.length * 3 || !hasPosition(index)) return null;
  const color = CATEGORIES.find((c) => c.id === sat.category)!.color;
  const position = positionOf(index);

  return (
    <>
      {path.length > 1 && <Line points={path} color={color} lineWidth={1} />}
      <Html position={position} style={{ pointerEvents: 'none' }}>
        <div className="label">{sat.name}</div>
      </Html>
      <FlyTo position={position} id={sat.id} />
    </>
  );
}

function FlyTo({ position, id }: { position: [number, number, number]; id: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const target = useRef<THREE.Vector3 | null>(null);
  const latest = useRef(position);
  latest.current = position;

  useEffect(() => {
    const p = new THREE.Vector3(...latest.current);
    target.current = p.clone().setLength(p.length() + 2.2);
    const stop = () => (target.current = null);
    controls?.addEventListener('start', stop);
    return () => controls?.removeEventListener('start', stop);
  }, [id, controls]);

  useFrame(() => {
    if (!target.current) return;
    camera.position.lerp(target.current, 0.08);
    if (camera.position.distanceTo(target.current) < 0.01) target.current = null;
    controls?.update();
  });

  return null;
}

export default function Globe({ active }: { active: boolean }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 45, near: 0.01, far: 100 }}
      dpr={[1, 2]}
      onPointerMissed={() => set({ selectedId: null, menu: null })}
    >
      <StartView />
      <Suspense fallback={null}>
        <Earth />
      </Suspense>
      <Satellites />
      <Selected />
      <OrbitControls makeDefault enablePan={false} minDistance={1.2} maxDistance={25} rotateSpeed={0.5} />
    </Canvas>
  );
}
