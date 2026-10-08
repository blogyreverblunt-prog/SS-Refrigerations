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

export function BrandMark({ size = 26 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true" className="brand__mark">
      <rect x="1" y="1" width="26" height="26" rx="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8v12M9 14l7-6M9 14l7 6" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" />
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
