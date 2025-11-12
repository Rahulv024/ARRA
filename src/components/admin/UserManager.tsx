"use client";

import { useEffect, useState } from "react";

type UserRow = { id: string; email: string; role: "ADMIN" | "USER"; createdAt: string };

export default function UserManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const j = await res.json();
    if (!res.ok) { setError(j?.error || "Failed to load users"); setLoading(false); return; }
    setUsers(j.users || []); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function setRole(userId: string, role: "ADMIN" | "USER") {
    const prev = users.slice();
    setUsers((u) => u.map((x) => (x.id === userId ? { ...x, role } : x)));
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (!res.ok) { setUsers(prev); alert("Failed to update role"); }
  }

  async function removeUser(userId: string) {
    if (!confirm("Delete this user? This will remove their lists, favorites, and reviews.")) return;
    const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
    if (!res.ok) { const j = await res.json(); alert(j.error || "Failed to delete user"); return; }
    setUsers((u) => u.filter((x) => x.id !== userId));
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Users</h2>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/40">
            <tr className="text-left">
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-3" colSpan={3}>Loading…</td></tr>
            ) : users.length ? (
              users.map((u) => (
                <tr key={u.id} className="border-t dark:border-zinc-800">
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button className={`btn ${u.role==='ADMIN' ? 'primary' : ''}`} onClick={() => setRole(u.id, 'ADMIN')}>Make admin</button>
                      <button className={`btn ${u.role==='USER' ? 'primary' : ''}`} onClick={() => setRole(u.id, 'USER')}>Make user</button>
                      <button className="btn text-rose-600" onClick={() => removeUser(u.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="px-3 py-3" colSpan={3}>No users</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {error && <div className="text-sm text-rose-600">{error}</div>}
    </section>
  );
}
