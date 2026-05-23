"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getStoredSession, hasRequiredRole } from "@/lib/auth";
import type { AuthSession, Role } from "@/types/api";

type ProtectedPageProps = {
  requiredRole?: Role;
  children: (session: AuthSession) => React.ReactNode;
};

export function ProtectedPage({ requiredRole, children }: ProtectedPageProps) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedSession = getStoredSession();

    if (!storedSession?.token || !storedSession.user) {
      router.replace("/login");
      return;
    }

    if (!hasRequiredRole(storedSession.user, requiredRole)) {
      router.replace("/dashboard");
      return;
    }

    setSession(storedSession);
    setReady(true);
  }, [requiredRole, router]);

  if (!ready || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-400">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 font-mono text-sm uppercase tracking-[0.3em]">
          Loading control room
        </div>
      </main>
    );
  }

  return <>{children(session)}</>;
}
