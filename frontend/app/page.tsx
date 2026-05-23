"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getStoredSession } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const session = getStoredSession();
    router.replace(session?.token ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-400">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 font-mono text-sm uppercase tracking-[0.3em]">
        Routing to control room
      </div>
    </main>
  );
}
