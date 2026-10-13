"use client";

/**
 * Sign out. A button inside a POST, never a link.
 *
 * A GET that ends a session can be fired by an <img> on another page, and a
 * link prefetcher will follow it without being asked — both of which sign
 * people out at random. The navigation afterwards is a full load so the
 * server renders with the cookie actually gone.
 */
import { useState } from "react";

export function SignOutButton({ className = "btn btn--ghost" }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          window.location.assign("/");
        }
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
