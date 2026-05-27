"use client"

import { useEffect, useState } from "react"
import { Users, Loader2, Plus, Edit2, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Warden { id: string; name: string; email: string; phone?: string; isActive: boolean; createdAt: string }

export default function AdminWardensPage() {
  const [wardens, setWardens] = useState<Warden[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "Warden@123", role: "WARDEN" })
  const [saving, setSaving] = useState(false)
  const [editWarden, setEditWarden] = useState<Warden | null>(null)
  const [editForm, setEditForm] = useState({ name: "", phone: "", isActive: true })

  const fetch_ = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/users?role=WARDEN&limit=50")
      const data = await res.json()
      setWardens(data.users || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch_() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email) { toast.error("Name and email required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (res.ok) { toast.success("Warden account created!"); setShowCreate(false); setForm({ name: "", email: "", phone: "", password: "Warden@123", role: "WARDEN" }); fetch_() }
      else { const err = await res.json(); toast.error(err.error || "Failed") }
    } finally { setSaving(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editWarden) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${editWarden.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) })
      if (res.ok) { toast.success("Updated!"); setEditWarden(null); fetch_() }
      else { toast.error("Failed") }
    } finally { setSaving(false) }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this warden?")) return
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Warden deactivated"); fetch_() }
    else { toast.error("Failed") }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-bold">Wardens Management</h1><p className="mt-1 text-sm text-muted-foreground">{wardens.length} wardens</p></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> Add Warden</button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Create Warden Account</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Full Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Initial Password</label><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editWarden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Edit Warden: {editWarden.name}</h2>
            <form onSubmit={handleEdit} className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Full Name</label><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Phone</label><input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></div>
              <div className="flex items-center gap-3"><label className="text-sm font-medium">Active</label><input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditWarden(null)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        : wardens.length === 0 ? (
          <div className="flex flex-col items-center py-16 rounded-xl border border-dashed border-border bg-card"><Users className="h-10 w-10 text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">No wardens yet</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wardens.map(w => (
              <div key={w.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-lg font-bold">{w.name.charAt(0)}</div>
                    <div>
                      <p className="font-semibold text-foreground">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.email}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${w.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{w.isActive ? "Active" : "Inactive"}</span>
                </div>
                {w.phone && <p className="mt-3 text-sm text-muted-foreground">📞 {w.phone}</p>}
                <p className="mt-1 text-xs text-muted-foreground">Joined: {new Date(w.createdAt).toLocaleDateString()}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => { setEditWarden(w); setEditForm({ name: w.name, phone: w.phone || "", isActive: w.isActive }) }} className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-xs font-medium hover:bg-muted"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
                  {w.isActive && <button onClick={() => handleDeactivate(w.id)} className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
