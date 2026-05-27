"use client"

import { useEffect, useState } from "react"
import { CalendarDays, Loader2, CheckCircle2, XCircle, Clock, Info } from "lucide-react"
import { toast } from "sonner"

interface Outpass {
  id: string
  reason: string
  destination: string
  fromDate: string
  toDate: string
  status: string
  createdAt: string
  hodRemarks?: string
  user: {
    name: string
    email: string
    phone?: string
    department?: string
    room?: { roomNumber: string; block: string } | null
  }
}

const statusColor: Record<string, string> = {
  PENDING: "text-amber-600 bg-amber-50 border-amber-200",
  PENDING_WARDEN: "text-blue-600 bg-blue-50 border-blue-200",
  APPROVED: "text-emerald-600 bg-emerald-50 border-emerald-200",
  REJECTED: "text-red-600 bg-red-50 border-red-200",
  EXPIRED: "text-gray-500 bg-gray-100 border-gray-200",
}

const statusLabel: Record<string, string> = {
  PENDING: "Pending HOD",
  PENDING_WARDEN: "Pending Warden",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
}

export default function AdminLeaveApprovalsPage() {
  const [outpasses, setOutpasses] = useState<Outpass[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("PENDING")
  const [selected, setSelected] = useState<Outpass | null>(null)
  const [remarks, setRemarks] = useState("")
  const [updating, setUpdating] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})

  const fetch_ = async (status?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "50" })
      if ((status || filterStatus) !== "ALL") params.set("status", status || filterStatus)
      const res = await fetch(`/api/outpasses?${params}`)
      const data = await res.json()
      setOutpasses(data.outpasses || [])
    } finally { setLoading(false) }
  }

  // Load counts for all statuses once
  const loadCounts = async () => {
    try {
      const results = await Promise.all(
        ["PENDING", "PENDING_WARDEN", "APPROVED", "REJECTED"].map(async s => {
          const res = await fetch(`/api/outpasses?status=${s}&limit=1`)
          const d = await res.json()
          return [s, d.total || 0]
        })
      )
      setCounts(Object.fromEntries(results))
    } catch { /* silent */ }
  }

  useEffect(() => { loadCounts() }, [])
  useEffect(() => { fetch_() }, [filterStatus])

  const handle = async (id: string, newStatus: "PENDING_WARDEN" | "REJECTED") => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/outpasses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, remarks })
      })
      if (res.ok) {
        toast.success(newStatus === "PENDING_WARDEN"
          ? "✅ Approved by HOD — forwarded to Warden"
          : "❌ Request rejected by HOD"
        )
        setSelected(null)
        setRemarks("")
        fetch_()
        loadCounts()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to update")
      }
    } finally { setUpdating(false) }
  }

  const pendingCount = counts["PENDING"] || 0
  const tabs = [
    { value: "PENDING", label: "Needs HOD Review" },
    { value: "PENDING_WARDEN", label: "With Warden" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "ALL", label: "All" },
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">HOD Leave Approvals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review outpass requests from students in your department
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-700">{pendingCount} needs HOD review</span>
          </div>
        )}
      </div>

      {/* Workflow Explanation */}
      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">HOD Approval Stage (Stage 1 of 2)</p>
          <p className="text-xs text-blue-700 mt-0.5">
            As HOD, you review <strong>PENDING</strong> requests first. If you approve, the request moves to the Warden for final decision. If you reject, the student is notified immediately.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              filterStatus === tab.value
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card hover:bg-muted"
            }`}
          >
            {tab.label}
            {counts[tab.value] > 0 && (
              <span className={`rounded-full px-1.5 py-px text-[10px] font-bold ${
                filterStatus === tab.value ? "bg-white/20" : "bg-primary/10 text-primary"
              }`}>
                {counts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold">Leave Request Details</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {/* Student Info */}
            <div className="rounded-lg bg-muted p-3 mb-4">
              <p className="font-semibold text-foreground">{selected.user.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {selected.user.room && (
                  <span>Room {selected.user.room.roomNumber} · Block {selected.user.room.block}</span>
                )}
                {selected.user.department && <span>{selected.user.department}</span>}
                {selected.user.phone && <span>{selected.user.phone}</span>}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium border ${statusColor[selected.status]}`}>
                  {statusLabel[selected.status] || selected.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reason</p>
                <p className="mt-0.5 font-medium">{selected.reason}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="mt-0.5 font-medium">{selected.destination}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="mt-0.5 font-medium">{new Date(selected.fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="mt-0.5 font-medium">{new Date(selected.toDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Applied On</p>
                <p className="mt-0.5 text-xs">{new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>

              {/* Remarks input (only for PENDING status) */}
              {selected.status === "PENDING" && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    HOD Remarks <span className="text-muted-foreground/60">(optional — visible to student & warden)</span>
                  </label>
                  <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Add remarks for warden and student..."
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selected.status === "PENDING" ? (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handle(selected.id, "REJECTED")}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-50 border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </button>
                <button
                  onClick={() => handle(selected.id, "PENDING_WARDEN")}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-50 border border-blue-200 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve → Warden
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSelected(null)}
                className="mt-4 w-full rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : outpasses.length === 0 ? (
          <div className="flex flex-col items-center py-16 rounded-xl border border-dashed border-border bg-card">
            {filterStatus === "PENDING" ? (
              <>
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3" />
                <p className="text-foreground font-semibold">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">No pending leave requests to review.</p>
              </>
            ) : (
              <>
                <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">No requests found</p>
              </>
            )}
          </div>
        ) : outpasses.map(o => {
          const Icon = o.status === "APPROVED" ? CheckCircle2 : o.status === "REJECTED" ? XCircle : Clock
          const days = Math.ceil((new Date(o.toDate).getTime() - new Date(o.fromDate).getTime()) / 86400000) + 1
          return (
            <div
              key={o.id}
              onClick={() => { setSelected(o); setRemarks("") }}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-2.5 border ${statusColor[o.status]?.split(" ").slice(1).join(" ") || "bg-muted border-border"}`}>
                  <Icon className={`h-5 w-5 ${statusColor[o.status]?.split(" ")[0] || "text-foreground"}`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {o.user.name}
                    <span className="text-xs font-normal text-muted-foreground ml-2">
                      {o.user.room ? `· Rm ${o.user.room.roomNumber}` : ""} {o.user.department ? `· ${o.user.department}` : ""}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {o.destination} · {new Date(o.fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} →{" "}
                    {new Date(o.toDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {days} day{days !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium border ${statusColor[o.status]}`}>
                {statusLabel[o.status] || o.status}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
