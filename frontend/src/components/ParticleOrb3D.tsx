// src/components/ParticleOrb3D.tsx
import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleOrbProps {
  status?: 'idle' | 'running' | 'complete';
  size?: number;
  particleCount?: number;
}

function ParticleSphere({ status = 'idle', particleCount = 11000 }: { status: string; particleCount: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    // Color definitions
    const goldColor = new THREE.Color('#F5A623');
    const amberColor = new THREE.Color('#FF7A18');
    const violetColor = new THREE.Color('#7B6CFF');
    const iceBlueColor = new THREE.Color('#6EC8FF');

    const radius = 2.4;

    for (let i = 0; i < particleCount; i++) {
      // Create a hollow sphere with shell thickness, concentrating particles towards the rim
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      // Radial thickness jitter - biased toward the outer surface for a denser rim
      const radialBias = Math.pow(Math.random(), 0.18);
      const r = radius * (0.84 + 0.16 * radialBias);

      const sinPhi = Math.sin(phi);
      const x = r * sinPhi * Math.cos(theta);
      const y = r * sinPhi * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Color interpolation:
      // Top-right (+x, +y) -> Gold / Amber
      // Bottom-left (-x, -y) -> Violet / Ice-Blue
      // Normalized projection along diagonal axis (1, 1, 0.4)
      const factor = (x + y + z * 0.4) / (radius * 2.2); // approx -1 to 1
      const normalizedFactor = THREE.MathUtils.clamp((factor + 1) / 2, 0, 1);

      const particleColor = new THREE.Color();
      if (normalizedFactor > 0.5) {
        // Upper right: blend from bright gold to intense amber
        const t = (normalizedFactor - 0.5) * 2;
        particleColor.lerpColors(goldColor, amberColor, t);
      } else {
        // Lower left: blend from cool violet to ice blue
        const t = normalizedFactor * 2;
        particleColor.lerpColors(violetColor, iceBlueColor, t);
      }

      // Slightly brighten dots located near extreme rim
      if (radialBias > 0.8) {
        particleColor.offsetHSL(0, 0, 0.08);
      }

      col[i * 3] = particleColor.r;
      col[i * 3 + 1] = particleColor.g;
      col[i * 3 + 2] = particleColor.b;
    }

    return [pos, col];
  }, [particleCount]);

  useFrame((state) => {
    if (reducedMotion || !pointsRef.current) return;

    // Adjust rotation speed depending on pipeline status
    const baseSpeed = status === 'running' ? 0.007 : 0.0022;
    pointsRef.current.rotation.y += baseSpeed;
    pointsRef.current.rotation.x += baseSpeed * 0.35;

    // Subtle breathing pulse
    const time = state.clock.getElapsedTime();
    const pulseFactor = status === 'running'
      ? Math.sin(time * 2.2) * 0.04
      : Math.sin(time * 0.8) * 0.018;
    
    pointsRef.current.scale.set(
      1 + pulseFactor,
      1 + pulseFactor,
      1 + pulseFactor
    );
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.038}
        vertexColors
        transparent
        opacity={status === 'complete' ? 0.95 : 0.88}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

export function ParticleOrb3D({ status = 'idle', size = 580 }: ParticleOrbProps) {
  return (
    <div 
      className="relative flex items-center justify-center pointer-events-none select-none"
      style={{ width: size, height: size, maxWidth: '100vw', maxHeight: '100vw' }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 48 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* Two distinct lights: warm key (top-right), cool rim (bottom-left) */}
        <pointLight position={[6, 6, 4]} intensity={2.8} color="#F5A623" />
        <pointLight position={[-6, -6, -3]} intensity={2.4} color="#7B6CFF" />
        <ambientLight intensity={0.25} />

        <ParticleSphere status={status} particleCount={11500} />
      </Canvas>
    </div>
  );
}
