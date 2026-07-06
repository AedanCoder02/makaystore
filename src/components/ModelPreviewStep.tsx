'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-expect-error - GLTFLoader types not available
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default function ModelPreviewStep({
  glbUrl,
  onSave,
  onDiscard,
}: {
  glbUrl: string;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Three.js setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf9f7f4);

    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current });
    renderer.setSize(
      canvasRef.current.clientWidth,
      canvasRef.current.clientHeight
    );

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Load GLB
    const loader = new GLTFLoader();
    loader.load(glbUrl, (gltf: any) => {
      const model = gltf.scene;
      scene.add(model);

      // Auto-rotate
      const animate = () => {
        requestAnimationFrame(animate);
        model.rotation.y += 0.01;
        renderer.render(scene, camera);
      };
      animate();
    });

    return () => {
      renderer.dispose();
    };
  }, [glbUrl]);

  return (
    <div className="step-card preview-card">
      <h2>3D Model Preview</h2>
      <canvas ref={canvasRef} className="model-canvas"></canvas>
      <p className="preview-info">Drag to rotate • Scroll to zoom</p>

      <div className="button-group">
        <button className="btn btn-primary" onClick={onSave}>
          Save to Product
        </button>
        <button className="btn btn-secondary" onClick={onDiscard}>
          Try Again
        </button>
      </div>
    </div>
  );
}
