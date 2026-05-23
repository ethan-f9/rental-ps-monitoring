"use client";

import { FormEvent, useEffect, useState } from "react";

import { DataTable } from "@/components/DataTable";
import Layout from "@/components/Layout";
import { Panel } from "@/components/Panel";
import { ProtectedPage } from "@/components/ProtectedPage";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/time";
import type { MenuItem, PackageItem, PlayStationUnit } from "@/types/api";

type FnbDraft = {
  menuItemId: string;
  quantity: number;
};

export default function PackagesPage() {
  return (
    <ProtectedPage requiredRole="OWNER">
      {(session) => <PackagesContent user={session.user as any} />}
    </ProtectedPage>
  );
}

function PackagesContent({ user }: { user: { id: string; name: string; email: string; role: "OWNER" } }) {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [units, setUnits] = useState<PlayStationUnit[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [flatPrice, setFlatPrice] = useState(0);
  const [unitId, setUnitId] = useState("");
  const [durationMinute, setDurationMinute] = useState(60);
  const [fnbItems, setFnbItems] = useState<FnbDraft[]>([]);
  const [showUnitSection, setShowUnitSection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setFlatPrice(0);
    setUnitId(units[0]?.id ?? "");
    setDurationMinute(60);
    setFnbItems([]);
    setShowUnitSection(false);
  };

  const loadData = async () => {
    try {
      const [packageItems, unitItems, menuCatalog] = await Promise.all([
        api.getPackages(),
        api.getUnits(),
        api.getMenuItems()
      ]);
      setPackages(packageItems);
      setUnits(unitItems);
      setMenuItems(menuCatalog);
      setUnitId((current) => current || unitItems[0]?.id || "");
      setError(null);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat memuat paket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = { name, flatPrice, unitId, durationMinute, fnbItems };

      if (editingId) {
        await api.updatePackage(editingId, payload);
      } else {
        await api.createPackage(payload);
      }

      resetForm();
      await loadData();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat menyimpan paket");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item: PackageItem) => {
    setEditingId(item.id);
    setName(item.name);
    setFlatPrice(Number(item.flatPrice));
    setUnitId(item.unitId);
    setDurationMinute(item.durationMinute);
    setFnbItems(item.packageFnbItems.map((entry) => ({ menuItemId: entry.menuItemId, quantity: entry.quantity })));
    setShowUnitSection(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deletePackage(id);
      await loadData();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat menghapus paket");
    }
  };

  const addFnbSection = () => {
    setFnbItems((current) => [...current, { menuItemId: menuItems[0]?.id ?? "", quantity: 1 }]);
  };

  const removeFnbSection = (index: number) => {
    setFnbItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const updateFnbItem = (index: number, nextValue: FnbDraft) => {
    setFnbItems((current) => current.map((item, currentIndex) => (currentIndex === index ? nextValue : item)));
  };

  return (
    <Layout user={user} title="Paket" subtitle="Susun preset paket dengan satu unit, satu durasi, dan item F&B bundling opsional.">
      <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Panel eyebrow="Form Paket" title={editingId ? "Ubah paket" : "Buat paket"}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="package-name" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Nama
              </label>
              <input id="package-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="package-flat-price" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Harga flat
              </label>
              <input
                id="package-flat-price"
                type="number"
                min={1}
                value={flatPrice}
                onChange={(event) => setFlatPrice(Number(event.target.value))}
                required
              />
            </div>

            {!showUnitSection ? (
              <button type="button" onClick={() => setShowUnitSection(true)} className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200 transition hover:bg-cyan-400/15">
                Tambah Unit
              </button>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-300">Bagian unit</p>
                  <button type="button" onClick={() => setShowUnitSection(false)} className="text-xs text-red-300 transition hover:text-red-200">
                    Hapus bagian unit
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="package-unit" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                      Unit
                    </label>
                    <select id="package-unit" value={unitId} onChange={(event) => setUnitId(event.target.value)} required>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} / {formatCurrency(unit.pricePerHour)} per jam
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="package-duration" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                      Durasi menit
                    </label>
                    <input
                      id="package-duration"
                      type="number"
                      min={1}
                      value={durationMinute}
                      onChange={(event) => setDurationMinute(Number(event.target.value))}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {fnbItems.map((entry, index) => (
                <div key={`${entry.menuItemId}-${index}`} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-300">Item F&B {index + 1}</p>
                    <button type="button" onClick={() => removeFnbSection(index)} className="text-xs text-red-300 transition hover:text-red-200">
                      Hapus item
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">Item menu</label>
                      <select
                        value={entry.menuItemId}
                        onChange={(event) => updateFnbItem(index, { ...entry, menuItemId: event.target.value })}
                        required
                      >
                        {menuItems.map((menuItem) => (
                          <option key={menuItem.id} value={menuItem.id}>
                            {menuItem.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">Jumlah</label>
                      <input
                        type="number"
                        min={1}
                        value={entry.quantity}
                        onChange={(event) => updateFnbItem(index, { ...entry, quantity: Number(event.target.value) })}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addFnbSection} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/10">
                Tambah F&B
              </button>
            </div>

            {error ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50">
                {submitting ? "Menyimpan..." : editingId ? "Perbarui paket" : "Buat paket"}
              </button>
              {editingId ? (
                <button type="button" onClick={resetForm} className="rounded-xl border border-white/10 px-4 py-3 text-zinc-200 transition hover:bg-white/5">
                  Batal
                </button>
              ) : null}
            </div>
          </form>
        </Panel>

        <Panel eyebrow="Katalog" title="Daftar paket">
          {loading ? (
            <p className="text-sm text-zinc-400">Memuat paket...</p>
          ) : (
            <DataTable columns={["Nama", "Harga Flat", "Unit", "Durasi", "F&B Bundling", "Aksi"]}>
              {packages.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{formatCurrency(item.flatPrice)}</td>
                  <td className="px-4 py-3">{item.unit.name}</td>
                  <td className="px-4 py-3">{item.durationMinute} menit</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {item.packageFnbItems.length === 0
                      ? "Tidak ada"
                      : item.packageFnbItems.map((entry) => `${entry.menuItem.name} x${entry.quantity}`).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEdit(item)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-200 transition hover:bg-white/5">
                        Ubah
                      </button>
                      <button type="button" onClick={() => void handleDelete(item.id)} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/20">
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
    </Layout>
  );
}
