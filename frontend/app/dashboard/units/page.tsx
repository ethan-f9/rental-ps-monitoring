"use client";

import { FormEvent, useEffect, useState } from "react";

import { DataTable } from "@/components/DataTable";
import Layout from "@/components/Layout";
import { Modal } from "@/components/Modal";
import { Panel } from "@/components/Panel";
import { ProtectedPage } from "@/components/ProtectedPage";
import { StatusDot } from "@/components/StatusDot";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/time";
import type { PlayStationUnit, SmartPlugDevice } from "@/types/api";

export default function UnitsPage() {
  return (
    <ProtectedPage requiredRole="OWNER">
      {(session) => <UnitsContent user={session.user} />}
    </ProtectedPage>
  );
}

function UnitsContent({ user }: { user: { id: string; name: string; email: string; role: "OWNER" } }) {
  const [units, setUnits] = useState<PlayStationUnit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [pricePerHour, setPricePerHour] = useState(0);
  const [smartPlugUnit, setSmartPlugUnit] = useState<PlayStationUnit | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [maskedSecret, setMaskedSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [smartPlugError, setSmartPlugError] = useState<string | null>(null);
  const [savingSmartPlug, setSavingSmartPlug] = useState(false);
  const [deletingSmartPlug, setDeletingSmartPlug] = useState(false);

  const loadUnits = async () => {
    try {
      const items = await api.getUnits();
      setUnits(items);
      setError(null);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat memuat unit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUnits();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (editingId) {
        await api.updateUnit(editingId, { name, pricePerHour });
      } else {
        await api.createUnit({ name, pricePerHour });
      }

      setEditingId(null);
      setName("");
      setPricePerHour(0);
      await loadUnits();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat menyimpan unit");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteUnit(id);
      await loadUnits();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat menghapus unit");
    }
  };

  const startEdit = (unit: PlayStationUnit) => {
    setEditingId(unit.id);
    setName(unit.name);
    setPricePerHour(Number(unit.pricePerHour));
  };

  const openSmartPlugModal = async (unit: PlayStationUnit) => {
    setSmartPlugUnit(unit);
    setDeviceId(unit.smartPlugDevice?.deviceId ?? "");
    setClientId(unit.smartPlugDevice?.clientId ?? "");
    setClientSecret("");
    setMaskedSecret(unit.smartPlugDevice?.clientSecret ?? "");
    setSmartPlugError(null);

    try {
      const smartPlug = await api.getUnitSmartPlug(unit.id);
      applySmartPlugState(smartPlug);
    } catch (error) {
      setSmartPlugError(error instanceof ApiError ? error.message : "Tidak dapat memuat Smart Plug");
    }
  };

  const applySmartPlugState = (smartPlug: SmartPlugDevice | null) => {
    setDeviceId(smartPlug?.deviceId ?? "");
    setClientId(smartPlug?.clientId ?? "");
    setClientSecret("");
    setMaskedSecret(smartPlug?.clientSecret ?? "");
  };

  const closeSmartPlugModal = () => {
    setSmartPlugUnit(null);
    setDeviceId("");
    setClientId("");
    setClientSecret("");
    setMaskedSecret("");
    setSmartPlugError(null);
  };

  const handleSaveSmartPlug = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!smartPlugUnit) {
      return;
    }

    setSavingSmartPlug(true);
    setSmartPlugError(null);

    try {
      const saved = await api.saveUnitSmartPlug(smartPlugUnit.id, { deviceId, clientId, clientSecret });
      applySmartPlugState(saved);
      await loadUnits();
    } catch (error) {
      setSmartPlugError(error instanceof ApiError ? error.message : "Tidak dapat menyimpan Smart Plug");
    } finally {
      setSavingSmartPlug(false);
    }
  };

  const handleDeleteSmartPlug = async () => {
    if (!smartPlugUnit) {
      return;
    }

    setDeletingSmartPlug(true);
    setSmartPlugError(null);

    try {
      await api.deleteUnitSmartPlug(smartPlugUnit.id);
      applySmartPlugState(null);
      await loadUnits();
    } catch (error) {
      setSmartPlugError(error instanceof ApiError ? error.message : "Tidak dapat menghapus Smart Plug");
    } finally {
      setDeletingSmartPlug(false);
    }
  };

  return (
    <Layout user={user} title="Unit" subtitle="Kelola armada PlayStation, ketersediaan runtime, harga per jam, dan integrasi Smart Plug.">
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Panel eyebrow="Form Unit" title={editingId ? "Ubah unit" : "Buat unit"}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="unit-name" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Nama unit
              </label>
              <input id="unit-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="unit-hourly" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Harga per jam
              </label>
              <input id="unit-hourly" type="number" min={1} value={pricePerHour} onChange={(event) => setPricePerHour(Number(event.target.value))} required />
            </div>
            {error ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
            <div className="flex gap-3">
              <button type="submit" className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300">
                {editingId ? "Perbarui unit" : "Buat unit"}
              </button>
              {editingId ? (
                <button type="button" onClick={() => { setEditingId(null); setName(""); setPricePerHour(0); }} className="rounded-xl border border-white/10 px-4 py-3 text-zinc-200 transition hover:bg-white/5">
                  Batal
                </button>
              ) : null}
            </div>
          </form>
        </Panel>

        <Panel eyebrow="Armada" title="Unit PlayStation">
          {loading ? (
            <p className="text-sm text-zinc-400">Memuat unit...</p>
          ) : (
            <DataTable columns={["Unit", "Per Jam", "Status", "Smart Plug", "Aksi"]}>
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td className="px-4 py-3">{unit.name}</td>
                  <td className="px-4 py-3">{formatCurrency(unit.pricePerHour)}</td>
                  <td className="px-4 py-3">
                    <StatusDot tone="idle" label={unit.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusDot
                      tone={unit.smartPlugDevice?.isActive ? "active" : "neutral"}
                      label={unit.smartPlugDevice?.isActive ? "Terhubung" : "Tidak ada"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => startEdit(unit)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-200 transition hover:bg-white/5">
                        Ubah
                      </button>
                      <button type="button" onClick={() => void openSmartPlugModal(unit)} className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-200 transition hover:bg-cyan-400/20">
                        Kelola Smart Plug
                      </button>
                      <button type="button" onClick={() => void handleDelete(unit.id)} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/20">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>
      </div>

      <Modal open={Boolean(smartPlugUnit)} title={`Kelola Smart Plug${smartPlugUnit ? ` · ${smartPlugUnit.name}` : ""}`} onClose={closeSmartPlugModal}>
        <form className="space-y-4" onSubmit={handleSaveSmartPlug}>
          <div className="space-y-2">
            <label htmlFor="smart-plug-device-id" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Device ID
            </label>
            <input id="smart-plug-device-id" value={deviceId} onChange={(event) => setDeviceId(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="smart-plug-client-id" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Client ID
            </label>
            <input id="smart-plug-client-id" value={clientId} onChange={(event) => setClientId(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="smart-plug-client-secret" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Client Secret
            </label>
            <input
              id="smart-plug-client-secret"
              type="password"
              value={clientSecret}
              onChange={(event) => setClientSecret(event.target.value)}
              placeholder={maskedSecret ? `Tersimpan: ${maskedSecret}` : "Masukkan Client Secret"}
              required={!maskedSecret}
            />
            {maskedSecret ? <p className="text-xs text-zinc-500">Kosongkan jika tidak ingin mengganti Client Secret.</p> : null}
          </div>
          {smartPlugError ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{smartPlugError}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={savingSmartPlug} className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50">
              {savingSmartPlug ? "Menyimpan..." : "Simpan Smart Plug"}
            </button>
            {maskedSecret || smartPlugUnit?.smartPlugDevice ? (
              <button type="button" disabled={deletingSmartPlug} onClick={() => void handleDeleteSmartPlug()} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 transition hover:bg-red-500/20 disabled:opacity-50">
                {deletingSmartPlug ? "Menghapus..." : "Hapus Smart Plug"}
              </button>
            ) : null}
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
