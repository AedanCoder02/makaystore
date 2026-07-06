'use client';

import { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function RotatingBox() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.4;
      meshRef.current.rotation.y += delta * 0.6;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshPhongMaterial color="#f59e0b" shininess={80} />
    </mesh>
  );
}

export default function ProductModel3D() {
  const [isMobile, setIsMobile] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    return (
      <div className="model-placeholder">
        <span>📦</span>
        <p>3D viewer available on desktop</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="model-placeholder">
        <span>📦</span>
        <p>3D preview unavailable</p>
      </div>
    );
  }

  return (
    <div className="product-model-container">
      <p className="model-label">3D Preview — drag to rotate</p>
      <Canvas
        camera={{ position: [0, 0, 2.8] }}
        onCreated={() => setHasError(false)}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        <RotatingBox />
        <OrbitControls enableZoom={true} enablePan={false} />
      </Canvas>
    </div>
  );
}
