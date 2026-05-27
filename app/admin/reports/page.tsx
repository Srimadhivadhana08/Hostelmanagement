"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { TrendingUp, Users, DoorOpen, AlertTriangle, CreditCard, Loader2, RefreshCw } from "lucide-react"

interface ReportData {
  students: number
  wardens: number
  rooms: { total: number; available: number; occupied: number; maintenance: number; occupancyRate: number }
  complaints: { open: number; inProgress: number; resolved: number; closed: number; total: number }
  fees: { totalBilled: number; totalCollected: number; totalDue: number }
  attendance: { present: number; absent: number; late: number; leave: number }
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"]

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [revenueData, setRevenueData] = useState<Array<{ month: string; collected: number; total: number }>>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const year = new Date().getFullYear()
      const month = new Date().getMonth() + 1
      const [summaryRes, revRes] = await Promise.all([
        fetch("/api/reports?type=fees-summary"),
        fetch(`/api/reports?type=revenue&month=${month}&year=${year}`),
      ])

      // Fetch aggregate data separately
      const [studRes, occRes, compRes, attRes] = await Promise.all([
        fetch("/api/users?role=STUDENT&limit=1"),
        fetch("/api/rooms/occupancy"),
        fetch("/api/complaints?limit=1"),
        fetch("/api/attendance?limit=1"),
      ])

      const [feeSummary, rev, stud, occ, comp, att] = await Promise.all([
        summaryRes.json(), revRes.json(),
        studRes.json(), occRes.json(), compRes.json(), attRes.json(),
      ])

      // Build complaint stats from complaints endpoint
      const [openRes, ipRes, resolvedRes, closedRes] = await Promise.all([
        fetch("/api/complaints?status=OPEN&limit=1"),
        fetch("/api/complaints?status=IN_PROGRESS&limit=1"),
        fetch("/api/complaints?status=RESOLVED&limit=1"),
        fetch("/api/complaints?status=CLOSED&limit=1"),
      ])
      const [openD, ipD, resD, closedD] = await Promise.all([openRes.json(), ipRes.json(), resolvedRes.json(), closedRes.json()])

      setData({
        students: stud.total || 0,
        wardens: 0,
        rooms: {
          total: occ.total || 0,
          available: occ.available || 0,
          occupied: occ.occupied || 0,
          maintenance: occ.maintenance || 0,
          occupancyRate: occ.occupancyRate || 0,
        },
        complaints: {
          open: openD.total || 0,
          inProgress: ipD.total || 0,
          resolved: resD.total || 0,
          closed: closedD.total || 0,
          total: (openD.total || 0) + (ipD.total || 0) + (resD.total || 0) + (closedD.total || 0),
        },
        fees: {
          totalBilled: feeSummary.thisMonth?.totalAmount || 0,
          totalCollected: feeSummary.thisMonth?.paid || 0,
          totalDue: feeSummary.thisMonth?.due || 0,
        },
        attendance: { present: 0, absent: 0, late: 0, leave: 0 },
      })
      setRevenueData(rev.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const complaintChartData = data ? [
    { name: "Open", value: data.complaints.open, color: "#f59e0b" },
    { name: "In Progress", value: data.complaints.inProgress, color: "#6366f1" },
    { name: "Resolved", value: data.complaints.resolved, color: "#22c55e" },
    { name: "Closed", value: data.complaints.closed, color: "#9ca3af" },
  ].filter(d => d.value > 0) : []

  const roomChartData = data ? [
    { name: "Available", value: data.rooms.available, color: "#22c55e" },
    { name: "Occupied", value: data.rooms.occupied, color: "#6366f1" },
    { name: "Maintenance", value: data.rooms.maintenance, color: "#f59e0b" },
  ].filter(d => d.value > 0) : []

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">System-wide performance overview</p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Students", value: data?.students || 0, icon: Users, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
          { label: "Room Occupancy", value: `${data?.rooms.occupancyRate || 0}%`, icon: DoorOpen, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
          { label: "Open Complaints", value: data?.complaints.open || 0, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
          { label: "Fees Collected", value: `₹${(data?.fees.totalCollected || 0).toLocaleString()}`, icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`rounded-xl border ${card.border} bg-card p-5`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
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

      {/* Room + Complaint Pie Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Room Status Pie */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Room Status Distribution</h2>
          {roomChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No room data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={roomChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {roomChartData.map((entry, i) => <Cell key={entry.name} fill={entry.color || COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, "Rooms"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-3 gap-2 mt-2 text-center">
            <div><p className="text-2xl font-bold text-emerald-600">{data?.rooms.available || 0}</p><p className="text-xs text-muted-foreground">Available</p></div>
            <div><p className="text-2xl font-bold text-primary">{data?.rooms.occupied || 0}</p><p className="text-xs text-muted-foreground">Occupied</p></div>
            <div><p className="text-2xl font-bold text-amber-600">{data?.rooms.maintenance || 0}</p><p className="text-xs text-muted-foreground">Maintenance</p></div>
          </div>
        </div>

        {/* Complaint Status Pie */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Complaint Status Overview</h2>
          {complaintChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No complaint data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={complaintChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {complaintChartData.map((entry, i) => <Cell key={entry.name} fill={entry.color || COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, "Complaints"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-4 gap-2 mt-2 text-center">
            <div><p className="text-lg font-bold text-amber-600">{data?.complaints.open || 0}</p><p className="text-xs text-muted-foreground">Open</p></div>
            <div><p className="text-lg font-bold text-primary">{data?.complaints.inProgress || 0}</p><p className="text-xs text-muted-foreground">In Progress</p></div>
            <div><p className="text-lg font-bold text-emerald-600">{data?.complaints.resolved || 0}</p><p className="text-xs text-muted-foreground">Resolved</p></div>
            <div><p className="text-lg font-bold text-gray-500">{data?.complaints.closed || 0}</p><p className="text-xs text-muted-foreground">Closed</p></div>
          </div>
        </div>
      </div>

      {/* Revenue Bar Chart */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Fee Collection – {new Date().getFullYear()}</h2>
          <div className="flex items-center gap-1.5 text-emerald-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">₹{(data?.fees.totalCollected || 0).toLocaleString()} this month</span>
          </div>
        </div>
        {revenueData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No revenue data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]} />
              <Legend />
              <Bar dataKey="total" name="Billed" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" name="Collected" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {/* Fee KPIs */}
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4 text-center">
          <div><p className="text-xs text-muted-foreground">Billed (this month)</p><p className="text-xl font-bold text-foreground">₹{(data?.fees.totalBilled || 0).toLocaleString()}</p></div>
          <div><p className="text-xs text-muted-foreground">Collected</p><p className="text-xl font-bold text-emerald-600">₹{(data?.fees.totalCollected || 0).toLocaleString()}</p></div>
          <div><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-xl font-bold text-red-600">₹{(data?.fees.totalDue || 0).toLocaleString()}</p></div>
        </div>
      </div>

      {/* Occupancy Progress */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Overall Occupancy Rate</h2>
          <span className="text-sm font-bold text-primary">{data?.rooms.occupancyRate || 0}%</span>
        </div>
        <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-4 rounded-full bg-gradient-to-r from-primary to-primary/70" style={{ width: `${data?.rooms.occupancyRate || 0}%` }} />
        </div>
        <div className="mt-2 flex gap-6 text-sm text-muted-foreground">
          <span>{data?.rooms.occupied} rooms occupied</span>
          <span>{data?.rooms.available} rooms available</span>
          <span>{data?.rooms.total} total rooms</span>
        </div>
      </div>
    </div>
  )
}
