/**
 * Inline SVG icons, stroke-based, matching the reference board's iconography
 * row. Inline rather than an icon package: there are nine of them, they ship
 * zero JavaScript, and `currentColor` makes them theme-correctly everywhere.
 */
type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 18 18",
  fill: "none",
  "aria-hidden": true as const,
});

export function ArrowRight({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.7"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Snowflake({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 1.5v15M9 4.5 6 7.5M9 4.5l3 3M9 13.5l-3-3M9 13.5l3-3M2.5 5.25l13 7.5M2.5 12.75l13-7.5"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Cabinet({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="2.25" y="2.25" width="13.5" height="13.5" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9 2.25v13.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.75 8.25v1.5M11.25 8.25v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function Shield({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 1.75 3 4.1v4.3c0 3.5 2.5 6.6 6 7.85 3.5-1.25 6-4.35 6-7.85V4.1L9 1.75Z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="m6.5 8.75 1.9 1.9 3.3-3.6" stroke="currentColor" strokeWidth="1.3"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Download({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2v7M4 6.5 7 9.5l3-3M2.5 11.5h9" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlayCircle({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.8 3.9 8.2 6 4.8 8.1V3.9Z" fill="currentColor" />
    </svg>
  );
}

export function PlayTriangle() {
  return (
    <svg width="9" height="10" viewBox="0 0 9 10" fill="none" aria-hidden="true">
      <path d="M1 1.2 8 5 1 8.8V1.2Z" fill="currentColor" />
    </svg>
  );
}

export function Menu() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Placeholder mark.
 *
 * It used to be a "K", inherited from the KALT demo — which read as the wrong
 * initial once the brand became SS Refrigeration. A snowflake says the
 * category without claiming to be a wordmark. Swap this one component (and
 * `src/app/icon.svg`, which mirrors it) when the real logo exists.
 */
export function BrandMark({ size = 26 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true" className="brand__mark">
      <rect x="1" y="1" width="26" height="26" rx="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 6.5v15M14 9.8 11.2 12M14 9.8l2.8 2.2M14 18.2l-2.8-2.2M14 18.2l2.8-2.2M7.5 10.25l13 7.5M7.5 17.75l13-7.5"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Phone({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4.2 2.5h2.6l1.1 2.9-1.6 1.2a8.4 8.4 0 0 0 4.1 4.1l1.2-1.6 2.9 1.1v2.6c0 .6-.5 1.1-1.1 1.1A11.2 11.2 0 0 1 3.1 3.6c0-.6.5-1.1 1.1-1.1Z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function Chat({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M15.5 8.6c0 3.1-2.9 5.6-6.5 5.6a7.6 7.6 0 0 1-2.2-.3L3 15.5l1.2-2.7A5.3 5.3 0 0 1 2.5 8.6C2.5 5.5 5.4 3 9 3s6.5 2.5 6.5 5.6Z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function Pin({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 16s5-4.6 5-8.2A5 5 0 0 0 4 7.8C4 11.4 9 16 9 16Z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="9" cy="7.6" r="1.9" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function Wrench({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M11.4 2.6a3.9 3.9 0 0 0-1.1 5.3l-6 6a1.6 1.6 0 0 0 2.2 2.2l6-6a3.9 3.9 0 0 0 5.3-1.1l-2.9-.4-1.4-1.4-.4-2.9-1.7-1.7Z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function Box({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 1.9 2.6 5.2v7.6L9 16.1l6.4-3.3V5.2L9 1.9Z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M2.6 5.2 9 8.6l6.4-3.4M9 8.6v7.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function FileText({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M10.4 1.9H5.1a1.4 1.4 0 0 0-1.4 1.4v11.4a1.4 1.4 0 0 0 1.4 1.4h7.8a1.4 1.4 0 0 0 1.4-1.4V5.6l-3.9-3.7Z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10.2 2.1v3.7h4M6.4 9.4h5.2M6.4 12.1h5.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function Refresh({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M15.3 8.2A6.4 6.4 0 0 0 4.1 5.1M2.7 9.8a6.4 6.4 0 0 0 11.2 3.1"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12.6 2.6v2.9h-2.9M5.4 15.4v-2.9h2.9" stroke="currentColor" strokeWidth="1.3"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Scale({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 2.4v13.2M3.4 5.6h11.2M5.9 5.6 3.4 10.6h5L5.9 5.6Zm6.2 0-2.5 5h5l-2.5-5Z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function QuoteMark() {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0v6.2C8 11.4 5.1 14.9.6 16L0 14.2c2.6-.9 4.2-2.8 4.4-5H1.2V0H8Zm12 0v6.2c0 5.2-2.9 8.7-7.4 9.8l-.6-1.8c2.6-.9 4.2-2.8 4.4-5h-3.2V0H20Z" />
    </svg>
  );
}
