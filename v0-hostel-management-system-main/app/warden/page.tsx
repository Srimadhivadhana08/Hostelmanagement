"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  AlertTriangle, CalendarCheck, CheckCircle2, XCircle, Loader2,
  ArrowRight, ShieldCheck, DoorOpen, Users, ClipboardList,
  UtensilsCrossed, Bell, Clock, UserCheck
} from "lucide-react"
import { toast } from "sonner"

interface Complaint {
  id: string; title: string; description: string; status: string; priority: string; category: string; createdAt: string
  user: { name: string; room?: { roomNumber: string } | null }
}

interface Leave {
  id: string; reason: string; destination: string; fromDate: string; toDate: string; createdAt: string
  user: { name: string; room?: { roomNumber: string } | null }
}

export default function WardenDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({ students: 0, rooms: { occupied: 0, total: 0, occupancyRate: 0 }, todayPresent: 0 })
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([])
  const [pendingComplaints, setPendingComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [occRes, studRes, leavesRes, compRes] = await Promise.all([
          fetch("/api/rooms/occupancy"),
          fetch("/api/users?role=STUDENT&limit=1"),
          fetch("/api/outpasses?status=PENDING_WARDEN&limit=20"),
          fetch("/api/complaints?status=OPEN&limit=20"),
        ])
        const [occ, stud, leaves, comp] = await Promise.all([occRes.json(), studRes.json(), leavesRes.json(), compRes.json()])
        setStats({ students: stud.total || 0, rooms: { occupied: occ.occupied || 0, total: occ.total || 0, occupancyRate: occ.occupancyRate || 0 }, todayPresent: 0 })
        setPendingLeaves(leaves.outpasses || [])
        setPendingComplaints(comp.complaints || [])
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const handleLeaveAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/outpasses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks: status === "APPROVED" ? "Approved by Warden." : "Rejected by Warden." })
      })
      if (res.ok) {
        toast.success(status === "APPROVED" ? "✅ Leave approved!" : "❌ Leave rejected")
        setPendingLeaves(prev => prev.filter(l => l.id !== id))
      } else { toast.error("Failed to update leave") }
    } finally { setUpdatingId(null) }
  }

  const handleComplaintAction = async (id: string, status: "IN_PROGRESS" | "RESOLVED") => {
    setUpdatingId(id)
    try {
      const body: Record<string, unknown> = { status }
      if (status === "IN_PROGRESS") body.assignedTo = session?.user?.id
      if (status === "RESOLVED") body.resolution = "Resolved by Warden."
      const res = await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        toast.success(status === "IN_PROGRESS" ? "📋 Complaint assigned to you" : "✅ Complaint resolved!")
        setPendingComplaints(prev => prev.filter(c => c.id !== id))
      } else { toast.error("Failed to update complaint") }
    } finally { setUpdatingId(null) }
  }

  const priorityColor: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-600", MEDIUM: "bg-amber-50 text-amber-700",
    HIGH: "bg-orange-50 text-orange-700", URGENT: "bg-rose-100 text-rose-700"
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
    </div>
  )

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          <ShieldCheck className="h-3.5 w-3.5" /> Warden Portal
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Operations Center</h1>
            <p className="mt-2 text-slate-500 font-medium">
              Welcome, {session?.user?.name?.split(" ")[0] || "Warden"}. Here are your active queues.
            </p>
          </div>
          {/* Quick Stats */}
          <div className="flex gap-3">
            {[
              { label: "Students", value: stats.students, icon: Users, color: "text-indigo-600" },
              { label: "Rooms Occupied", value: `${stats.rooms.occupancyRate}%`, icon: DoorOpen, color: "text-teal-600" },
              { label: "Leaves Pending", value: pendingLeaves.length, icon: CalendarCheck, color: "text-amber-600" },
              { label: "Open Complaints", value: pendingComplaints.length, icon: AlertTriangle, color: "text-rose-600" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3 px-4 shadow-sm text-center">
                <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
                <p className="text-lg font-black text-slate-900 leading-none">{s.value}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Mark Attendance", href: "/warden/attendance", icon: ClipboardList, color: "bg-indigo-600 text-white" },
          { label: "Student Details", href: "/warden/students", icon: UserCheck, color: "bg-emerald-600 text-white" },
          { label: "Mess Menu", href: "/warden/mess-menu", icon: UtensilsCrossed, color: "bg-amber-500 text-white" },
          { label: "Post Notice", href: "/warden/notices", icon: Bell, color: "bg-slate-700 text-white" },
        ].map(action => (
          <Link key={action.href} href={action.href}
            className={`${action.color} rounded-xl p-4 flex items-center gap-3 font-bold text-sm hover:opacity-90 transition-opacity shadow-sm`}>
            <action.icon className="h-5 w-5 flex-shrink-0" />
            {action.label}
          </Link>
        ))}
      </div>

      {/* Two Queue Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Leave Approvals Queue (PENDING_WARDEN = HOD already approved, now Warden's final call) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="h-6 w-6 text-blue-500" />
              Leave Final Approval
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">HOD already approved • Your final decision</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pendingLeaves.length > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                {pendingLeaves.length} WAITING
              </span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {pendingLeaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <CheckCircle2 className="h-16 w-16 mb-4 text-slate-200" />
                <p className="text-lg font-bold text-slate-700">Queue Clear!</p>
                <p className="text-sm mt-1">No leaves waiting for your approval.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingLeaves.map(leave => {
                  const days = Math.ceil((new Date(leave.toDate).getTime() - new Date(leave.fromDate).getTime()) / 86400000) + 1
                  const isUpdating = updatingId === leave.id
                  return (
                    <div key={leave.id} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{leave.user.name}</h3>
                          <p className="text-xs text-slate-400">Room {leave.user.room?.roomNumber || "Unassigned"}</p>
                        </div>
                        <span className="text-xs font-bold bg-blue-900 text-white px-2 py-0.5 rounded">{days} Day{days > 1 ? "s" : ""}</span>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
                        <p className="text-sm text-slate-700 font-medium">"{leave.reason}"</p>
                        <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(leave.fromDate).toLocaleDateString()} – {new Date(leave.toDate).toLocaleDateString()} • Destination: {leave.destination}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button disabled={isUpdating} onClick={() => handleLeaveAction(leave.id, "APPROVED")}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-2 rounded-xl transition-all disabled:opacity-50">
                          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Grant Leave
                        </button>
                        <button disabled={isUpdating} onClick={() => handleLeaveAction(leave.id, "REJECTED")}
                          className="flex-1 flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-rose-400 hover:text-rose-600 text-slate-600 font-bold text-sm py-2 rounded-xl transition-all disabled:opacity-50">
                          <XCircle className="h-4 w-4" /> Deny
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {pendingLeaves.length > 0 && (
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-center">
                <Link href="/warden/leave-approvals" className="text-sm font-bold text-blue-600 flex items-center justify-center gap-1">
                  View all leave requests <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Complaints Queue */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Student Complaints
            </h2>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pendingComplaints.length > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
              {pendingComplaints.length} OPEN
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {pendingComplaints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <ShieldCheck className="h-16 w-16 mb-4 text-slate-200" />
                <p className="text-lg font-bold text-slate-900">All Green!</p>
                <p className="text-sm mt-1">No open complaints right now.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingComplaints.map(complaint => {
                  const isUpdating = updatingId === complaint.id
                  return (
                    <div key={complaint.id} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${priorityColor[complaint.priority] || priorityColor.MEDIUM}`}>
                          {complaint.priority}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 border border-slate-200 rounded px-2 py-0.5">
                          {complaint.category}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900">{complaint.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">By <span className="font-semibold">{complaint.user.name}</span> • Room {complaint.user.room?.roomNumber}</p>
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">{complaint.description}</p>
                      <div className="flex gap-2 mt-3">
                        <button disabled={isUpdating} onClick={() => handleComplaintAction(complaint.id, "IN_PROGRESS")}
                          className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm py-2 rounded-xl transition-all disabled:opacity-50">
                          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Assign to Me
                        </button>
                        <button disabled={isUpdating} onClick={() => handleComplaintAction(complaint.id, "RESOLVED")}
                          className="flex-1 flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-emerald-400 hover:text-emerald-600 text-slate-600 font-bold text-sm py-2 rounded-xl transition-all disabled:opacity-50">
                          <CheckCircle2 className="h-4 w-4" /> Mark Resolved
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {pendingComplaints.length > 0 && (
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-center">
                <Link href="/warden/complaints" className="text-sm font-bold text-amber-600 flex items-center justify-center gap-1">
                  View full complaint registry <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
