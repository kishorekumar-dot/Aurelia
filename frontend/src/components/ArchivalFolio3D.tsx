import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function PaperStack() {
  const groupRef = useRef<THREE.Group>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useFrame((state) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
      groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.2) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Folio Base Sheet */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0.05]} receiveShadow castShadow>
        <boxGeometry args={[3.2, 4.2, 0.06]} />
        <meshStandardMaterial color="#E8DFD0" roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Second Stacked Paper Plane */}
      <mesh position={[0.15, 0.12, 0.1]} rotation={[-Math.PI / 2, 0, -0.1]} receiveShadow castShadow>
        <boxGeometry args={[3.0, 4.0, 0.05]} />
        <meshStandardMaterial color="#F4EFE6" roughness={0.6} metalness={0.02} />
      </mesh>

      {/* Top Document Plane with Brass Bookmark Seal */}
      <mesh position={[-0.1, 0.24, -0.05]} rotation={[-Math.PI / 2, 0, 0.02]} receiveShadow castShadow>
        <boxGeometry args={[2.9, 3.9, 0.04]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} metalness={0.0} />
      </mesh>

      {/* Brass Seal Ribbon */}
      <mesh position={[1.1, 0.28, 0.2]} rotation={[-Math.PI / 2, 0, 0.02]}>
        <boxGeometry args={[0.3, 1.2, 0.06]} />
        <meshStandardMaterial color="#B08D57" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Oxblood Stamp Mark */}
      <mesh position={[-0.8, 0.27, -1.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.02, 32]} />
        <meshStandardMaterial color="#8C1C13" roughness={0.8} />
      </mesh>
    </group>
  );
}

export default function ArchivalFolio3D() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '340px' }} className="relative">
      <Canvas
        camera={{ position: [0, 2.8, 4.5], fov: 45 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.8} color="#FFF5E6" />
        <directionalLight position={[4, 8, 5]} intensity={1.4} color="#FFF0D0" castShadow />
        <directionalLight position={[-4, -2, -3]} intensity={0.4} color="#8C1C13" />
        <PaperStack />
      </Canvas>
    </div>
  );
}
