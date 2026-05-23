"use client";

import { FormEvent, useEffect, useState } from "react";

import { DataTable } from "@/components/DataTable";
import Layout from "@/components/Layout";
import { Panel } from "@/components/Panel";
import { ProtectedPage } from "@/components/ProtectedPage";
import { StatusDot } from "@/components/StatusDot";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/time";
import type { MenuItem } from "@/types/api";

export default function MenuPage() {
  return (
    <ProtectedPage requiredRole="OWNER">
      {(session) => <MenuContent user={session.user as any} />}
    </ProtectedPage>
  );
}

function MenuContent({ user }: { user: { id: string; name: string; email: string; role: "OWNER" } }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      const menu = await api.getMenuItems();
      setItems(menu);
      setError(null);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat memuat item menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (editingId) {
        await api.updateMenuItem(editingId, { name, price, category });
      } else {
        await api.createMenuItem({ name, price, category });
      }

      setEditingId(null);
      setName("");
      setCategory("");
      setPrice(0);
      await loadItems();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat menyimpan item menu");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMenuItem(id);
      await loadItems();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat menghapus item menu");
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setPrice(Number(item.price));
  };

  return (
    <Layout user={user} title="Menu" subtitle="Kelola inventaris makanan dan minuman yang tersedia untuk pesanan sesi.">
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Panel eyebrow="Form Menu" title={editingId ? "Ubah item" : "Buat item"}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="menu-name" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Nama
              </label>
              <input id="menu-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="menu-category" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Kategori
              </label>
              <input id="menu-category" value={category} onChange={(event) => setCategory(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="menu-price" className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Harga
              </label>
              <input id="menu-price" type="number" min={1} value={price} onChange={(event) => setPrice(Number(event.target.value))} required />
            </div>
            {error ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
            <div className="flex gap-3">
              <button type="submit" className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300">
                {editingId ? "Perbarui item" : "Buat item"}
              </button>
              {editingId ? (
                <button type="button" onClick={() => { setEditingId(null); setName(""); setCategory(""); setPrice(0); }} className="rounded-xl border border-white/10 px-4 py-3 text-zinc-200 transition hover:bg-white/5">
                  Batal
                </button>
              ) : null}
            </div>
          </form>
        </Panel>

        <Panel eyebrow="Katalog" title="Inventaris menu">
          {loading ? (
            <p className="text-sm text-zinc-400">Memuat item menu...</p>
          ) : (
            <DataTable columns={["Nama", "Kategori", "Harga", "Status", "Aksi"]}>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{formatCurrency(item.price)}</td>
                  <td className="px-4 py-3">
                    <StatusDot tone={item.isActive ? "idle" : "danger"} label={item.isActive ? "ACTIVE" : "INACTIVE"} />
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
