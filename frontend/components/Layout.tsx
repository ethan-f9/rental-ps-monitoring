"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { clearStoredSession } from "@/lib/auth";
import type { AuthUser } from "@/types/api";

import { StatusDot } from "./StatusDot";

type LayoutProps = {
  user: AuthUser;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

const ownerLinks = [
  { href: "/dashboard/packages", label: "Paket" },
  { href: "/dashboard/units", label: "Unit" },
  { href: "/dashboard/menu", label: "Menu" },
  { href: "/dashboard/users", label: "Pengguna" },
  { href: "/dashboard/logs", label: "Log" }
];

export default function Layout({ user, title, subtitle, children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const links = user.role === "OWNER" ? ownerLinks : [];

  const handleLogout = () => {
    clearStoredSession();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="grid min-h-screen lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-black/40 p-6 lg:border-b-0 lg:border-r">
          <div className="space-y-2 border-b border-white/10 pb-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-cyan-300">PS RENTAL OPS</p>
            <h1 className="text-xl font-semibold">Ruang Kontrol</h1>
            <p className="text-sm text-zinc-400">{user.name}</p>
            <StatusDot tone="active" label={user.role} />
          </div>

          <nav className="mt-6 space-y-2">
            <Link
              href="/dashboard"
              className={`block rounded-xl px-3 py-2 text-sm transition ${pathname === "/dashboard" ? "bg-cyan-400/10 text-cyan-300" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
            >
              Ringkasan
            </Link>
            {links.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-xl px-3 py-2 text-sm transition ${isActive ? "bg-cyan-400/10 text-cyan-300" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
          >
            Keluar
          </button>
        </aside>

        <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <header className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-500">Tampilan Sistem</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">{title}</h2>
                <p className="mt-2 max-w-2xl text-sm text-zinc-400">{subtitle}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">Auth</p>
                  <p className="mt-2 text-sm text-zinc-200">JWT / localStorage</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">API</p>
                  <p className="mt-2 text-sm text-zinc-200">localhost:4000</p>
                </div>
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
