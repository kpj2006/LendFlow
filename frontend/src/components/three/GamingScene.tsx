'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Subtle Matrix Rain Effect
function SubtleMatrixRain() {
  const pointsRef = useRef<THREE.Points>(null)
  
  const particles = useMemo(() => {
    const count = 150
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = Math.random() * 10 - 5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 8
    }
    
    return positions
  }, [])
  
  useFrame((state, delta) => {
    if (pointsRef.current && pointsRef.current.geometry.attributes.position) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= delta * 0.15
        if (positions[i + 1] < -5) {
          positions[i + 1] = 5
        }
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.002}
        transparent
        opacity={0.25}
        color="#00ff80"
        sizeAttenuation
      />
    </points>
  )
}

// Subtle floating orbs
function SubtleFloatingOrbs() {
  const orb1Ref = useRef<THREE.Mesh>(null)
  const orb2Ref = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (orb1Ref.current) {
      orb1Ref.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 0.2) * 0.2
    }
    if (orb2Ref.current) {
      orb2Ref.current.position.x = -4 + Math.cos(state.clock.elapsedTime * 0.15) * 0.2
    }
  })

  return (
    <group>
      <mesh ref={orb1Ref} position={[4, 1, -12]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#ff0080" transparent opacity={0.04} />
      </mesh>
      
      <mesh ref={orb2Ref} position={[-4, -1, -14]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#0080ff" transparent opacity={0.03} />
      </mesh>
    </group>
  )
}

// Very subtle grid
function SubtleGrid() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current && meshRef.current.material) {
      const material = meshRef.current.material as any
      if (material.opacity !== undefined) {
        material.opacity = 0.01 + Math.sin(state.clock.elapsedTime * 0.1) * 0.005
      }
    }
  })

  return (
    <mesh ref={meshRef} position={[0, -4, -20]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[30, 30, 10, 10]} />
      <meshBasicMaterial
        color="#0080ff"
        transparent
        opacity={0.01}
        wireframe
      />
    </mesh>
  )
}

export function GamingScene() {
  return (
    <div className="w-full h-full bg-transparent">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 40 }}
        style={{ 
          background: 'transparent',
          width: '100%',
          height: '100%'
        }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        onCreated={(state) => {
          state.gl.setClearColor('#000000', 0)
        }}
      >        
        <ambientLight intensity={0.05} color="#ffffff" />
        <pointLight position={[10, 10, 20]} intensity={0.1} color="#ff0080" />
        
        <SubtleMatrixRain />
        <SubtleFloatingOrbs />
        <SubtleGrid />
      </Canvas>
    </div>
  )
}
