"use client";

import { useState } from "react";
import { neonAuthClient } from "@/lib/neon-auth/client";

export default function NeonAuthPage() {
  const { data: session, isPending, refetch } = neonAuthClient.useSession();
  const [mode, setMode] = useState<"sign-up" | "sign-in">("sign-up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } =
      mode === "sign-up"
        ? await neonAuthClient.signUp.email({ name, email, password })
        : await neonAuthClient.signIn.email({ email, password });
    if (error) setError(error.message ?? "Something went wrong");
    await refetch();
    setBusy(false);
  }

  async function onSignOut() {
    await neonAuthClient.signOut();
    await refetch();
  }

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        {session?.user ? (
          <>
            <h1 className="text-xl font-semibold">Signed in</h1>
            <p>{session.user.name}</p>
            <p className="text-sm opacity-70">{session.user.email}</p>
            <button onClick={onSignOut} className="w-full rounded border px-4 py-2">
              Sign out
            </button>
          </>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <h1 className="text-xl font-semibold">
              {mode === "sign-up" ? "Create account" : "Sign in"}
            </h1>
            {mode === "sign-up" && (
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <input
              className="w-full rounded border px-3 py-2"
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full rounded border px-3 py-2"
              type="password"
              placeholder="Password"
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={busy} className="w-full rounded border px-4 py-2">
              {busy ? "…" : mode === "sign-up" ? "Sign up" : "Sign in"}
            </button>
            <button
              type="button"
              className="w-full text-sm underline"
              onClick={() => setMode(mode === "sign-up" ? "sign-in" : "sign-up")}
            >
              {mode === "sign-up" ? "Have an account? Sign in" : "New here? Create an account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
