"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/Modal";
import Layout from "@/components/Layout";
import { Panel } from "@/components/Panel";
import { ProtectedPage } from "@/components/ProtectedPage";
import { StatusDot } from "@/components/StatusDot";
import { api, ApiError } from "@/lib/api";
import { formatCountdown, formatCurrency } from "@/lib/time";
import type { AuthSession, BillingSession, MenuItem, PackageItem, PlayStationUnit } from "@/types/api";

export default function DashboardPage() {
  return <ProtectedPage>{(session) => <DashboardContent session={session} />}</ProtectedPage>;
}

type DashboardContentProps = {
  session: AuthSession;
};

function DashboardContent({ session }: DashboardContentProps) {
  const [units, setUnits] = useState<PlayStationUnit[]>([]);
  const [sessions, setSessions] = useState<BillingSession[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);
  const [startPackageModalOpen, setStartPackageModalOpen] = useState(false);
  const [tambahOrderModalOpen, setTambahOrderModalOpen] = useState(false);
  const [directStartUnit, setDirectStartUnit] = useState<PlayStationUnit | null>(null);
  const [extendSessionId, setExtendSessionId] = useState<string | null>(null);
  const [packageId, setPackageId] = useState("");
  const [menuItemId, setMenuItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [durationHours, setDurationHours] = useState(1);
  const [extraHours, setExtraHours] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [directError, setDirectError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [extendError, setExtendError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [unitList, activeSessions, packageList, menuList] = await Promise.all([
        api.getUnits(),
        api.getActiveSessions(),
        api.getPackages(),
        api.getMenuItems()
      ]);
      setUnits(unitList);
      setSessions(activeSessions);
      setPackages(packageList);
      setMenuItems(menuList.filter((item) => item.isActive));
      setPackageId(packageList[0]?.id ?? "");
      setMenuItemId(menuList.find((item) => item.isActive)?.id ?? "");
      setError(null);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const secondTick = window.setInterval(() => setTick((current) => current + 1), 1000);
    const refreshTick = window.setInterval(() => {
      void refresh();
    }, 10000);

    return () => {
      window.clearInterval(secondTick);
      window.clearInterval(refreshTick);
    };
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const sessionsByUnit = useMemo(() => {
    const mapping = new Map<string, BillingSession>();
    sessions.forEach((item) => mapping.set(item.playStationId, item));
    return mapping;
  }, [sessions]);

  const handlePackageStart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPackageError(null);

    try {
      await api.startSession({ packageId });
      setStartPackageModalOpen(false);
      await refresh();
    } catch (error) {
      setPackageError(error instanceof ApiError ? error.message : "Tidak dapat memulai sesi paket");
    }
  };

  const handleDirectStart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDirectError(null);

    if (!directStartUnit) {
      return;
    }

    try {
      await api.startSession({ unitId: directStartUnit.id, durationMinute: durationHours * 60 });
      setDirectStartUnit(null);
      setDurationHours(1);
      await refresh();
    } catch (error) {
      setDirectError(error instanceof ApiError ? error.message : "Tidak dapat memulai billing langsung");
    }
  };

  const handleTambahOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOrderError(null);

    try {
      await api.createOrder(null, menuItemId, quantity);
      setTambahOrderModalOpen(false);
      setQuantity(1);
      await refresh();
    } catch (error) {
      setOrderError(error instanceof ApiError ? error.message : "Tidak dapat membuat pesanan");
    }
  };

  const handleExtend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setExtendError(null);

    if (!extendSessionId) {
      return;
    }

    try {
      await api.extendSession(extendSessionId, extraHours * 60);
      setExtendSessionId(null);
      setExtraHours(1);
      await refresh();
    } catch (error) {
      setExtendError(error instanceof ApiError ? error.message : "Tidak dapat memperpanjang sesi");
    }
  };

  const handleStop = async (sessionId: string) => {
    try {
      await api.stopSession(sessionId);
      await refresh();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat menghentikan sesi");
    }
  };

  const selectedDirectEstimate = directStartUnit
    ? (Number(directStartUnit.pricePerHour) * durationHours || 0)
    : 0;

  return (
    <Layout
      user={session.user}
      title="Ringkasan Operasional"
      subtitle="Kontrol sesi, billing langsung, dan visibilitas runtime tiap unit dalam satu ruang kontrol."
    >
      <Panel
        eyebrow="Kontrol Sesi"
        title="Panel kendali"
        action={
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5"
          >
            {refreshing ? "Memuat ulang..." : "Muat ulang"}
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
          <div>
            <p className="text-sm text-zinc-400">Mulai sesi paket atau buat pesanan F&B terpisah dari panel kontrol utama.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStartPackageModalOpen(true)}
              disabled={packages.length === 0}
              className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mulai Sesi
            </button>
            <button
              type="button"
              onClick={() => setTambahOrderModalOpen(true)}
              disabled={menuItems.length === 0}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Tambah Pesanan
            </button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-300">
            Aktif: <span className="text-white">{sessions.length}</span>
          </div>
        </div>
      </Panel>

      {error ? <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{error}</div> : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-black/30 p-5 text-zinc-500">
                Memuat unit...
              </div>
            ))
          : units.map((unit) => {
              const activeSession = sessionsByUnit.get(unit.id);
              const isRunning = Boolean(activeSession);

              return (
                <article key={unit.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">{unit.name}</p>
                      <p className="mt-2 text-sm text-zinc-400">{formatCurrency(unit.pricePerHour)} / jam</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusDot tone={isRunning ? "active" : "idle"} label={isRunning ? "RUNNING" : unit.status} />
                      {session.user.role === "OWNER" ? (
                        <Link href="/dashboard/units" className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 transition hover:bg-white/5">
                          Ubah
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  {activeSession ? (
                    <div className="mt-5 space-y-4">
                      <div>
                        <p className="font-mono text-3xl text-cyan-300">{formatCountdown(activeSession.expectedEndTime)}</p>
                        <p className="mt-2 text-sm text-zinc-400">{activeSession.package?.name ?? "Langsung"}</p>
                      </div>
                      <div className="grid gap-2 text-sm text-zinc-300">
                        <div className="flex items-center justify-between">
                          <span>Total</span>
                          <span>{formatCurrency(activeSession.totalAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Perpanjangan</span>
                          <span>{activeSession.extendedMinutes} menit</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setExtendSessionId(activeSession.id)}
                          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 transition hover:bg-amber-500/20"
                        >
                          Perpanjang
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleStop(activeSession.id)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/20"
                        >
                          Hentikan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      <p className="text-sm text-zinc-400">Unit sedang IDLE dan siap untuk billing langsung.</p>
                      <button
                        type="button"
                        onClick={() => setDirectStartUnit(unit)}
                        className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
                      >
                        Mulai Billing
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
      </div>

      <Modal open={startPackageModalOpen} title="Mulai Sesi" onClose={() => setStartPackageModalOpen(false)}>
        <form className="space-y-4" onSubmit={handlePackageStart}>
          <div className="space-y-2">
            <label htmlFor="packageId" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Paket
            </label>
            <select id="packageId" value={packageId} onChange={(event) => setPackageId(event.target.value)} required>
              {packages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} / {item.unit.name} / {item.durationMinute} menit / {formatCurrency(item.flatPrice)}
                </option>
              ))}
            </select>
          </div>
          {packageError ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{packageError}</p> : null}
          <button type="submit" className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300">
            Konfirmasi mulai
          </button>
        </form>
      </Modal>

      <Modal open={tambahOrderModalOpen} title="Tambah Pesanan" onClose={() => setTambahOrderModalOpen(false)}>
        <form className="space-y-4" onSubmit={handleTambahOrder}>
          <div className="space-y-2">
            <label htmlFor="menuItemId" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Item menu
            </label>
            <select id="menuItemId" value={menuItemId} onChange={(event) => setMenuItemId(event.target.value)} required>
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} / {item.category} / {formatCurrency(item.price)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="quantity" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Jumlah
            </label>
            <input id="quantity" type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} required />
          </div>
          {orderError ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{orderError}</p> : null}
          <button type="submit" className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300">
            Simpan pesanan
          </button>
        </form>
      </Modal>

      <Modal open={Boolean(directStartUnit)} title="Mulai Billing" onClose={() => setDirectStartUnit(null)}>
        <form className="space-y-4" onSubmit={handleDirectStart}>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
            <p>Unit: <span className="text-white">{directStartUnit?.name ?? "-"}</span></p>
            <p className="mt-2">Harga per jam: <span className="text-white">{formatCurrency(directStartUnit?.pricePerHour)}</span></p>
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">Durasi</label>
            <HourSelector value={durationHours} onChange={setDurationHours} />
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
            Perkiraan total: <span className="font-semibold text-white">{formatCurrency(selectedDirectEstimate)}</span>
          </div>
          {directError ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{directError}</p> : null}
          <button type="submit" className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300">
            Mulai billing
          </button>
        </form>
      </Modal>

      <Modal open={Boolean(extendSessionId)} title="Perpanjang Sesi" onClose={() => setExtendSessionId(null)}>
        <form className="space-y-4" onSubmit={handleExtend}>
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">Durasi</label>
            <HourSelector value={extraHours} onChange={setExtraHours} />
          </div>
          {extendError ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{extendError}</p> : null}
          <button type="submit" className="rounded-xl bg-amber-400 px-4 py-3 font-semibold text-black transition hover:bg-amber-300">
            Perpanjang
          </button>
        </form>
      </Modal>
    </Layout>
  );
}

function HourSelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/5"
      >
        -
      </button>
      <div className="min-w-[110px] text-center font-mono text-lg text-white">{value} jam</div>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/5"
      >
        +
      </button>
    </div>
  );
}
