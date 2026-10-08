/**
 * The viewer's contract.
 *
 * The whole point of this file: a page says "show this product" and never
 * learns HOW. Today the hero has a photograph and a procedurally generated
 * cabinet; tomorrow it may have a glTF exported from the manufacturer's CAD,
 * or a 360° turntable sequence. Each is a variant of `ViewerSource`, so
 * swapping one for another is a prop change at the call site and nothing
 * else moves — the same ports-and-adapters seam the backend uses.
 *
 * Variants are added only when they are implemented. A union member that
 * throws "not supported" is worse than no union member at all.
 */

/** Cabinet dimensions in MILLIMETRES, matching product_variant.dims_mm. */
export interface CabinetDims {
  readonly w: number;
  readonly d: number;
  readonly h: number;
}

export interface CabinetSpec {
  readonly dims: CabinetDims;
  /** Door columns across the front. */
  readonly doors: number;
  /** Glass fronts render transmissive; solid render as brushed steel. */
  readonly glass?: boolean;
  /**
   * Split every column into an upper and a lower panel — the half-door
   * reach-in configuration, which is what the hero unit actually is.
   */
  readonly halfDoors?: boolean;
}

export type ViewerSource =
  /** A photograph. Always the poster, and the LCP element. */
  | { readonly kind: "static" }
  /** Geometry generated from dimensions the database already stores. */
  | { readonly kind: "procedural"; readonly spec: CabinetSpec }
  /** A real model: glTF/GLB, from CAD or a 3D artist. */
  | { readonly kind: "model"; readonly url: string };

export interface ProductViewerProps {
  /** Poster image — rendered immediately, before any 3D is considered. */
  readonly poster: string;
  readonly alt: string;
  readonly source: ViewerSource;
  /**
   * Load the 3D scene as soon as the browser is idle rather than waiting
   * for a click. Off by default: the hero must not spend its first seconds
   * downloading a renderer (HLD.md §3 targets LCP p75 < 2.0s).
   */
  readonly eager?: boolean;
  readonly className?: string;
}

/**
 * Derive a cabinet from a variant row.
 *
 * Door count is not a column yet, so it is inferred from the family. That
 * inference lives HERE, in one function, rather than being sprinkled across
 * pages — when `product_variant` grows a `doors` column this is the only
 * thing that changes.
 */
export function cabinetFromVariant(
  slug: string,
  dimsMm: unknown,
): CabinetSpec | null {
  const d = dimsMm as Partial<CabinetDims> | null;
  if (!d?.w || !d.d || !d.h) return null;
  const dims: CabinetDims = { w: d.w, d: d.d, h: d.h };

  switch (slug) {
    case "reach-in-refrigerator":
      return { dims, doors: 2, halfDoors: true };
    case "glass-door-refrigerator":
      return { dims, doors: 2, glass: true };
    case "undercounter-refrigerator":
      return { dims, doors: 2 };
    default:
      return { dims, doors: 2 };
  }
}
