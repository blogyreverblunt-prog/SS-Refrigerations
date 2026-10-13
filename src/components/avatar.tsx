/**
 * The signed-in person's face, or their initials.
 *
 * A plain <img>, not next/image, and deliberately. next/image would route
 * Google's CDN through the Next optimiser, which means configuring
 * remotePatterns for lh3.googleusercontent.com, a server round trip per
 * avatar, and a 500 the day Google changes hostname. This is one 32px square
 * from a CDN built for exactly this; optimising it buys nothing.
 *
 * `referrerPolicy="no-referrer"` because Google serves these without
 * credentials and some setups return 403 when a referrer is attached.
 *
 * The initials are not a placeholder for a missing picture — they are the
 * normal case. Anyone who registered with an email and password has no
 * picture and never will, so this has to look deliberate rather than broken.
 */
interface Props {
  name: string;
  image?: string | null;
  size?: number;
}

export function Avatar({ name, image, size = 28 }: Props) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };

  if (image) {
    return (
      // next/image is the right default and the wrong tool here — see the
      // header. Suppressed with a reason rather than silenced in config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="avatar avatar--photo"
        src={image}
        alt=""
        width={size}
        height={size}
        style={style}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <span className="avatar" style={style} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

/**
 * One letter from the first word and one from the last — "Priya Shah" gives
 * PS, "Priya" gives P. Anything longer than two letters stops reading as a
 * monogram and starts reading as truncated text.
 */
export function initials(full: string): string {
  const words = full.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}
