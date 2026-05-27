"use client"

import { useEffect, useState } from "react"
import { CreditCard, Loader2, Search, Plus, CheckCircle2, Download } from "lucide-react"
import { toast } from "sonner"

interface Fee { id: string; month: string; year: number; roomRent: number; messCharges: number; otherCharges: number; totalAmount: number; paid: number; due: number; status: string; paidAt?: string; user: { name: string; email: string; room?: { roomNumber: string } | null } }

const statusColors: Record<string, string> = { PENDING: "text-amber-600 bg-amber-50 border-amber-200", PARTIAL: "text-blue-600 bg-blue-50 border-blue-200", PAID: "text-emerald-600 bg-emerald-50 border-emerald-200", WAIVED: "text-gray-600 bg-gray-100 border-gray-200" }

export default function AdminFeesPage() {
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [search, setSearch] = useState("")
  const [filterMonth] = useState("")
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState<Fee | null>(null)
  const [payAmount, setPayAmount] = useState("")
  const [paying, setPaying] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetch_ = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "20", page: String(page) })
      if (filterStatus !== "ALL") params.set("status", filterStatus)
      if (filterMonth) params.set("month", filterMonth)
      const res = await fetch(`/api/fees?${params}`)
      const data = await res.json()
      let list = data.fees || []
      if (search) list = list.filter((f: Fee) => f.user.name.toLowerCase().includes(search.toLowerCase()) || f.user.email.toLowerCase().includes(search.toLowerCase()))
      setFees(list)
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch_() }, [filterStatus, filterMonth, page])
  useEffect(() => { const t = setTimeout(fetch_, 400); return () => clearTimeout(t) }, [search])

  const generateFees = async () => {
    const month = prompt("Month name (e.g. March):");
    if (!month) return
    const year = prompt("Year (e.g. 2025):", String(new Date().getFullYear()))
    if (!year) return
    setGenerating(true)
    try {
      const res = await fetch("/api/fees/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month, year }) })
      const data = await res.json()
      if (res.ok) { toast.success(`${data.created} fee records created!`); fetch_() }
      else { toast.error(data.error || "Failed") }
    } finally { setGenerating(false) }
  }

  const handlePayment = async () => {
    if (!selected || !payAmount) { toast.error("Enter amount"); return }
    const amt = parseFloat(payAmount)
    if (isNaN(amt) || amt <= 0) { toast.error("Invalid amount"); return }
    setPaying(true)
    try {
      const res = await fetch(`/api/fees/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid: selected.paid + amt }) })
      if (res.ok) { toast.success("Payment recorded!"); setSelected(null); setPayAmount(""); fetch_() }
      else { toast.error("Failed") }
    } finally { setPaying(false) }
  }

  const totalCollected = fees.reduce((s, f) => s + f.paid, 0)
  const totalDue = fees.reduce((s, f) => s + f.due, 0)

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} total fee records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateFees} disabled={generating} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Generate Fees
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Collected (this view)</p><p className="text-xl font-bold text-emerald-600">₹{totalCollected.toLocaleString()}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-xl font-bold text-red-600">₹{totalDue.toLocaleString()}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Records</p><p className="text-xl font-bold text-foreground">{total}</p></div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm focus:outline-none" placeholder="Search student..." />
        </div>
        {["ALL", "PENDING", "PARTIAL", "PAID", "WAIVED"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>{s}</button>
        ))}
      </div>

      {/* Payment Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Record Payment</h2>
            <div className="space-y-2 text-sm mb-4">
              <p className="font-semibold">{selected.user.name} <span className="font-normal text-muted-foreground">· {selected.user.room?.roomNumber}</span></p>
              <p className="text-muted-foreground">{selected.month} {selected.year}</p>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="rounded-lg bg-muted p-2 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="font-bold">₹{selected.totalAmount.toLocaleString()}</p></div>
                <div className="rounded-lg bg-emerald-50 p-2 text-center"><p className="text-xs text-emerald-600">Paid</p><p className="font-bold text-emerald-700">₹{selected.paid.toLocaleString()}</p></div>
                <div className="rounded-lg bg-red-50 p-2 text-center"><p className="text-xs text-red-600">Due</p><p className="font-bold text-red-700">₹{selected.due.toLocaleString()}</p></div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Payment Amount (₹)</label>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} max={selected.due} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder={`Max ₹${selected.due}`} />
              <button onClick={() => setPayAmount(String(selected.due))} className="mt-1 text-xs text-primary hover:underline">Pay full amount (₹{selected.due})</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={handlePayment} disabled={paying} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        : fees.length === 0 ? (
          <div className="flex flex-col items-center py-16 rounded-xl border border-dashed border-border bg-card mt-5">
            <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No fee records found</p>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Period</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fees.map(f => (
                  <tr key={f.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3"><p className="font-medium">{f.user.name}</p><p className="text-xs text-muted-foreground">{f.user.room?.roomNumber || "No room"}</p></td>
                    <td className="px-4 py-3 text-muted-foreground">{f.month} {f.year}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{f.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">₹{f.paid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">₹{f.due.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${statusColors[f.status]}`}>{f.status}</span></td>
                    <td className="px-4 py-3 text-center">
                      {f.status !== "PAID" && f.status !== "WAIVED" ? (
                        <button onClick={() => { setSelected(f); setPayAmount("") }} className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-100 flex items-center gap-1 mx-auto">
                          <CheckCircle2 className="h-3 w-3" /> Pay
                        </button>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-muted">← Prev</button>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-muted">Next →</button>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  )
}
