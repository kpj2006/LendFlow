'use client'

import React, { useRef } from 'react'
import { Canvas, useFrame, RootState } from '@react-three/fiber'
import { Mesh } from 'three'

function ElegantCube() {
  const meshRef = useRef<Mesh>(null!)
  
  useFrame((state: RootState, delta: number) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial color="#ff0080" transparent opacity={0.1} wireframe />
    </mesh>
  )
}

function SubtleParticles() {
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={100}
          array={new Float32Array(Array.from({ length: 300 }, () => (Math.random() - 0.5) * 15))}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.01} color="#00ff80" transparent opacity={0.3} />
    </points>
  )
}

export function SimpleScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 60 }}
        style={{ 
          background: 'transparent',
          width: '100%',
          height: '100%'
        }}
      >
        <ambientLight intensity={0.1} />
        <ElegantCube />
        <SubtleParticles />
      </Canvas>
    </div>
  )
}