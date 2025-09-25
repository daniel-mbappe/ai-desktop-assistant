import * as THREE from "three";
import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

export default function Avatar() {
  const group = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF("/models/michelle.glb");

  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      console.log("Mesh:", mesh.name);
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat, i) => {
          console.log(`  Material[${i}]:`, mat);
        });
      } else {
        console.log("  Material:", mesh.material);
      }
    }
  });

  // Optional animation mixer (if GLB has animations)
  const mixer = useRef<THREE.AnimationMixer>(null);

  if (animations.length > 0 && !mixer.current) {
    mixer.current = new THREE.AnimationMixer(scene);

    const action = mixer.current.clipAction(animations[0]);
    
    action.play();
  }

  useFrame((_, delta) => {
    mixer.current?.update(delta);
  });

  return (
    <primitive
      object={scene}
      ref={group}
      scale={1.5}
      position={[0, -1.3, 0]}
    />
  );
}

useGLTF.preload("/models/michelle.glb");
