"use client";

/**
 * ProductViewer — the poster is the page; the 3D is an upgrade.
 *
 * The hero image is the LCP element, and HLD.md §3 targets LCP p75 < 2.0 s.
 * three.js is ~150 KB gzipped before a single triangle, so loading it up
 * front would spend the entire budget on something most visitors never
 * interact with. The order here is therefore strict:
 *
 *   1. render the photograph, with `priority`, exactly as before
 *   2. load the renderer only when asked — a click, or browser idle if the
 *      caller opts in with `eager`
 *   3. cross-fade, keeping the poster underneath as the WebGL fallback
 *
 * If WebGL is unavailable or the chunk fails, the poster simply stays. The
 * page never ends up worse than the version without 3D.
 */
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import type { ProductViewerProps } from "./types";

/** `ssr: false` — WebGL has no meaning on the server. */
const Scene = dynamic(() => import("./scene"), {
  ssr: false,
  loading: () => null,
});

type Phase = "poster" | "loading" | "live" | "unsupported";

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ?? canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

export function ProductViewer({
  poster,
  alt,
  source,
  eager = false,
  className,
}: ProductViewerProps) {
  const [phase, setPhase] = useState<Phase>("poster");
  const [open, setOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const interactive = source.kind !== "static";

  const activate = useCallback(() => {
    if (!interactive) return;
    setPhase((p) => (p === "poster" ? (webglAvailable() ? "loading" : "unsupported") : p));
  }, [interactive]);

  // Opt-in warm start: wait for genuine idle, never for first paint.
  useEffect(() => {
    if (!eager || !interactive || phase !== "poster") return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(activate, { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(activate, 2500);
    return () => window.clearTimeout(t);
  }, [eager, interactive, phase, activate]);

  // The scene signals readiness by mounting; give it a frame to paint
  // before fading, so the cross-fade never reveals an empty canvas.
  useEffect(() => {
    if (phase !== "loading") return;
    const t = window.setTimeout(() => setPhase("live"), 450);
    return () => window.clearTimeout(t);
  }, [phase]);

  const showScene = phase === "loading" || phase === "live";

  return (
    <div className={`viewer${className ? ` ${className}` : ""}`}>
      {/* Poster. Stays mounted: it is the WebGL fallback, and removing it
          would cause a layout shift on a slow connection. */}
      <Image
        src={poster}
        alt={alt}
        fill
        priority
        sizes="(max-width: 1024px) 90vw, 560px"
        className={`viewer__poster${phase === "live" ? " is-hidden" : ""}`}
      />

      {showScene && source.kind !== "static" && (
        <div className={`viewer__stage${phase === "live" ? " is-live" : ""}`}>
          <Scene source={source} open={open} autoRotate={autoRotate} />
        </div>
      )}

      {interactive && phase === "poster" && (
        <button className="viewer__cta" type="button" onClick={activate}>
          <CubeIcon /> View in 3D
        </button>
      )}

      {phase === "loading" && <span className="viewer__status">Loading 3D…</span>}

      {phase === "unsupported" && (
        <span className="viewer__status">3D is not available on this device.</span>
      )}

      {phase === "live" && (
        <div className="viewer__controls">
          <button
            className="viewer__btn"
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-pressed={open}
          >
            {open ? "Close doors" : "Open doors"}
          </button>
          <button
            className="viewer__btn"
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            aria-pressed={autoRotate}
          >
            {autoRotate ? "Stop rotation" : "Rotate"}
          </button>
          <span className="viewer__hint">Drag to orbit · scroll to zoom</span>
        </div>
      )}
    </div>
  );
}

function CubeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.6 14 5v6l-6 3.4L2 11V5l6-3.4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M2 5l6 3.4L14 5M8 8.4V14.4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
