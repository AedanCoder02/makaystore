'use client';

import { useEffect, useState } from 'react';
import { ShaderGradientCanvas as SGCanvas, ShaderGradient } from '@shadergradient/react';

export default function ShaderGradientCanvasWrapper() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    return <div className="absolute inset-0 w-full h-full shader-mobile-gradient" />;
  }

  return (
    <SGCanvas
      className="absolute inset-0 w-full h-full"
      style={{ position: 'absolute', inset: 0 }}
      pointerEvents="none"
    >
      <ShaderGradient
        control="props"
        type="waterPlane"
        animate="on"
        uSpeed={0.3}
        uStrength={2}
        uDensity={1.5}
        color1="#f59e0b"
        color2="#fbbf24"
        color3="#d97706"
        positionX={0}
        positionY={0}
        positionZ={0}
        rotationX={50}
        rotationY={0}
        rotationZ={-60}
        lightType="3d"
        brightness={1.2}
        envPreset="dawn"
        cAzimuthAngle={180}
        cPolarAngle={80}
        cDistance={3.6}
        cameraZoom={1}
      />
    </SGCanvas>
  );
}
