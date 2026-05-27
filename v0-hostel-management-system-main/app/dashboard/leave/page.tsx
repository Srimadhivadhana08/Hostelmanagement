"use client"

import { useEffect, useState } from "react"
import { CalendarDays, Plus, Loader2, CheckCircle2, XCircle, Clock, ChevronRight, Info } from "lucide-react"
import { toast } from "sonner"

// Workflow stages shown to the student
const WORKFLOW_STEPS = [
  { label: "Submitted", desc: "Your request is submitted" },
  { label: "HOD Review", desc: "Department Head reviews" },
  { label: "Warden Review", desc: "Warden gives final approval" },
  { label: "Decision", desc: "Final approval or rejection" },
]

const statusConfig: Record<string, {
  text: string; bg: string; border: string
  icon: React.ElementType; label: string; step: number; desc: string
}> = {
  PENDING: {
    text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200",
    icon: Clock, label: "Pending HOD Review",
    step: 1, desc: "Your request is waiting for HOD/Admin approval."
  },
  PENDING_WARDEN: {
    text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200",
    icon: Clock, label: "Pending Warden Review",
    step: 2, desc: "HOD has approved. Awaiting Warden's final decision."
  },
  APPROVED: {
    text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200",
    icon: CheckCircle2, label: "Approved",
    step: 3, desc: "Your leave request has been fully approved."
  },
  REJECTED: {
    text: "text-red-600", bg: "bg-red-50", border: "border-red-200",
    icon: XCircle, label: "Rejected",
    step: 3, desc: "Your leave request has been rejected."
  },
  EXPIRED: {
    text: "text-gray-500", bg: "bg-gray-100", border: "border-gray-200",
    icon: CalendarDays, label: "Expired",
    step: 3, desc: "This leave request has expired."
  },
}

interface Outpass {
  id: string
  reason: string
  destination: string
  fromDate: string
  toDate: string
  status: string
  createdAt: string
  remarks?: string
  hodRemarks?: string
  approvedAt?: string
  hodApprovedAt?: string
}

function WorkflowStepper({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.PENDING
  const currentStep = cfg.step
  const isRejected = status === "REJECTED"

  return (
    <div className="mt-4 rounded-xl bg-muted/50 border border-border p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Approval Workflow</p>
      <div className="flex items-center gap-0">
        {WORKFLOW_STEPS.map((step, idx) => {
          const stepNum = idx
          const isComplete = stepNum < currentStep && !isRejected
          const isCurrent = stepNum === currentStep && !isRejected
          const isRejectedStep = isRejected && stepNum === currentStep

          return (
            <div key={step.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all flex-shrink-0 ${
                  isRejectedStep ? "border-red-500 bg-red-500 text-white" :
                  isComplete ? "border-emerald-500 bg-emerald-500 text-white" :
                  isCurrent ? "border-primary bg-primary text-primary-foreground" :
                  "border-border bg-background text-muted-foreground"
                }`}>
                  {isRejectedStep ? "✕" : isComplete ? "✓" : idx + 1}
                </div>
                <p className={`text-[10px] font-semibold text-center leading-tight px-0.5 ${
                  isRejectedStep ? "text-red-600" :
                  isComplete ? "text-emerald-600" :
                  isCurrent ? "text-primary" :
                  "text-muted-foreground"
                }`}>{step.label}</p>
              </div>
              {idx < WORKFLOW_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${
                  stepNum < currentStep && !isRejected ? "bg-emerald-500" : "bg-border"
                }`} />
              )}
            </div>
          )
        })}
      </div>
      <p className={`mt-3 text-xs ${cfg.text} font-medium flex items-center gap-1`}>
        <Info className="h-3 w-3" /> {cfg.desc}
      </p>
    </div>
  )
}

