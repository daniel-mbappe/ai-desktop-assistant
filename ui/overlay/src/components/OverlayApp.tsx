import Avatar from "./Avatar";
import TestCube from "./TestCube";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";

export default function OverlayApp() {
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 30 }}
      style={{ background: "transparent" }}
    >
      {/* Lighting */}
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={3} />
      <directionalLight position={[-5, 5, -5]} intensity={2} />

      {/* Your GLB avatar */}
      <Avatar />
      {/* <TestCube /> */}

      {/* Helpers (dev only) */}
      <OrbitControls enablePan={false} />
      {/* <Environment preset="studio" /> */}
    </Canvas>
  );
}
