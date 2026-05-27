"use client"

import { useEffect, useState } from "react"
import { Bell, Loader2, Search } from "lucide-react"

const CATEGORIES = ["ALL", "GENERAL", "URGENT", "EVENT", "MAINTENANCE", "MESS", "FEE"]

const categoryColors: Record<string, string> = {
  GENERAL: "text-gray-600 bg-gray-100",
  URGENT: "text-red-600 bg-red-50",
  EVENT: "text-purple-600 bg-purple-50",
  MAINTENANCE: "text-orange-600 bg-orange-50",
  MESS: "text-green-600 bg-green-50",
  FEE: "text-amber-600 bg-amber-50",
}

const priorityColors: Record<string, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-amber-600",
  HIGH: "text-orange-600",
  URGENT: "text-red-600 font-bold",
}

interface Notice {
  id: string; title: string; content: string; category: string; priority: string; createdAt: string; expiresAt?: string
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("ALL")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Notice | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchNotices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" })
      if (category !== "ALL") params.set("category", category)
      if (search) params.set("search", search)
      const res = await fetch(`/api/notices?${params}`)
      const data = await res.json()
      setNotices(data.notices || [])
      setTotalPages(data.totalPages || 1)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchNotices() }, [category, page])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchNotices() }, 400)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notices</h1>
        <p className="mt-1 text-sm text-muted-foreground">Official announcements and hostel notices</p>
      </div>

      {/* Search & Filter */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Search notices..." />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => { setCategory(c); setPage(1) }} className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${category === c ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground hover:bg-muted"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Notice Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">{selected.title}</h2>
                <div className="flex gap-2 mt-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[selected.category]}`}>{selected.category}</span>
                  <span className={`text-xs ${priorityColors[selected.priority]}`}>{selected.priority} Priority</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground p-1">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.content}</p>
            </div>
            <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">{new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              {selected.expiresAt && <p className="text-xs text-muted-foreground">Expires: {new Date(selected.expiresAt).toLocaleDateString()}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Notices List */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
            <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No notices found</p>
          </div>
        ) : notices.map((n) => (
          <div key={n.id} onClick={() => setSelected(n)} className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0 mt-0.5">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-foreground ${n.priority === "URGENT" ? "text-red-600" : ""}`}>{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                </div>
              </div>
              <span className={`flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${categoryColors[n.category]}`}>{n.category}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors">← Previous</button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors">Next →</button>
        </div>
      )}
    </div>
  )
}
