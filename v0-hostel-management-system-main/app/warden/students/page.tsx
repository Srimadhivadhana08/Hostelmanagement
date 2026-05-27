"use client"

import { useEffect, useState } from "react"
import { Users, Loader2, Search, Download } from "lucide-react"

interface Student { id: string; name: string; email: string; phone?: string; isActive: boolean; createdAt: string; room?: { roomNumber: string; block: string } | null }

export default function WardenStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterActive, setFilterActive] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetch_ = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ role: "STUDENT", page: String(page), limit: "20" })
      if (search) params.set("search", search)
      const res = await fetch(`/api/users?${params}`)
      const data = await res.json()
      let users = data.users || []
      if (filterActive === "ACTIVE") users = users.filter((u: Student) => u.isActive)
      else if (filterActive === "INACTIVE") users = users.filter((u: Student) => !u.isActive)
      setStudents(users)
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    const t = setTimeout(fetch_, 400)
    return () => clearTimeout(t)
  }, [search, page, filterActive])

  const exportCSV = () => {
    const rows = [["Name", "Email", "Phone", "Room", "Block", "Status"], ...students.map(s => [s.name, s.email, s.phone || "", s.room?.roomNumber || "", s.room?.block || "", s.isActive ? "Active" : "Inactive"])]
    const csv = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "students.csv"; a.click()
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} total students</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Search by name, email, phone..." />
        </div>
        <div className="flex gap-2">
          {["ALL", "ACTIVE", "INACTIVE"].map(s => (
            <button key={s} onClick={() => setFilterActive(s)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${filterActive === s ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-xl border border-dashed border-border bg-card mt-5">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No students found</p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-xs font-semibold text-muted-foreground uppercase">
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Room</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">{s.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone || "—"}</td>
                  <td className="px-4 py-3">
                    {s.room ? (
                      <div>
                        <p className="font-medium">{s.room.roomNumber}</p>
                        <p className="text-xs text-muted-foreground">Block {s.room.block}</p>
                      </div>
                    ) : <span className="text-muted-foreground">Not assigned</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{s.isActive ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-muted">← Previous</button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-muted">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
