import * as THREE from "three";
import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

export default function Avatar() {
  const group = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF("/models/michelle/michelle.gltf");

  // Optional animation mixer (if GLB has animations)
  const mixer = useRef<THREE.AnimationMixer>(null);

  if (animations.length > 0 && !mixer.current) {
    mixer.current = new THREE.AnimationMixer(scene);

    const action = mixer.current.clipAction(animations[0]);
    
    action.play();
  }

  useFrame((_, delta) => {
    mixer.current?.update(delta);

    // if (group.current) {
    //   group.current.rotation.y += delta * 0.5;
    // }
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

useGLTF.preload("/models/michelle/michelle.gltf");
