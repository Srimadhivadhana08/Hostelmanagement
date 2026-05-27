"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface Complaint {
  id: string; title: string; description: string; category: string; status: string; priority: string; createdAt: string; resolution?: string; assignedTo?: string
  user: { name: string; email: string; room?: { roomNumber: string; block: string } | null }
}

const statusColors: Record<string, string> = { OPEN: "text-amber-600 bg-amber-50 border-amber-200", IN_PROGRESS: "text-blue-600 bg-blue-50 border-blue-200", RESOLVED: "text-emerald-600 bg-emerald-50 border-emerald-200", CLOSED: "text-gray-600 bg-gray-100 border-gray-200" }
const priorityColors: Record<string, string> = { LOW: "text-gray-600 bg-gray-100", MEDIUM: "text-amber-600 bg-amber-50", HIGH: "text-orange-600 bg-orange-50", URGENT: "text-red-600 bg-red-50" }

export default function WardenComplaintsPage() {
  const { data: session } = useSession()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterPriority, setFilterPriority] = useState("ALL")
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [resolution, setResolution] = useState("")
  const [updating, setUpdating] = useState(false)

  const fetch_ = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "ALL") params.set("status", filterStatus)
      if (filterPriority !== "ALL") params.set("priority", filterPriority)
      const res = await fetch(`/api/complaints?${params}&limit=50`)
      const data = await res.json()
      setComplaints(data.complaints || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch_() }, [filterStatus, filterPriority])

  const update = async (id: string, status: string) => {
    setUpdating(true)
    try {
      const body: Record<string, unknown> = { status }
      if (status === "IN_PROGRESS") body.assignedTo = session?.user?.id
      if (status === "RESOLVED" && resolution) body.resolution = resolution
      const res = await fetch(`/api/complaints/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (res.ok) { toast.success("Complaint updated"); setSelected(null); fetch_() }
      else { toast.error("Failed to update") }
    } finally { setUpdating(false) }
  }

  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Complaints Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review, assign and resolve student complaints</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
          {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(s => <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s.replace("_", " ")}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
          {["ALL", "URGENT", "HIGH", "MEDIUM", "LOW"].map(p => <option key={p} value={p}>{p === "ALL" ? "All Priorities" : p}</option>)}
        </select>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2 flex-wrap">
                <span className={`rounded-full px-2 py-1 text-xs font-medium border ${statusColors[selected.status]}`}>{selected.status.replace("_", " ")}</span>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityColors[selected.priority]}`}>{selected.priority}</span>
                <span className="rounded-full px-2 py-1 text-xs font-medium bg-muted text-muted-foreground">{selected.category}</span>
              </div>
              <p className="text-muted-foreground text-xs">Student: {selected.user.name} · Room {selected.user.room?.roomNumber || "—"}</p>
              <p className="text-foreground">{selected.description}</p>
              {(selected.status === "OPEN" || selected.status === "IN_PROGRESS") && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Resolution Notes (for resolving)</label>
                  <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Describe the resolution..." />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {selected.status === "OPEN" && (
                <button onClick={() => update(selected.id, "IN_PROGRESS")} disabled={updating} className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 flex items-center gap-1">
                  {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Assign to Me
                </button>
              )}
              {(selected.status === "OPEN" || selected.status === "IN_PROGRESS") && (
                <button onClick={() => update(selected.id, "RESOLVED")} disabled={updating} className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-100 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                </button>
              )}
              {selected.status === "RESOLVED" && (
                <button onClick={() => update(selected.id, "CLOSED")} disabled={updating} className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200">Close</button>
              )}
              <button onClick={() => setSelected(null)} className="ml-auto rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center py-16 rounded-xl border border-dashed border-border bg-card">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No complaints found</p>
          </div>
        ) : complaints.map(c => (
          <div key={c.id} onClick={() => { setSelected(c); setResolution(c.resolution || "") }} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-amber-50 p-2.5 flex-shrink-0"><AlertTriangle className="h-5 w-5 text-amber-500" /></div>
              <div>
                <p className="font-semibold text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.user.name} · Room {c.user.room?.roomNumber || "—"} · {c.category} · {new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityColors[c.priority]}`}>{c.priority}</span>
              <span className={`rounded-full px-2 py-1 text-xs font-medium border ${statusColors[c.status]}`}>{c.status.replace("_", " ")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
