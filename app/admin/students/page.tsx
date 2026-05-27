"use client"

import { useEffect, useState } from "react"
import { Users, Loader2, Search, Plus, Trash2, Edit2 } from "lucide-react"
import { toast } from "sonner"

interface User { id: string; name: string; email: string; phone?: string; isActive: boolean; role: string; createdAt: string; room?: { roomNumber: string } | null }

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "Student@123", address: "", role: "STUDENT" })
  const [saving, setSaving] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "", isActive: true })

  const fetch_ = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ role: "STUDENT", page: String(page), limit: "20" })
      if (search) params.set("search", search)
      const res = await fetch(`/api/users?${params}`)
      const data = await res.json()
      setStudents(data.users || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } finally { setLoading(false) }
  }

  useEffect(() => { const t = setTimeout(fetch_, search ? 400 : 0); return () => clearTimeout(t) }, [search, page])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { toast.error("Name, email, password required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (res.ok) { toast.success("Student created!"); setShowCreate(false); setForm({ name: "", email: "", phone: "", password: "Student@123", address: "", role: "STUDENT" }); fetch_() }
      else { const err = await res.json(); toast.error(err.error || "Failed") }
    } finally { setSaving(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${editUser.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) })
      if (res.ok) { toast.success("Updated!"); setEditUser(null); fetch_() }
      else { toast.error("Failed to update") }
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this student?")) return
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Student deactivated"); fetch_() }
    else { toast.error("Failed") }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Students Management</h1><p className="mt-1 text-sm text-muted-foreground">{total} total students</p></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> Add Student</button>
      </div>

      <div className="mt-5 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-sm" placeholder="Search by name or email..." />
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Add New Student</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Full Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div><label className="block text-sm font-medium mb-1">Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div><label className="block text-sm font-medium mb-1">Password *</label><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Edit Student: {editUser.name}</h2>
            <form onSubmit={handleEdit} className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Full Name</label><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Phone</label><input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Address</label><textarea value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none resize-none" /></div>
              <div className="flex items-center gap-3"><label className="text-sm font-medium">Active</label><input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditUser(null)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        : students.length === 0 ? (
          <div className="flex flex-col items-center py-16 rounded-xl border border-dashed border-border bg-card mt-5"><Users className="h-10 w-10 text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">No students found</p></div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr className="text-xs font-semibold text-muted-foreground uppercase"><th className="px-4 py-3 text-left">Student</th><th className="px-4 py-3 text-left">Phone</th><th className="px-4 py-3 text-left">Room</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Actions</th></tr></thead>
              <tbody className="divide-y divide-border">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">{s.name.charAt(0)}</div><div><p className="font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.email}</p></div></div></td>
                    <td className="px-4 py-3 text-muted-foreground">{s.phone || "—"}</td>
                    <td className="px-4 py-3">{s.room?.roomNumber || <span className="text-muted-foreground text-xs">Not assigned</span>}</td>
                    <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{s.isActive ? "Active" : "Inactive"}</span></td>
                    <td className="px-4 py-3 text-center"><div className="flex gap-2 justify-center">
                      <button onClick={() => { setEditUser(s); setEditForm({ name: s.name, phone: s.phone || "", address: "", isActive: s.isActive }) }} className="rounded-lg bg-muted p-1.5 hover:bg-muted/80"><Edit2 className="h-3.5 w-3.5" /></button>
                      {s.isActive && <button onClick={() => handleDelete(s.id)} className="rounded-lg bg-red-50 border border-red-200 p-1.5 text-red-600 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && <div className="flex items-center justify-between px-4 py-3 border-t border-border"><span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-muted">← Prev</button><button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-muted">Next →</button></div></div>}
          </div>
        )}
    </div>
  )
}
