"use client"

import { useEffect, useState } from "react"
import { Bell, Plus, Loader2, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

interface Notice { id: string; title: string; content: string; category: string; priority: string; createdAt: string; postedBy: string; isActive: boolean; expiresAt?: string }

const categoryColors: Record<string, string> = { GENERAL: "text-gray-600 bg-gray-100", URGENT: "text-red-600 bg-red-50", EVENT: "text-purple-600 bg-purple-50", MAINTENANCE: "text-orange-600 bg-orange-50", MESS: "text-green-600 bg-green-50", FEE: "text-amber-600 bg-amber-50" }
const CATEGORIES = ["GENERAL", "URGENT", "EVENT", "MAINTENANCE", "MESS", "FEE"]
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"]

export default function WardenNoticesPage() {
  const { data: session } = useSession()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", content: "", category: "GENERAL", priority: "MEDIUM", expiresAt: "" })
  const [saving, setSaving] = useState(false)

  const fetch_ = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notices?limit=30&active=true")
      const data = await res.json()
      setNotices(data.notices || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch_() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.content) { toast.error("Title and content required"); return }
    setSaving(true)
    try {
      const body: Record<string, unknown> = { ...form }
      if (!form.expiresAt) delete body.expiresAt
      const res = await fetch("/api/notices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (res.ok) { toast.success("Notice posted!"); setShowForm(false); setForm({ title: "", content: "", category: "GENERAL", priority: "MEDIUM", expiresAt: "" }); fetch_() }
      else { toast.error("Failed to post notice") }
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notice?")) return
    const res = await fetch(`/api/notices/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Notice deleted"); fetch_() }
    else { toast.error("Failed to delete") }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notice Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">Post and manage hostel notices</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Post Notice
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Post New Notice</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Category</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Priority</label><select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Content *</label><textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div><label className="block text-sm font-medium mb-1">Expires On (optional)</label><input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Post Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          : notices.length === 0 ? (
            <div className="flex flex-col items-center py-16 rounded-xl border border-dashed border-border bg-card"><Bell className="h-10 w-10 text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">No notices yet. Post the first one!</p></div>
          ) : notices.map(n => (
            <div key={n.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[n.category]}`}>{n.category}</span>
                    <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    {n.expiresAt && <span className="text-xs text-muted-foreground">· Expires {new Date(n.expiresAt).toLocaleDateString()}</span>}
                  </div>
                  <h3 className="font-semibold text-foreground">{n.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.content}</p>
                </div>
                {n.postedBy === session?.user?.id && (
                  <button onClick={() => handleDelete(n.id)} className="flex-shrink-0 rounded-lg bg-red-50 border border-red-200 p-2 text-red-600 hover:bg-red-100 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
