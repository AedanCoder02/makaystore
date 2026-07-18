'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ModelPreviewStep({
  glbUrl,
  onSave,
  onDiscard,
}: {
  glbUrl: string;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf9f7f4);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 1000);
    camera.position.set(0, 0, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, -2, -5);
    scene.add(fillLight);

    // Proxy URL to avoid CORS
    const proxied = `/api/admin/3d-proxy?url=${encodeURIComponent(glbUrl)}`;

    let animId: number;
    let model: THREE.Object3D | null = null;

    // Dynamically import GLTFLoader to avoid SSR issues
    import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();
      loader.load(
        proxied,
        (gltf) => {
          model = gltf.scene;

          // Auto-center and scale to fit camera
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / (maxDim || 1);
          model.scale.setScalar(scale);
          model.position.sub(center.multiplyScalar(scale));

          scene.add(model);
        },
        undefined,
        (err) => console.error('[ModelPreview] GLB load error:', err)
      );
    });

    // OrbitControls (manual — avoid import issues)
    import('three/examples/jsm/controls/OrbitControls.js').then(({ OrbitControls }) => {
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 0.5;
      controls.maxDistance = 20;

      const animate = () => {
        animId = requestAnimationFrame(animate);
        if (model) model.rotation.y += 0.005;
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    }).catch(() => {
      // Fallback: animate without controls
      const animate = () => {
        animId = requestAnimationFrame(animate);
        if (model) model.rotation.y += 0.008;
        renderer.render(scene, camera);
      };
      animate();
    });

    // Handle resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [glbUrl]);

  return (
    <div className="step-card preview-card">
      <h2>3D Model Preview</h2>
      <div ref={mountRef} className="model-canvas" />
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
