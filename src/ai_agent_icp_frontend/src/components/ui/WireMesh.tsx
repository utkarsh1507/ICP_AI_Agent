import React, { useRef } from "react";
import * as THREE from "three";
import {useFrame } from "@react-three/fiber";


function WireframeMesh() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 1]}>
        <icosahedronGeometry args={[2,1]}/>
        <meshBasicMaterial color={"orange"} wireframe/>
    </mesh>
  );
}

export default WireframeMesh;