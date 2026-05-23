"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { api, ApiError } from "@/lib/api";
import { setStoredSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const session = await api.login(email.trim().toLowerCase(), password);
      setStoredSession(session);
      router.replace("/dashboard");
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat masuk");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-cyan-400/20 bg-black/50 p-8 shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur">
        <div className="mb-8 space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-cyan-300">Akses Operator</p>
          <h1 className="text-3xl font-semibold text-white">Login PS Rental</h1>
          <p className="text-sm text-zinc-400">Masuk untuk mengakses billing, pesanan menu, manajemen unit, dan log sesi.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Mengautorisasi..." : "Masuk ke ruang kontrol"}
          </button>
        </form>
      </div>
    </main>
  );
}
