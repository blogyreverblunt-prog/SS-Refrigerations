/**
 * The social marks, in one place, because they now appear in three.
 *
 * They were inline SVG inside the footer. /contact and /support want the same
 * row — every one of the three reference sites puts its marks in the footer
 * AND on the page a customer lands on looking for a human — and a second copy
 * of four hand-written paths is how two of them end up different.
 *
 * ## Clickable, and going nowhere
 *
 * `site.social.*` is "#" until the real profiles exist. Three ways to render
 * that, and only the third is honest:
 *
 *   · `<a href="#">` — looks and reads like a link, and jumps the page to the
 *     top when clicked. A screen reader announces a link to nothing.
 *   · a muted `<span>` — honest, but invisible to the keyboard and it reads
 *     as a disabled feature rather than a brand that has a Facebook page.
 *   · `<button type="button">` — a real control, focusable, hoverable, in the
 *     tab order, and clicking it does nothing at all. No navigation, no
 *     JavaScript, no layout shift when the URL arrives.
 *
 * The third is what this renders while a value is "#", with the destination
 * named in its accessible label so nobody is misled about what it will do.
 * Paste a URL into `site.social` and the identical mark becomes an `<a>` to
 * it. Nothing else changes.
 *
 * A server component. The whole row ships zero JavaScript.
 */
import type { ReactNode } from "react";

import { site } from "@/content/site";

type GlyphProps = { size?: number };

function Facebook({ size = 14 }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <path d="M8.9 12V7.6h1.5l.2-1.7H8.9V4.8c0-.5.1-.8.8-.8h.9V2.5a12 12 0 0 0-1.3-.1c-1.3 0-2.2.8-2.2 2.3v1.2H5.6v1.7h1.5V12h1.8Z" />
    </svg>
  );
}

function Instagram({ size = 14 }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="10" height="10" rx="3" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="7" cy="7" r="2.3" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10" cy="4" r=".8" fill="currentColor" />
    </svg>
  );
}

function LinkedIn({ size = 14 }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <path d="M3 5h2v7H3V5Zm1-3a1.2 1.2 0 1 1 0 2.4A1.2 1.2 0 0 1 4 2Zm3 3h2v1a2.3 2.3 0 0 1 2-1c1.6 0 2 1 2 2.6V12H10V8.1c0-.9-.3-1.4-1-1.4s-1 .5-1 1.4V12H6V5h1Z" />
    </svg>
  );
}

function YouTube({ size = 14 }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <path d="M13 4.6a1.6 1.6 0 0 0-1.1-1.1C10.9 3.2 7 3.2 7 3.2s-3.9 0-4.9.3A1.6 1.6 0 0 0 1 4.6C.7 5.6.7 7 .7 7s0 1.4.3 2.4a1.6 1.6 0 0 0 1.1 1.1c1 .3 4.9.3 4.9.3s3.9 0 4.9-.3A1.6 1.6 0 0 0 13 9.4c.3-1 .3-2.4.3-2.4s0-1.4-.3-2.4ZM5.8 8.8V5.2L8.9 7 5.8 8.8Z" />
    </svg>
  );
}

export interface SocialChannel {
  readonly key: keyof typeof site.social;
  readonly label: string;
  /** The handle to show where there is room for text as well as a mark. */
  readonly handle: string;
  readonly glyph: (p: GlyphProps) => ReactNode;
}

/**
 * Order is deliberate and matches `site.social`: the three a buyer checks
 * before enquiring first, YouTube last.
 */
export const SOCIALS: readonly SocialChannel[] = [
  { key: "facebook", label: "Facebook", handle: "/ssrefrigeration", glyph: Facebook },
  { key: "instagram", label: "Instagram", handle: "@ssrefrigeration", glyph: Instagram },
  { key: "linkedin", label: "LinkedIn", handle: "/company/ssrefrigeration", glyph: LinkedIn },
  { key: "youtube", label: "YouTube", handle: "/@ssrefrigeration", glyph: YouTube },
];

/** True once the value is a URL rather than the "#" placeholder. */
function isLive(href: string): boolean {
  return Boolean(href) && href !== "#";
}

interface MarkProps {
  channel: SocialChannel;
  size?: number;
}

export function SocialMark({ channel, size = 14 }: MarkProps) {
  const href = site.social[channel.key];
  const Glyph = channel.glyph;

  if (!isLive(href)) {
    return (
      <button
        type="button"
        aria-label={`${channel.label} — profile link coming soon`}
        title={`${channel.label} — link coming soon`}
      >
        <Glyph size={size} />
      </button>
    );
  }

  return (
    <a href={href} aria-label={channel.label} target="_blank" rel="noreferrer noopener">
      <Glyph size={size} />
    </a>
  );
}

/**
 * The row of marks. `channels` narrows it where a page wants only the three
 * a buyer checks and not YouTube.
 */
export function SocialRow({
  channels = SOCIALS,
  size = 14,
}: {
  channels?: readonly SocialChannel[];
  size?: number;
}) {
  return (
    <div className="social">
      {channels.map((c) => (
        <SocialMark key={c.key} channel={c} size={size} />
      ))}
    </div>
  );
}

/**
 * Mark, name and handle per line — for a contact or support page, where the
 * question is "where do I follow you" rather than "decorate this footer".
 *
 * The badge here is the `tmpl` class directly rather than `<Tmpl />`, and
 * deliberately so: it marks a missing URL, not a missing company fact, so it
 * must survive `site.isTemplate` being switched off while a handle is still
 * "#".
 */
export function SocialList({ channels = SOCIALS }: { channels?: readonly SocialChannel[] }) {
  return (
    <div className="rows">
      {channels.map((c) => {
        const href = site.social[c.key];
        return (
          <div className="rows__row" key={c.key}>
            <span className="rows__k">{c.label}</span>
            <span className="rows__v">
              {isLive(href) ? (
                <a href={href} target="_blank" rel="noreferrer noopener">
                  {c.handle}
                </a>
              ) : (
                <>
                  {c.handle} <span className="tmpl">link coming soon</span>
                </>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
