"use client";

/**
 * A commercial refrigerator, generated from its dimensions.
 *
 * You have no 3D model, but you DO have `product_variant.dims_mm` for every
 * SKU. A reach-in cabinet is a box with hinged doors, a handle per door, a
 * top overhang and four legs — geometry simple enough to build from numbers.
 * So this renders every model in the catalogue, including ones nobody has
 * photographed yet, for the cost of one component and zero assets.
 *
 * It is stylised, not photoreal. That is the honest trade: a real glTF from
 * the manufacturer's CAD will look better, and when it arrives it drops into
 * the `model` variant of ViewerSource without touching this file.
 *
 * Conventions: millimetres in, metres out (÷1000) so the scene stays in sane
 * units. The cabinet stands on y = 0 and faces +Z.
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";

import type { CabinetSpec } from "./types";

const MM = 0.001;

/** Thicknesses and insets, in metres. Tuned to read correctly at hero size. */
const DOOR_T = 0.022;
const GAP = 0.006;
const LEG_H = 0.11;
const TOP_LIP = 0.014;
const WALL = 0.035;

/**
 * 65°, not the 105° a real door manages.
 *
 * Chosen for legibility, not accuracy. Past ~80° the leaves sit almost
 * perpendicular to the front face, so from the hero's camera they collapse
 * to thin edges and the cabinet reads as a hole. At 65° both the open
 * leaves and the lit interior are visible at once, which is the whole
 * point of the interaction.
 */
const MAX_ANGLE = (Math.PI / 180) * 65;

interface Props {
  readonly spec: CabinetSpec;
  /** Target state. Each door eases toward it on its own. */
  readonly open: boolean;
}

interface PanelPlan {
  key: string;
  pivot: [number, number, number];
  width: number;
  height: number;
  /** +1 hinges on the right edge, -1 on the left. */
  swing: 1 | -1;
  centreY: number;
}

export function Cabinet({ spec, open }: Props) {
  const w = spec.dims.w * MM;
  const d = spec.dims.d * MM;
  const h = spec.dims.h * MM;

  const bodyH = h - LEG_H;
  const midY = LEG_H + bodyH / 2;
  const frontZ = d / 2;

  const panels = useMemo<PanelPlan[]>(() => {
    const cols = Math.max(1, spec.doors);
    const colW = (w - GAP * (cols + 1)) / cols;
    const rows = spec.halfDoors ? 2 : 1;
    const rowH = (bodyH - GAP * (rows + 1)) / rows;
    const out: PanelPlan[] = [];

    for (let c = 0; c < cols; c++) {
      const colCentreX = -w / 2 + GAP + colW / 2 + c * (colW + GAP);
      // Outer leaves swing outward, as a real reach-in does.
      const swing: 1 | -1 = cols === 1 ? -1 : c < cols / 2 ? -1 : 1;
      const hingeX = colCentreX + (swing === -1 ? -colW / 2 : colW / 2);

      for (let r = 0; r < rows; r++) {
        const centreY = LEG_H + GAP + rowH / 2 + r * (rowH + GAP);
        out.push({
          key: `d-${c}-${r}`,
          pivot: [hingeX, 0, frontZ],
          width: colW,
          height: rowH,
          swing,
          centreY,
        });
      }
    }
    return out;
  }, [spec.doors, spec.halfDoors, w, bodyH, frontZ]);

  const shell = "#c9ced6";
  const liner = "#e2e6ea";

  return (
    <group>
      {/* ---- carcass: five panels around an OPEN FRONT ----------------
          Not a solid box. A solid box, once the doors swing away, shows
          the outside of another box — a flat dark slab where the cavity
          should be. Five panels make a real interior. */}
      {/* back */}
      <mesh position={[0, midY, -d / 2 + WALL / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, WALL]} />
        <meshStandardMaterial color={shell} metalness={0.5} roughness={0.55} />
      </mesh>
      {/* left + right */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[(s * (w - WALL)) / 2, midY, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[WALL, bodyH, d]} />
          <meshStandardMaterial color={shell} metalness={0.82} roughness={0.34} />
        </mesh>
      ))}
      {/* floor + ceiling */}
      {[LEG_H + WALL / 2, LEG_H + bodyH - WALL / 2].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[w - WALL * 2, WALL, d]} />
          <meshStandardMaterial color={liner} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}

      {/* Interior liner faces — lighter and matte, so an open cabinet
          reads as a lit cavity rather than a hole. */}
      <mesh position={[0, midY, -d / 2 + WALL + 0.002]}>
        <planeGeometry args={[w - WALL * 2, bodyH - WALL * 2]} />
        <meshStandardMaterial color={liner} metalness={0.2} roughness={0.85} />
      </mesh>

      {/* A soft fill inside the cavity. Without it the interior is lit only
          by bounce the renderer does not compute, and reads black. */}
      <pointLight
        position={[0, midY, frontZ - d * 0.35]}
        intensity={1.1}
        distance={d * 3}
        decay={1.6}
        color="#eef3f8"
      />

      {/* ---- shelves --------------------------------------------------- */}
      {[0.3, 0.52, 0.74].map((t) => (
        <mesh key={t} position={[0, LEG_H + bodyH * t, 0]} castShadow>
          <boxGeometry args={[w - WALL * 2 - 0.02, 0.012, d - WALL - 0.06]} />
          <meshStandardMaterial color="#aeb6bf" metalness={0.65} roughness={0.45} />
        </mesh>
      ))}

      {/* ---- top overhang + control strip ------------------------------ */}
      <mesh position={[0, LEG_H + bodyH + TOP_LIP / 2, 0]} castShadow>
        <boxGeometry args={[w + 0.02, TOP_LIP, d + 0.02]} />
        <meshStandardMaterial color="#d8dde3" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[w / 2 - 0.16, LEG_H + bodyH - 0.05, frontZ + 0.004]}>
        <boxGeometry args={[0.22, 0.06, 0.01]} />
        <meshStandardMaterial color="#2a2d33" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* ---- doors ------------------------------------------------------ */}
      {panels.map((p) => (
        <DoorPanel key={p.key} plan={p} open={open} glass={spec.glass ?? false} />
      ))}

      {/* ---- legs -------------------------------------------------------- */}
      {([
        [-w / 2 + 0.06, d / 2 - 0.06],
        [w / 2 - 0.06, d / 2 - 0.06],
        [-w / 2 + 0.06, -d / 2 + 0.06],
        [w / 2 - 0.06, -d / 2 + 0.06],
      ] as const).map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, LEG_H / 2, z]} castShadow>
          <cylinderGeometry args={[0.018, 0.022, LEG_H, 12]} />
          <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * One door leaf.
 *
 * The rotation lives on a group positioned AT the hinge, with the panel
 * offset inside it — rotating the mesh itself would spin it about its own
 * centre and the door would pass through the carcass.
 *
 * The easing is owned HERE, in a ref, written straight to the Object3D. The
 * first version lifted it into a parent that called setState inside useFrame
 * to push the value back down as a prop: that re-renders the whole subtree
 * every frame and, because the value was read from a ref during render,
 * never actually moved anything. Mutating the transform directly is both
 * correct and free.
 */