export default function LeavePage() {
  const [outpasses, setOutpasses] = useState<Outpass[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [form, setForm] = useState({ reason: "", destination: "", fromDate: "", toDate: "" })
  const [submitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<Outpass | null>(null)

  const fetchOutpasses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "ALL") params.set("status", filterStatus)
      const res = await fetch(`/api/outpasses?${params}`)
      const data = await res.json()
      setOutpasses(data.outpasses || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchOutpasses() }, [filterStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.reason || !form.destination || !form.fromDate || !form.toDate) {
      toast.error("All fields are required")
      return
    }
    if (new Date(form.fromDate) > new Date(form.toDate)) {
      toast.error("From date must be before To date")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/outpasses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        toast.success("Leave request submitted! Awaiting HOD review.", { duration: 4000 })
        setShowForm(false)
        setForm({ reason: "", destination: "", fromDate: "", toDate: "" })
        fetchOutpasses()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to submit request")
      }
    } finally { setSubmitting(false) }
  }

  const today = new Date().toISOString().split("T")[0]

  const filterTabs = [
    { value: "ALL", label: "All" },
    { value: "PENDING", label: "Pending HOD" },
    { value: "PENDING_WARDEN", label: "Pending Warden" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ]

  const counts: Record<string, number> = {}
  outpasses.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1 })

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Apply for outpass and track your leave history</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Apply Leave
        </button>
      </div>

      {/* Workflow Explanation Banner */}
      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
        <div className="rounded-full bg-blue-100 p-1.5 flex-shrink-0 mt-0.5">
          <Info className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800">How Leave Approval Works</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Your request goes through two stages: first your <strong>HOD/Admin</strong> reviews it, then the <strong>Warden</strong> gives the final approval. You can track progress below.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { s: "PENDING", label: "Pending HOD", color: "text-amber-600 bg-amber-50 border-amber-200" },
          { s: "PENDING_WARDEN", label: "With Warden", color: "text-blue-600 bg-blue-50 border-blue-200" },
          { s: "APPROVED", label: "Approved", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
          { s: "REJECTED", label: "Rejected", color: "text-red-600 bg-red-50 border-red-200" },
        ].map(({ s, label, color }) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "ALL" : s)}
            className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
              filterStatus === s ? color : "border-border bg-card"
            }`}
          >
            <p className="text-xs font-semibold opacity-70">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${filterStatus === s ? color.split(" ")[0] : "text-foreground"}`}>
              {counts[s] || 0}
            </p>
          </button>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map(t => (
          <button
            key={t.value}
            onClick={() => setFilterStatus(t.value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              filterStatus === t.value
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card hover:bg-muted"
            }`}
          >
            {t.label}
            {t.value !== "ALL" && counts[t.value] > 0 && (
              <span className={`ml-1.5 rounded-full px-1.5 py-px text-[10px] font-bold ${
                filterStatus === t.value ? "bg-white/20 text-current" : "bg-primary/10 text-primary"
              }`}>
                {counts[t.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* New Leave Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground mb-1">Apply for Leave / Outpass</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Your request will first be reviewed by the HOD, then by the Warden.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reason *</label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Reason for leave (e.g., Family function, Medical visit...)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Destination *</label>
                <input
                  value={form.destination}
                  onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="City / Location (e.g., Bengaluru, Mysuru)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">From Date *</label>
                  <input
                    type="date"
                    min={today}
                    value={form.fromDate}
                    onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To Date *</label>
                  <input
                    type="date"
                    min={form.fromDate || today}
                    value={form.toDate}
                    onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Leave Request Details</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {/* Workflow Stepper in Modal */}
            <WorkflowStepper status={selected.status} />

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Reason</p>
                <p className="text-foreground font-medium mt-0.5">{selected.reason}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="text-foreground font-medium mt-0.5">{selected.destination}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="text-foreground font-medium mt-0.5">{new Date(selected.fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="text-foreground font-medium mt-0.5">{new Date(selected.toDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>

              {/* HOD Remarks */}
              {selected.hodRemarks && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> HOD Remarks
                  </p>
                  <p className="text-sm text-blue-800">{selected.hodRemarks}</p>
                </div>
              )}

              {/* Warden Remarks */}
              {selected.remarks && (
                <div className={`rounded-lg p-3 border ${
                  selected.status === "APPROVED"
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}>
                  <p className={`text-xs font-semibold mb-1 flex items-center gap-1 ${
                    selected.status === "APPROVED" ? "text-emerald-700" : "text-red-700"
                  }`}>
                    {selected.status === "APPROVED"
                      ? <CheckCircle2 className="h-3 w-3" />
                      : <XCircle className="h-3 w-3" />
                    }
                    Warden Remarks
                  </p>
                  <p className={`text-sm ${selected.status === "APPROVED" ? "text-emerald-800" : "text-red-800"}`}>
                    {selected.remarks}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">Applied On</p>
                <p className="text-foreground text-xs mt-0.5">
                  {new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : outpasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
            <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No leave requests found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Click &quot;Apply Leave&quot; to submit your first request</p>
          </div>
        ) : outpasses.map((o) => {
          const cfg = statusConfig[o.status] || statusConfig.PENDING
          const Icon = cfg.icon
          const days = Math.ceil((new Date(o.toDate).getTime() - new Date(o.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
          return (
            <div
              key={o.id}
              onClick={() => setSelected(o)}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-lg ${cfg.bg} p-2.5`}>
                  <Icon className={`h-5 w-5 ${cfg.text}`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{o.destination}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(o.fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} →{" "}
                    {new Date(o.toDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {days} day{days !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                  {cfg.label}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
