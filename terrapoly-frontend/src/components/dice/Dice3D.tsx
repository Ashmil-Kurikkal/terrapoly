import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import DiceCube from "./DiceCube"

export default function Dice3D() {

  return (
    <div className="w-[220px] h-[150px]">

      <Canvas camera={{ position: [0, 3, 5], fov: 50 }}>

        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} />

        <DiceCube position={[-1.2, 0, 0]} />
        <DiceCube position={[1.2, 0, 0]} />

        <OrbitControls enableZoom={false} />

      </Canvas>

    </div>
  )
}