function DoorPanel({
  plan,
  open,
  glass,
}: {
  plan: PanelPlan;
  open: boolean;
  glass: boolean;
}) {
  const hinge = useRef<Group>(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!hinge.current) return;
    const target = open ? 1 : 0;
    // Frame-rate independent ease, clamped so a long frame cannot overshoot.
    progress.current += (target - progress.current) * Math.min(1, delta * 5);
    /*
      Sign matters, and the obvious guess is wrong.
      Rotating about +Y sends a point at (x,0,0) to (x·cosθ, 0, −x·sinθ).
      The left leaf extends along +X from its hinge, so it needs a NEGATIVE
      angle to swing forward into +Z; the right leaf extends along −X and
      needs a positive one. `swing` is already −1 and +1 respectively, so it
      is used directly. Negating it — the first version did — swung both
      leaves backwards INTO the carcass, where they were invisible.
    */
    hinge.current.rotation.y = plan.swing * MAX_ANGLE * progress.current;
  });

  const dx = plan.swing === -1 ? plan.width / 2 : -plan.width / 2;
  const handleX =
    plan.swing === -1 ? plan.width / 2 - 0.05 : -plan.width / 2 + 0.05;

  return (
    <group ref={hinge} position={plan.pivot}>
      <group position={[dx, plan.centreY, DOOR_T / 2]}>
        <mesh castShadow>
          <boxGeometry args={[plan.width, plan.height, DOOR_T]} />
          {glass ? (
            <meshPhysicalMaterial
              color="#dfeaf2"
              metalness={0}
              roughness={0.06}
              transmission={0.9}
              thickness={0.04}
              transparent
              opacity={0.45}
            />
          ) : (
            <meshStandardMaterial color="#d2d7de" metalness={0.88} roughness={0.28} />
          )}
        </mesh>

        {/* Handle, on the leaf's free edge. */}
        <mesh position={[handleX, 0, DOOR_T / 2 + 0.022]} castShadow>
          <boxGeometry args={[0.022, Math.min(plan.height * 0.55, 0.42), 0.022]} />
          <meshStandardMaterial color="#8d949d" metalness={0.9} roughness={0.25} />
        </mesh>

        {/* Gasket line, so a shut door still reads as a door. */}
        <mesh position={[0, 0, DOOR_T / 2 + 0.001]}>
          <boxGeometry args={[plan.width - 0.02, plan.height - 0.02, 0.002]} />
          <meshStandardMaterial color="#b9c0c8" metalness={0.4} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
