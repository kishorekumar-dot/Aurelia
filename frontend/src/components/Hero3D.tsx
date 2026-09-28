// src/components/Hero3D.tsx
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';
import { FileCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

function DocumentIntelligenceMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15;
      meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.2;
      ringRef.current.rotation.x = Math.cos(t * 0.15) * 0.2;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.y = t * 0.1;
      outerRingRef.current.rotation.z = Math.sin(t * 0.12) * 0.15;
    }
  });

  return (
    <group scale={1.2}>
      {/* Central Glowing Abstract Core */}
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
        <Sphere ref={meshRef} args={[1.5, 64, 64]}>
          <MeshDistortMaterial
            color="#3B82F6"
            attach="material"
            distort={0.35}
            speed={1.8}
            roughness={0.2}
            metalness={0.8}
            wireframe={false}
            emissive="#1E3A8A"
            emissiveIntensity={0.6}
          />
        </Sphere>
      </Float>

      {/* Orbiting Evidence & Policy Node Ring */}
      <group ref={ringRef}>
        <mesh>
          <torusGeometry args={[2.5, 0.02, 16, 100]} />
          <meshStandardMaterial color="#60A5FA" emissive="#3B82F6" emissiveIntensity={0.8} wireframe />
        </mesh>
        
        {/* Node Spheres on the ring */}
        {[0, 1.25, 2.5, 3.75, 5.0].map((angle, i) => (
          <mesh key={i} position={[Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, 0]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#67E8F9" : "#C084FC"} emissive={i % 2 === 0 ? "#06B6D4" : "#8B5CF6"} emissiveIntensity={1} />
          </mesh>
        ))}
      </group>

      {/* Outer Cyan Cyber Ring */}
      <group ref={outerRingRef}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[3.2, 0.015, 16, 100]} />
          <meshStandardMaterial color="#8B5CF6" emissive="#6D28D9" emissiveIntensity={0.5} transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  );
}

export const Hero3D: React.FC = () => {
  return (
    <div className="relative w-full h-[520px] lg:h-[620px] flex items-center justify-center">
      {/* ThreeJS 3D Canvas Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#93C5FD" />
          <pointLight position={[-10, -10, -5]} intensity={1} color="#C084FC" />
          <DocumentIntelligenceMesh />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
        </Canvas>
      </div>

      {/* Radial Gradient Ambient Glow behind canvas */}
      <div className="absolute w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute w-80 h-80 bg-purple-600/15 rounded-full blur-[90px] pointer-events-none -z-10" />

      {/* Floating Micro-UI Overlay Cards */}

      {/* Micro-Card 1: Figure Caption Verified */}
      <div className="absolute top-6 left-4 sm:left-8 z-10 animate-float-slow" style={{ animationDelay: '0s' }}>
        <div className="glass-panel p-3.5 rounded-xl border border-emerald-500/30 shadow-xl max-w-[210px] backdrop-blur-md bg-slate-950/80">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-slate-200">Figure Caption</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Evidence:</span>
            <span className="text-blue-400 font-medium">Page 24</span>
          </div>
        </div>
      </div>

      {/* Micro-Card 2: Methodology Lecturer Review */}
      <div className="absolute top-24 right-4 sm:right-8 z-10 animate-float-slow" style={{ animationDelay: '2s' }}>
        <div className="glass-panel p-3.5 rounded-xl border border-amber-500/30 shadow-xl max-w-[230px] backdrop-blur-md bg-slate-950/80">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-slate-200">Methodology</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" />
              Lecturer Review
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Experimental setup validation required
          </div>
        </div>
      </div>

      {/* Micro-Card 3: References Supported */}
      <div className="absolute bottom-12 left-6 sm:left-12 z-10 animate-float-slow" style={{ animationDelay: '4s' }}>
        <div className="glass-panel p-3.5 rounded-xl border border-blue-500/30 shadow-xl max-w-[220px] backdrop-blur-md bg-slate-950/80">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-slate-200">References</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <FileCheck className="w-3 h-3" />
              Supported
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Bibliographic Match:</span>
            <span className="text-cyan-400 font-medium">32/34</span>
          </div>
        </div>
      </div>

      {/* Orbiting Floating Pill Tags */}
      <div className="absolute bottom-6 right-8 z-10 hidden sm:flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-slate-900/90 border border-purple-500/40 text-purple-300 text-xs font-mono shadow-lg backdrop-blur-md">
          • Policy FIG-001
        </span>
        <span className="px-3 py-1 rounded-full bg-slate-900/90 border border-blue-500/40 text-blue-300 text-xs font-mono shadow-lg backdrop-blur-md">
          • Finding #104
        </span>
      </div>
    </div>
  );
};
