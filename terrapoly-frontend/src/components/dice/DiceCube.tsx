import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

export default function DiceCube({ position }: any) {

  const ref = useRef<THREE.Mesh>(null)

  useFrame(() => {

    if (!ref.current) return

    ref.current.rotation.x += 0.02
    ref.current.rotation.y += 0.03

  })

  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[1,1,1]} />
      <meshStandardMaterial color="white" />
    </mesh>
  )
}