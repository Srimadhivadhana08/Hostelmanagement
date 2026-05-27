"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { CheckCircle2, XCircle, Clock, CalendarDays, Loader2, TrendingUp, Info } from "lucide-react"

interface AttendanceRecord {
  id: string
  date: string
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "HOLIDAY"
  checkInTime?: string
  notes?: string
}

interface AttendanceStats {
  present: number
  absent: number
  leave: number
  holiday: number
  total: number
  percentage: number
  hasData: boolean
}

const statusConfig = {
  PRESENT: { label: "Present", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  ABSENT: { label: "Absent", icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  LATE: { label: "Late", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  LEAVE: { label: "On Leave", icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  HOLIDAY: { label: "Holiday", icon: CalendarDays, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" },
}

export default function StudentAttendancePage() {
  const { data: session } = useSession()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0, absent: 0, leave: 0, holiday: 0, total: 0, percentage: 0, hasData: false
  })
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear] = useState(new Date().getFullYear())

  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"]

  useEffect(() => {
    if (!session?.user?.id) return
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/attendance/stats?month=${selectedMonth}&year=${selectedYear}`)
        const data = await res.json()
        setRecords(data.records || [])
        setStats(data.stats || { present: 0, absent: 0, leave: 0, holiday: 0, total: 0, percentage: 0, hasData: false })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session?.user?.id, selectedMonth, selectedYear])

  const statCards = [
    {
      label: "Attendance %",
      value: stats.hasData ? `${stats.percentage}%` : "N/A",
      icon: TrendingUp,
      color: !stats.hasData ? "text-muted-foreground" : stats.percentage >= 75 ? "text-emerald-600" : "text-red-600",
      bg: !stats.hasData ? "bg-muted" : stats.percentage >= 75 ? "bg-emerald-50" : "bg-red-50",
      border: !stats.hasData ? "border-border" : stats.percentage >= 75 ? "border-emerald-200" : "border-red-200",
    },
    { label: "Present", value: stats.present, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    { label: "Absent", value: stats.absent, icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    { label: "On Leave", value: stats.leave, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your hostel attendance</p>
        </div>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(Number(e.target.value))}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium focus:outline-none"
        >
          {months.map((m, i) => (
            <option key={m} value={i + 1}>{m} {selectedYear}</option>
          ))}
        </select>
      </div>

      {/* Stat Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`rounded-xl border ${card.border} bg-card p-5`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
                <div className={`rounded-lg ${card.bg} p-2`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Attendance Progress Bar */}
      <div className="mt-5 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Monthly Overview — {months[selectedMonth - 1]} {selectedYear}</h2>
          {stats.hasData ? (
            <span className={`text-sm font-bold ${stats.percentage >= 75 ? "text-emerald-600" : "text-red-600"}`}>
              {stats.percentage}% {stats.percentage < 75 ? "⚠ Below 75%" : "✓ Good"}
            </span>
          ) : (
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Info className="h-3.5 w-3.5" /> Not marked yet
            </span>
          )}
        </div>
        {stats.hasData ? (
          <>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all ${stats.percentage >= 75 ? "bg-emerald-500" : "bg-red-500"}`}
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Present: {stats.present}</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Absent: {stats.absent}</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Leave: {stats.leave}</span>
            </div>
          </>
        ) : (
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-3 rounded-full bg-muted/50 w-0" />
          </div>
        )}
      </div>

      {!stats.hasData && !loading && (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-5 flex items-center gap-3 text-muted-foreground">
          <Info className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Attendance not marked yet for {months[selectedMonth - 1]}</p>
            <p className="text-xs mt-0.5">The warden/admin will mark your attendance. Check back later.</p>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="mt-5">
        <h2 className="mb-3 text-lg font-bold text-foreground">Daily Records</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center py-16 rounded-xl border border-dashed border-border bg-card">
            <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No attendance records for {months[selectedMonth - 1]}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Day</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Check-in</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map(r => {
                  const cfg = statusConfig[r.status] || statusConfig.ABSENT
                  const Icon = cfg.icon
                  const date = new Date(r.date)
                  return (
                    <tr key={r.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">
                        {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {date.toLocaleDateString("en-IN", { weekday: "long" })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <Icon className="h-3 w-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {r.checkInTime
                          ? new Date(r.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{r.notes || "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
