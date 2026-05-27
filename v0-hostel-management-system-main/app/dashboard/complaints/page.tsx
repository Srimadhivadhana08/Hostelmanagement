"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { AlertTriangle, Plus, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

const CATEGORIES = ["ELECTRICAL", "PLUMBING", "FURNITURE", "CLEANING", "SECURITY", "NOISE", "FOOD", "OTHER"]
const STATUSES = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"]

const statusColors: Record<string, string> = {
  OPEN: "text-amber-600 bg-amber-50 border-amber-200",
  IN_PROGRESS: "text-blue-600 bg-blue-50 border-blue-200",
  RESOLVED: "text-emerald-600 bg-emerald-50 border-emerald-200",
  CLOSED: "text-gray-600 bg-gray-100 border-gray-200",
}

const priorityColors: Record<string, string> = {
  LOW: "text-gray-600 bg-gray-100",
  MEDIUM: "text-amber-600 bg-amber-50",
  HIGH: "text-orange-600 bg-orange-50",
  URGENT: "text-red-600 bg-red-50",
}

interface Complaint {
  id: string; title: string; description: string; category: string
  status: string; priority: string; createdAt: string; resolvedAt?: string; resolution?: string
}

export default function ComplaintsPage() {
  const { data: session } = useSession()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterCategory, setFilterCategory] = useState("ALL")
  const [form, setForm] = useState({ title: "", description: "", category: "ELECTRICAL", priority: "MEDIUM" })
  const [submitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<Complaint | null>(null)

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "ALL") params.set("status", filterStatus)
      if (filterCategory !== "ALL") params.set("category", filterCategory)
      const res = await fetch(`/api/complaints?${params}`)
      const data = await res.json()
      setComplaints(data.complaints || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchComplaints() }, [filterStatus, filterCategory, session?.user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) { toast.error("Title and description required"); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/complaints", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (res.ok) { toast.success("Complaint filed successfully!"); setShowForm(false); setForm({ title: "", description: "", category: "ELECTRICAL", priority: "MEDIUM" }); fetchComplaints() }
      else { const err = await res.json(); toast.error(err.error || "Failed to file complaint") }
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this complaint?")) return
    const res = await fetch(`/api/complaints/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Complaint deleted"); setSelected(null); fetchComplaints() }
    else { toast.error("Cannot delete this complaint") }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Complaints</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track and manage your hostel complaints</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> File Complaint
        </button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
          {STATUSES.map(s => <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s.replace("_", " ")}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="ALL">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Complaint Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground mb-4">File New Complaint</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Brief description of issue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Describe the issue in detail..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground p-1">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2 flex-wrap">
                <span className={`rounded-full px-2 py-1 text-xs font-medium border ${statusColors[selected.status]}`}>{selected.status.replace("_", " ")}</span>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityColors[selected.priority]}`}>{selected.priority}</span>
                <span className="rounded-full px-2 py-1 text-xs font-medium bg-muted text-muted-foreground">{selected.category}</span>
              </div>
              <p className="text-foreground">{selected.description}</p>
              <p className="text-muted-foreground">Filed: {new Date(selected.createdAt).toLocaleDateString()}</p>
              {selected.resolution && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">Resolution</p>
                  <p className="text-sm text-emerald-800">{selected.resolution}</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              {selected.status === "OPEN" && (
                <button onClick={() => handleDelete(selected.id)} className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              )}
              <button onClick={() => setSelected(null)} className="ml-auto rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Complaints List */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No complaints found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">File a complaint to get started</p>
          </div>
        ) : complaints.map((c) => (
          <div key={c.id} onClick={() => setSelected(c)} className="flex items-center justify-between rounded-xl border border-border bg-card p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-amber-50 p-2.5 flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.category} · {new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`rounded-full px-3 py-1 text-xs font-medium border ${statusColors[c.status]}`}>{c.status.replace("_", " ")}</span>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityColors[c.priority]}`}>{c.priority}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
