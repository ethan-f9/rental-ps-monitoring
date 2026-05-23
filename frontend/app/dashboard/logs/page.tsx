"use client";

import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/DataTable";
import Layout from "@/components/Layout";
import { Panel } from "@/components/Panel";
import { ProtectedPage } from "@/components/ProtectedPage";
import { StatusDot } from "@/components/StatusDot";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/time";
import type { BillingSession, OrderLog } from "@/types/api";

export default function LogsPage() {
  return (
    <ProtectedPage requiredRole="OWNER">
      {(session) => <LogsContent user={session.user as any} />}
    </ProtectedPage>
  );
}

function LogsContent({ user }: { user: { id: string; name: string; email: string; role: "OWNER" } }) {
  const [billingLogs, setBillingLogs] = useState<BillingSession[]>([]);
  const [orderLogs, setOrderLogs] = useState<OrderLog[]>([]);
  const [activeTab, setActiveTab] = useState<"sessions" | "fnb">("sessions");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [sessions, orders] = await Promise.all([api.getBillingLogs(), api.getOrderLogs()]);
      setBillingLogs(sessions);
      setOrderLogs(orders);
      setError(null);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat memuat log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleDeleteBillingLog = async (sessionId: string) => {
    if (!confirm("Hapus log sesi ini?")) {
      return;
    }

    try {
      await api.deleteBillingLog(sessionId);
      await load();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat menghapus log sesi");
    }
  };

  const handleDeleteOrderLog = async (orderId: string) => {
    if (!confirm("Hapus log pesanan ini?")) {
      return;
    }

    try {
      await api.deleteOrderLog(orderId);
      await load();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat menghapus log pesanan");
    }
  };


  const todaySummary = useMemo(() => {
    const now = new Date();
    const isToday = (value: string | null | undefined) => {
      if (!value) {
        return false;
      }

      const date = new Date(value);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    };

    const completedTodaySessions = billingLogs.filter((item) => item.status === "COMPLETED" && isToday(item.endTime));
    const servedTodayOrders = orderLogs.filter((item) => item.status === "SERVED" && isToday(item.updatedAt ?? item.createdAt));

    return {
      revenue: completedTodaySessions.reduce((sum, item) => sum + Number(item.totalAmount ?? 0), 0),
      fnbRevenue: servedTodayOrders.reduce((sum, item) => sum + Number(item.totalPrice ?? 0), 0),
      sessionCount: completedTodaySessions.length,
      orderCount: servedTodayOrders.length
    };
  }, [billingLogs, orderLogs]);

  const salesByMenuItem = useMemo(() => {
    const grouped = new Map<string, number>();

    orderLogs.forEach((item) => {
      const current = grouped.get(item.menuItem.name) ?? 0;
      grouped.set(item.menuItem.name, current + item.quantity);
    });

    return Array.from(grouped.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((left, right) => right.quantity - left.quantity);
  }, [orderLogs]);

  const maxQuantity = salesByMenuItem[0]?.quantity ?? 1;

  return (
    <Layout user={user} title="Log" subtitle="Tinjau sesi PlayStation, pesanan F&B, dan ringkasan performa hari ini.">
      {error ? <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Pendapatan Sesi Hari Ini" value={formatCurrency(todaySummary.revenue)} />
        <SummaryCard label="Pendapatan F&B Hari Ini" value={formatCurrency(todaySummary.fnbRevenue)} />
        <SummaryCard label="Sesi Hari Ini" value={String(todaySummary.sessionCount)} />
        <SummaryCard label="Pesanan Hari Ini" value={String(todaySummary.orderCount)} />
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          className={`rounded-xl px-4 py-2 text-sm transition ${activeTab === "sessions" ? "bg-cyan-400/15 text-cyan-200" : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"}`}
        >
          Sesi PS
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("fnb")}
          className={`rounded-xl px-4 py-2 text-sm transition ${activeTab === "fnb" ? "bg-cyan-400/15 text-cyan-200" : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"}`}
        >
          Pesanan F&B
        </button>
      </div>

      {activeTab === "sessions" ? (
        <Panel eyebrow="Riwayat" title="Sesi billing">
          {loading ? (
            <p className="text-sm text-zinc-400">Memuat log billing...</p>
          ) : (
            <DataTable columns={["Unit", "Paket", "Mulai", "Selesai", "Total", "Status", "Aksi"]}>
              {billingLogs.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.playStation.name}</td>
                  <td className="px-4 py-3">{item.package?.name ?? "Langsung"}</td>
                  <td className="px-4 py-3 text-zinc-400">{formatDateTime(item.startTime)}</td>
                  <td className="px-4 py-3 text-zinc-400">{formatDateTime(item.endTime)}</td>
                  <td className="px-4 py-3">{formatCurrency(item.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <StatusDot tone={item.status === "COMPLETED" ? "idle" : "active"} label={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void handleDeleteBillingLog(item.id)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/20"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>
      ) : (
        <div className="space-y-4">
          <Panel eyebrow="Komposisi Penjualan" title="Jumlah F&B terjual per item">
            {loading ? (
              <p className="text-sm text-zinc-400">Memuat grafik penjualan...</p>
            ) : salesByMenuItem.length === 0 ? (
              <p className="text-sm text-zinc-400">Belum ada pesanan F&B yang tercatat.</p>
            ) : (
              <div className="space-y-3">
                {salesByMenuItem.map((item) => (
                  <div key={item.name} className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)_60px] sm:items-center">
                    <div className="text-sm text-zinc-300">{item.name}</div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(0,255,240,0.45)]"
                        style={{ width: `${Math.max((item.quantity / maxQuantity) * 100, 6)}%` }}
                      />
                    </div>
                    <div className="text-right font-mono text-sm text-cyan-200">{item.quantity}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel eyebrow="Pesanan" title="Riwayat pesanan F&B">
            {loading ? (
              <p className="text-sm text-zinc-400">Memuat pesanan F&B...</p>
            ) : (
              <DataTable columns={["Tipe", "Unit / Sesi", "Item", "Qty", "Total", "Dibuat", "Status", "Aksi"]}>
                {orderLogs.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      {item.rentalSession ? <StatusDot tone="active" label="SESSION" /> : <StatusDot tone="warning" label="WALK-IN" />}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {item.rentalSession ? `${item.rentalSession.playStation.name} / ${item.rentalSession.package?.name ?? "Langsung"}` : "Walk-in"}
                    </td>
                    <td className="px-4 py-3">{item.menuItem.name}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{formatCurrency(item.totalPrice)}</td>
                    <td className="px-4 py-3 text-zinc-400">{formatDateTime(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusDot tone={item.status === "CANCELLED" ? "danger" : item.status === "SERVED" ? "idle" : "warning"} label={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void handleDeleteOrderLog(item.id)}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/20"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Panel>
        </div>
      )}
    </Layout>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <p className="mt-4 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
