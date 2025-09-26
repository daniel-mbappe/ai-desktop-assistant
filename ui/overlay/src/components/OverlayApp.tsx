import Avatar from "./Avatar";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function OverlayApp() {
  return (
    <Canvas
      camera={{ position: [0, 3, 5], fov: 25 }}
      style={{ background: "transparent" }}
    >
      {/* Lighting */}
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={3} />
      {/* <directionalLight position={[-5, 5, -5]} intensity={2} /> */}

      {/* Your GLB avatar */}
      <Avatar />

      {/* Helpers (dev only) */}
      <OrbitControls enablePan={false} />
    </Canvas>
  );
}
