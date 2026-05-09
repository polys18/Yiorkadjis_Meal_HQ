"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { id: string; name: string; role: "mom" | "kid"; color: string };

export function AppShell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl">Meal HQ</Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/history" className="text-text-muted hover:text-text">History</Link>
            {me?.role === "mom" && (
              <Link href="/admin" className="text-text-muted hover:text-text">Admin</Link>
            )}
            {me && (
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 text-text-muted hover:text-text"
                aria-label={`Sign out ${me.name}`}
              >
                <span
                  className="h-6 w-6 rounded-full text-white text-[11px] flex items-center justify-center"
                  style={{ backgroundColor: me.color }}
                >
                  {me.name[0]}
                </span>
                Sign out
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
