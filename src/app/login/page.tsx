"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NamePicker } from "@/components/family/NamePicker";
import { PinKeypad } from "@/components/family/PinKeypad";

function LoginInner() {
  const [name, setName] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("from") || "/";

  async function submit(pin: string): Promise<string | null> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, pin }),
    });
    if (res.ok) {
      router.replace(next);
      router.refresh();
      return null;
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) {
      return `Too many attempts. Try again in ${data.retryAfter ?? "a few"} seconds.`;
    }
    return data.error || "Login failed";
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="font-serif text-4xl text-center mb-2">Meal HQ</h1>
      <p className="text-center text-text-muted mb-8">Tap your name to sign in</p>
      {name ? (
        <PinKeypad name={name} onCancel={() => setName(null)} onSubmit={submit} />
      ) : (
        <NamePicker onPick={setName} />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Suspense fallback={null}>
        <LoginInner />
      </Suspense>
    </main>
  );
}
