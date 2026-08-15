'use client';

import { useEffect, useState } from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

export default function MembershipHeroGradient() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    return (
      <div
        className="absolute inset-0 w-full h-full"
        style={{ background: 'linear-gradient(160deg, #140d08 0%, #3d1f0e 45%, #7B3F22 100%)' }}
      />
    );
  }

  return (
    <ShaderGradientCanvas
      className="absolute inset-0 w-full h-full"
      style={{ position: 'absolute', inset: 0 }}
      pointerEvents="none"
      pixelDensity={1}
    >
      <ShaderGradient
        control="props"
        type="waterPlane"
        animate="on"
        uSpeed={0.15}
        uStrength={2.5}
        uDensity={1.2}
        color1="#140d08"
        color2="#7B3F22"
        color3="#D4A574"
        positionX={0}
        positionY={0}
        positionZ={0}
        rotationX={50}
        rotationY={0}
        rotationZ={-60}
        lightType="3d"
        brightness={1.0}
        envPreset="dawn"
        cAzimuthAngle={180}
        cPolarAngle={75}
        cDistance={3.6}
        cameraZoom={1}
        grain="on"
      />
    </ShaderGradientCanvas>
  );
}
