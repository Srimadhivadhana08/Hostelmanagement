"use client"

import { useEffect, useState } from "react"
import { CalendarCheck, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface Student { id: string; name: string; room?: { roomNumber: string } | null }

const STATUSES = ["PRESENT", "ABSENT", "LATE", "LEAVE", "HOLIDAY"]
const statusColors: Record<string, string> = {
  PRESENT: "bg-emerald-500 text-white", ABSENT: "bg-red-500 text-white",
  LATE: "bg-amber-500 text-white", LEAVE: "bg-blue-500 text-white", HOLIDAY: "bg-purple-500 text-white",
}

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existing, setExisting] = useState<Record<string, string>>({})

  const loadStudents = async () => {
    const res = await fetch("/api/users?role=STUDENT&limit=100")
    const data = await res.json()
    setStudents(data.users || [])
    const init: Record<string, string> = {}
    data.users?.forEach((s: Student) => { init[s.id] = "PRESENT" })
    return init
  }

  const loadExistingAttendance = async (d: string) => {
    const res = await fetch(`/api/attendance?date=${d}`)
    const data = await res.json()
    const existing: Record<string, string> = {}
    data.records?.forEach((r: { userId: string; status: string }) => { existing[r.userId] = r.status })
    return existing
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [init, ex] = await Promise.all([loadStudents(), loadExistingAttendance(date)])
        setExisting(ex)
        const merged = { ...init, ...ex }
        setAttendance(merged)
      } finally { setLoading(false) }
    }
    load()
  }, [date])

  const setAll = (status: string) => {
    setAttendance(prev => Object.fromEntries(Object.keys(prev).map(k => [k, status])))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const records = Object.entries(attendance).map(([userId, status]) => ({ userId, status }))
      const res = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, records }) })
      if (res.ok) { toast.success("Attendance saved!"); setExisting(attendance) }
      else { toast.error("Failed to save attendance") }
    } finally { setSaving(false) }
  }

  const present = Object.values(attendance).filter(s => s === "PRESENT").length
  const absent = Object.values(attendance).filter(s => s === "ABSENT").length

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mark Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Record daily attendance for all students</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save Attendance
        </button>
      </div>

      {/* Date + Stats */}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split("T")[0]} className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-3 ml-4">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-center">
            <p className="text-xs text-emerald-600">Present</p>
            <p className="text-xl font-bold text-emerald-700">{present}</p>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-center">
            <p className="text-xs text-red-600">Absent</p>
            <p className="text-xl font-bold text-red-700">{absent}</p>
          </div>
          <div className="rounded-lg bg-muted border border-border px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-foreground">{students.length}</p>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground mr-2 flex items-center">Mark all:</span>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setAll(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${statusColors[s]} hover:opacity-90 transition-opacity`}>{s}</button>
        ))}
      </div>

      {/* Student List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="mt-5 rounded-xl border border-border overflow-hidden">
          <div className="bg-muted px-4 py-3 grid grid-cols-5 gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <span className="col-span-2">Student</span>
            <span>Room</span>
            <span className="col-span-2 text-center">Status</span>
          </div>
          <div className="divide-y divide-border">
            {students.map(s => (
              <div key={s.id} className={`px-4 py-3 grid grid-cols-5 gap-2 items-center transition-colors ${existing[s.id] ? "bg-primary/3" : ""}`}>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                </div>
                <p className="text-sm text-muted-foreground">{s.room?.roomNumber || "—"}</p>
                <div className="col-span-2 flex gap-1 flex-wrap">
                  {STATUSES.map(status => (
                    <button
                      key={status}
                      onClick={() => setAttendance(prev => ({ ...prev, [s.id]: status }))}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${attendance[s.id] === status ? statusColors[status] : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    >
                      {status[0]}{status === "HOLIDAY" ? "H" : ""}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
