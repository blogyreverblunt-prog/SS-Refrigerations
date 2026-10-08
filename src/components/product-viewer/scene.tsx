"use client";

/**
 * The WebGL scene. Loaded only on demand — see index.tsx — so none of
 * three.js reaches the browser until someone asks for 3D.
 *
 * Lighting is deliberately NOT drei's `<Environment preset="…">`: that
 * fetches a multi-megabyte HDR from a third-party CDN at runtime, which is
 * both a performance cost and an availability dependency this design does
 * not accept anywhere else. Lightformers generate an environment map on the
 * GPU instead, which is what makes the stainless read as metal.
 */
import { Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import { Cabinet } from "./cabinet";
import type { ViewerSource } from "./types";

interface Props {
  readonly source: Extract<ViewerSource, { kind: "procedural" | "model" }>;
  readonly open: boolean;
  readonly autoRotate: boolean;
}

/**
 * The seam that matters: when a real model arrives — exported from the
 * manufacturer's CAD, or commissioned — it renders here and nothing else in
 * the app changes. `useGLTF` suspends, which the <Suspense> below catches.
 */
function GltfModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function Scene({ source, open, autoRotate }: Props) {
  // Frame the camera from the cabinet's own height, so a 600 mm undercounter
  // and a 2 m reach-in both fill the viewport sensibly.
  const height = source.kind === "procedural" ? source.spec.dims.h * 0.001 : 1.9;
  const distance = Math.max(2.6, height * 1.9);

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [distance * 0.62, height * 0.72, distance], fov: 34 }}
      gl={{ antialias: true }}
      style={{ touchAction: "pan-y" }}
    >
      <color attach="background" args={["#f2f4f7"]} />

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[3.5, 6, 4]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* Fill from the opposite side. Without it the flank facing away from
          the key light goes almost black — brushed steel has nothing but
          reflection to describe its form. */}
      <directionalLight position={[-5, 3, -2]} intensity={0.55} />

      <Suspense fallback={null}>
        <group position={[0, -height / 2, 0]}>
          {source.kind === "procedural" ? (
            <Cabinet spec={source.spec} open={open} />
          ) : (
            <GltfModel url={source.url} />
          )}
        </group>

        {/* Soft contact shadow, so the unit sits on something. */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -height / 2 - 0.001, 0]}
          receiveShadow
        >
          <circleGeometry args={[distance * 0.9, 48]} />
          <shadowMaterial opacity={0.18} />
        </mesh>

        <Environment resolution={256}>
          <Lightformer intensity={2.2} position={[0, 4, 2]} scale={[8, 3, 1]} />
          <Lightformer intensity={1.1} position={[-4, 2, 2]} scale={[3, 6, 1]} />
          <Lightformer intensity={1.1} position={[4, 2, 2]} scale={[3, 6, 1]} />
          <Lightformer intensity={0.7} position={[0, 2, -4]} scale={[8, 4, 1]} />
        </Environment>
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={distance * 0.6}
        maxDistance={distance * 1.9}
      />
    </Canvas>
  );
}
