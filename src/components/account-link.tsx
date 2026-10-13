"use client";

/**
 * The header's account affordance, and the reason every other page on this
 * site is still static.
 *
 * Reading the session cookie in the header would make the header dynamic, and
 * the header is in the layout — so every marketing page would start rendering
 * per visitor, which is precisely the rule HLD.md sets out to avoid. So the
 * header ships prerendered as "Sign in", and this component asks
 * /api/auth/me after hydration and swaps in the first name if there is one.
 *
 * It renders the signed-out label first and never a spinner: the swap is one
 * word changing after a fast same-origin request, and a placeholder that
 * flashes would be more distracting than the thing it is hiding.
 */
import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar } from "./avatar";

interface Me {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export function AccountLink({ className }: { className?: string }) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { customer?: Me | null } | null) => {
        if (!cancelled && body?.customer) setMe(body.customer);
      })
      // Signed out, offline, or the route is unhappy: the link stays "Sign in",
      // which is correct in all three cases.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!me) {
    return (
      <Link className={className} href="/login">
        Sign in
      </Link>
    );
  }

  return (
    <Link className={`${className ?? ""} account-link`.trim()} href="/account">
      <Avatar name={me.name} image={me.image} size={24} />
      <span>{firstName(me.name)}</span>
    </Link>
  );
}

function firstName(full: string): string {
  const first = full.trim().split(/\s+/)[0] ?? full;
  return first.length > 14 ? `${first.slice(0, 13)}…` : first;
}
