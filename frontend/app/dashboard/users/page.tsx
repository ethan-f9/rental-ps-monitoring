"use client";

import { FormEvent, useEffect, useState } from "react";

import { DataTable } from "@/components/DataTable";
import Layout from "@/components/Layout";
import { Panel } from "@/components/Panel";
import { ProtectedPage } from "@/components/ProtectedPage";
import { StatusDot } from "@/components/StatusDot";
import { api, ApiError } from "@/lib/api";
import type { AuthUser } from "@/types/api";

export default function UsersPage() {
  return (
    <ProtectedPage requiredRole="OWNER">
      {(session) => <UsersContent user={session.user as any} />}
    </ProtectedPage>
  );
}

function UsersContent({ user }: { user: { id: string; name: string; email: string; role: "OWNER" } }) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
      setError(null);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat memuat pengguna");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (editingId) {
        await api.updateUser(editingId, {
          name,
          email,
          ...(password ? { password } : {})
        });
      } else {
        await api.createUser({
          name,
          email,
          password,
          role: "OPERATOR"
        });
      }

      resetForm();
      await loadUsers();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat menyimpan pengguna");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteUser(id);
      await loadUsers();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Tidak dapat menghapus pengguna");
    }
  };

  const startEdit = (targetUser: AuthUser) => {
    setEditingId(targetUser.id);
    setName(targetUser.name);
    setEmail(targetUser.email);
    setPassword("");
  };

  return (
    <Layout user={user} title="Pengguna" subtitle="Kelola akun operator dan tingkat akses untuk area rental.">
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Panel eyebrow="Form Pengguna" title={editingId ? "Ubah pengguna" : "Buat operator"}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500" htmlFor="user-name">
                Nama
              </label>
              <input id="user-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500" htmlFor="user-email">
                Email
              </label>
              <input id="user-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500" htmlFor="user-password">
                Password
              </label>
              <input
                id="user-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required={!editingId}
              />
            </div>
            {error ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
            <div className="flex gap-3">
              <button type="submit" className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300">
                {editingId ? "Perbarui pengguna" : "Buat operator"}
              </button>
              {editingId ? (
                <button type="button" onClick={resetForm} className="rounded-xl border border-white/10 px-4 py-3 text-zinc-200 transition hover:bg-white/5">
                  Batal
                </button>
              ) : null}
            </div>
          </form>
        </Panel>

        <Panel eyebrow="Akun" title="Daftar pengguna">
          {loading ? (
            <p className="text-sm text-zinc-400">Memuat pengguna...</p>
          ) : (
            <DataTable columns={["Nama", "Email", "Peran", "Aksi"]}>
              {users.map((targetUser) => (
                <tr key={targetUser.id}>
                  <td className="px-4 py-3">{targetUser.name}</td>
                  <td className="px-4 py-3">{targetUser.email}</td>
                  <td className="px-4 py-3">
                    <StatusDot tone={targetUser.role === "OWNER" ? "warning" : "active"} label={targetUser.role} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEdit(targetUser)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-200 transition hover:bg-white/5">
                        Ubah
                      </button>
                      <button type="button" onClick={() => void handleDelete(targetUser.id)} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/20">
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
