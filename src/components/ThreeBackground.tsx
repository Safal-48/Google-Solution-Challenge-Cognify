import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

function generateSpherePoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 3 + Math.random() * 4
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  return positions
}

function FloatingParticles() {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => generateSpherePoints(3000), [])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.08
      ref.current.rotation.x += delta * 0.03
      // Subtle float
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#8b5cf6"
        size={0.015}
        sizeAttenuation
        depthWrite={false}
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

function GlowOrb({ position, color, size = 1, speed = 1 }: { position: [number, number, number], color: string, size?: number, speed?: number }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() * speed
      ref.current.position.y = position[1] + Math.sin(t * 0.5) * 0.5
      ref.current.position.x = position[0] + Math.cos(t * 0.3) * 0.5
      ref.current.scale.setScalar(size * (1 + Math.sin(t * 0.8) * 0.15))
    }
  })

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.15} />
    </mesh>
  )
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#08080f]">
      {/* Background radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#08080f_100%)] z-10" />
      
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <FloatingParticles />
        </Float>

        <GlowOrb position={[-3, 2, -2]} color="#7c3aed" size={1.2} speed={0.8} />
        <GlowOrb position={[4, -2, -3]} color="#3b82f6" size={1.5} speed={0.6} />
        <GlowOrb position={[0, -4, -5]} color="#ec4899" size={2} speed={0.4} />
        
        {/* Distant fog particles */}
        <Points positions={useMemo(() => generateSpherePoints(1000), [])} stride={3}>
           <PointMaterial transparent color="#ffffff" size={0.005} opacity={0.1} />
        </Points>
      </Canvas>
    </div>
  )
}
