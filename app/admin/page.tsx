"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users, AlertTriangle, CreditCard, Bell, ChevronRight, Loader2,
  CalendarCheck, DoorOpen, Shield, BarChart3, CheckCircle2, XCircle,
  ArrowRight, TrendingUp, Clock
} from "lucide-react"
import { toast } from "sonner"

interface LeaveRequest {
  id: string
  reason: string
  destination: string
  fromDate: string
  toDate: string
  user: { name: string; email: string; room?: { roomNumber: string } | null }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0, wardens: 0,
    rooms: { total: 0, available: 0, occupied: 0, occupancyRate: 0 },
    openComplaints: 0, pendingFees: 0, pendingLeaves: 0
  })
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [studRes, wardRes, occRes, compRes, feesRes, leavesRes] = await Promise.all([
          fetch("/api/users?role=STUDENT&limit=1"),
          fetch("/api/users?role=WARDEN&limit=1"),
          fetch("/api/rooms/occupancy"),
          fetch("/api/complaints?status=OPEN&limit=1"),
          fetch("/api/fees?status=PENDING&limit=1"),
          fetch("/api/outpasses?status=PENDING&limit=10"),
        ])
        const [stud, ward, occ, comp, fees, leaves] = await Promise.all([
          studRes.json(), wardRes.json(), occRes.json(), compRes.json(), feesRes.json(), leavesRes.json()
        ])
        setStats({
          students: stud.total || 0, wardens: ward.total || 0,
          rooms: { total: occ.total || 0, available: occ.available || 0, occupied: occ.occupied || 0, occupancyRate: occ.occupancyRate || 0 },
          openComplaints: comp.total || 0, pendingFees: fees.total || 0, pendingLeaves: leaves.total || 0
        })
        setPendingLeaves(leaves.outpasses || [])
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const handleLeaveAction = async (id: string, action: "PENDING_WARDEN" | "REJECTED") => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/outpasses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action,
          hodRemarks: action === "PENDING_WARDEN" ? "Approved by HOD — forwarded to Warden for final check." : "Rejected by HOD."
        })
      })
      if (res.ok) {
        toast.success(action === "PENDING_WARDEN" ? "✅ Forwarded to Warden" : "❌ Leave rejected")
        setPendingLeaves(prev => prev.filter(l => l.id !== id))
        setStats(prev => ({ ...prev, pendingLeaves: prev.pendingLeaves - 1 }))
      } else { toast.error("Failed to update leave") }
    } finally { setUpdatingId(null) }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
    </div>
  )

  const quickActions = [
    { label: "Student Directory", desc: "View & manage all students", href: "/admin/students", icon: Users, color: "from-indigo-500 to-violet-600" },
    { label: "Warden Management", desc: "Manage hostel wardens", href: "/admin/wardens", icon: Shield, color: "from-emerald-500 to-teal-600" },
    { label: "Room Allocation", desc: "View & assign rooms", href: "/admin/rooms", icon: DoorOpen, color: "from-orange-500 to-amber-600" },
    { label: "Fee Records", desc: "Track dues & payments", href: "/admin/fees", icon: CreditCard, color: "from-rose-500 to-pink-600" },
    { label: "Complaints", desc: "Review all complaints", href: "/admin/complaints", icon: AlertTriangle, color: "from-amber-500 to-yellow-600" },
    { label: "Post Notice", desc: "Announce to entire hostel", href: "/admin/notices", icon: Bell, color: "from-blue-500 to-cyan-600" },
    { label: "Reports", desc: "Export data & analytics", href: "/admin/reports", icon: BarChart3, color: "from-slate-600 to-slate-800" },
  ]

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          <Shield className="h-3.5 w-3.5" /> HOD / Admin Portal
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Overview</h1>
        <p className="mt-2 text-slate-500 font-medium">Full visibility across all hostel operations and student activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Students", value: stats.students, sub: "Enrolled", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total Wardens", value: stats.wardens, sub: "Active", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Open Complaints", value: stats.openComplaints, sub: "Need attention", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Pending Fees", value: stats.pendingFees, sub: "Students with dues", icon: CreditCard, color: "text-rose-600", bg: "bg-rose-50" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Room Occupancy Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-teal-600" />
            <span className="font-bold text-slate-900">Room Occupancy</span>
          </div>
          <span className="text-sm font-bold text-slate-500">{stats.rooms.occupied} / {stats.rooms.total} rooms occupied</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${stats.rooms.occupancyRate}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs font-medium text-slate-400">
          <span>{stats.rooms.available} Available</span>
          <span className="font-bold text-teal-600">{stats.rooms.occupancyRate}% Full</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: HOD Leave Approval Queue */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-indigo-500" />
              Leave Approval Queue
            </h2>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pendingLeaves.length > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
              {stats.pendingLeaves} PENDING
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {pendingLeaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <CheckCircle2 className="h-14 w-14 mb-3 text-slate-200" />
                <p className="font-bold text-slate-700">All clear!</p>
                <p className="text-sm mt-1">No pending leave requests from students.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingLeaves.map(leave => {
                  const days = Math.ceil((new Date(leave.toDate).getTime() - new Date(leave.fromDate).getTime()) / 86400000) + 1
                  const isUpdating = updatingId === leave.id
                  return (
                    <div key={leave.id} className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-slate-900">{leave.user.name}</p>
                          <p className="text-xs text-slate-400">Room {leave.user.room?.roomNumber || "Unassigned"} • {leave.user.email}</p>
                        </div>
                        <span className="text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">{days}d</span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-100">
                        <p className="text-sm text-slate-700">"{leave.reason}"</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(leave.fromDate).toLocaleDateString()} → {new Date(leave.toDate).toLocaleDateString()} • To: {leave.destination}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={isUpdating}
                          onClick={() => handleLeaveAction(leave.id, "PENDING_WARDEN")}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition-all disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Approve → Warden
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleLeaveAction(leave.id, "REJECTED")}
                          className="flex items-center justify-center gap-1.5 border-2 border-slate-200 hover:border-rose-400 hover:text-rose-600 text-slate-500 font-bold text-xs py-2 px-3 rounded-lg transition-all disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {pendingLeaves.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-center">
                <Link href="/admin/leave-approvals" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1">
                  View full approval queue <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Actions Grid */}
        <div className="lg:col-span-3">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-500" />
            Management Sections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map(action => (
              <Link
                key={action.href}
                href={action.href}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.color} p-6 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className="absolute top-0 right-0 opacity-10 group-hover:scale-110 transition-transform duration-300 -translate-y-4 translate-x-4">
                  <action.icon className="h-24 w-24" />
                </div>
                <action.icon className="h-7 w-7 mb-3 relative z-10" />
                <p className="font-bold text-lg relative z-10">{action.label}</p>
                <p className="text-sm text-white/70 mt-1 relative z-10">{action.desc}</p>
                <ChevronRight className="h-5 w-5 absolute bottom-5 right-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
