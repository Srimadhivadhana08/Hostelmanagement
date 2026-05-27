"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  AlertTriangle, CalendarDays, UtensilsCrossed, Bell, ChevronRight,
  Loader2, CheckCircle2, Wallet, Hotel, GraduationCap, Clock,
  ArrowRight, FileText, ShieldCheck, XCircle
} from "lucide-react"

interface DashboardData {
  user: {
    name: string; email: string; phone: string; department: string; year: string
    room?: { roomNumber: string; block: string; floor: string; type: string; amenities: string[] } | null
  }
  fee: { due: number; status: string; month: string; totalAmount: number } | null
  attendance: { percentage: number; present: number; total: number }
  complaints: Array<{ id: string; title: string; status: string; createdAt: string }>
  notices: Array<{ id: string; title: string; category: string; createdAt: string }>
  leaves: Array<{ id: string; reason: string; status: string; fromDate: string; toDate: string; createdAt: string }>
}

const leaveStatusConfig: Record<string, { label: string; color: string; step: number }> = {
  PENDING:        { label: "Waiting for HOD", color: "text-amber-600 bg-amber-50 border-amber-200", step: 0 },
  PENDING_WARDEN: { label: "Waiting for Warden", color: "text-blue-600 bg-blue-50 border-blue-200", step: 1 },
  APPROVED:       { label: "Approved ✓", color: "text-emerald-600 bg-emerald-50 border-emerald-200", step: 2 },
  REJECTED:       { label: "Rejected", color: "text-rose-600 bg-rose-50 border-rose-200", step: -1 },
  EXPIRED:        { label: "Expired", color: "text-slate-500 bg-slate-100 border-slate-200", step: -1 },
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!session?.user?.id) return
      try {
        const [userRes, feesRes, attRes, compRes, noticesRes, leavesRes] = await Promise.all([
          fetch(`/api/users/${session.user.id}`),
          fetch("/api/fees?limit=1"),
          fetch("/api/attendance/stats"),
          fetch("/api/complaints?limit=5"),
          fetch("/api/notices?limit=3&active=true"),
          fetch("/api/outpasses?limit=5")
        ])
        const [userData, feesData, attData, compData, noticesData, leavesData] = await Promise.all([
          userRes.json(), feesRes.json(), attRes.json(), compRes.json(), noticesRes.json(), leavesRes.json()
        ])
        setData({
          user: userData.user,
          fee: feesData.fees?.[0] || null,
          attendance: attData.stats || { percentage: 100, present: 0, total: 0 },
          complaints: compData.complaints || [],
          notices: noticesData.notices || [],
          leaves: leavesData.outpasses || []
        })
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [session?.user?.id])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="mt-3 text-sm font-medium text-slate-500 animate-pulse">Loading your portal...</p>
      </div>
    </div>
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"
  const firstName = session?.user?.name?.split(" ")[0] || "Student"
  const hasDues = data?.fee && data.fee.due > 0
  const attPct = data?.attendance.percentage || 0
  const attColor = attPct < 75 ? "text-rose-500" : attPct < 85 ? "text-amber-500" : "text-emerald-500"

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            <GraduationCap className="h-3.5 w-3.5" /> Student Portal
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {greeting}, <span className="text-indigo-600">{firstName}</span> 👋
          </h1>
          <p className="mt-2 text-slate-500 font-medium text-sm">
            {data?.user.department} • Year {data?.user.year} • {data?.user.email}
          </p>
        </div>
        <Link href="/dashboard/notices" className="hidden sm:flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
          <Bell className="h-4 w-4 text-rose-500" />
          Notices
          {data && data.notices.length > 0 && (
            <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px]">{data.notices.length}</span>
          )}
        </Link>
      </div>

      {/* Hero Card — Room + Stats */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-xl mb-8 relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500 rounded-full blur-[120px] opacity-10 translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="p-8 lg:p-10 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Identity */}
          <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 md:col-span-1">
            <div className="h-20 w-20 bg-gradient-to-tr from-indigo-400 to-purple-500 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-lg text-white font-black text-3xl">
              {firstName.charAt(0)}
            </div>
            <h2 className="mt-3 text-lg font-bold text-white text-center">{data?.user.name}</h2>
            <p className="text-xs text-indigo-200 font-medium mt-1 text-center">{data?.user.phone || "No phone set"}</p>
          </div>

          {/* Room */}
          <div className="flex flex-col justify-center pl-6 border-l border-white/10">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Hotel className="h-4 w-4" /> My Room
            </p>
            <p className="text-4xl font-black text-white">{data?.user.room?.roomNumber || "—"}</p>
            <p className="text-sm text-slate-300 mt-1">Block {data?.user.room?.block || "?"} • Floor {data?.user.room?.floor || "?"}</p>
            <p className="text-xs text-slate-400 mt-1 capitalize">{data?.user.room?.type?.toLowerCase() || "Not assigned"} Room</p>
          </div>

          {/* Fees */}
          <div className="flex flex-col justify-center pl-6 border-l border-white/10">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Wallet className="h-4 w-4" /> Fee Status
            </p>
            <p className={`text-4xl font-black ${hasDues ? "text-rose-400" : "text-emerald-400"}`}>
              {hasDues && data?.fee ? `₹${data.fee.due.toLocaleString()}` : "Clear"}
            </p>
            <p className="text-sm text-slate-300 mt-1">
              {hasDues && data?.fee ? `${data.fee.month} dues pending` : "All fees paid ✓"}
            </p>
            {hasDues && (
              <Link href="/dashboard/payments" className="mt-2 text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1">
                Pay Now <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Attendance */}
          <div className="flex flex-col justify-center pl-6 border-l border-white/10">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-4 w-4" /> Attendance
            </p>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                    strokeDasharray={28 * 2 * Math.PI}
                    strokeDashoffset={28 * 2 * Math.PI - (attPct / 100) * 28 * 2 * Math.PI}
                    className={attPct < 75 ? "text-rose-400" : "text-emerald-400"} />
                </svg>
                <span className="absolute text-sm font-black text-white">{attPct}%</span>
              </div>
              <div>
                <p className={`text-lg font-black ${attColor}`}>{attPct < 75 ? "Low ⚠" : attPct < 85 ? "Average" : "Good ✓"}</p>
                <p className="text-sm text-slate-300">{data?.attendance.present}/{data?.attendance.total} days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Service Tiles + Leave Tracker */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Apply Leave", href: "/dashboard/leave", icon: CalendarDays, color: "from-blue-500 to-indigo-600" },
                { label: "Report Issue", href: "/dashboard/complaints", icon: AlertTriangle, color: "from-amber-500 to-orange-600" },
                { label: "Mess Menu", href: "/dashboard/mess-menu", icon: UtensilsCrossed, color: "from-teal-500 to-emerald-600" },
                { label: "My Room", href: "/dashboard/room", icon: Hotel, color: "from-purple-500 to-violet-600" },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${a.color} p-5 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-start`}>
                  <a.icon className="h-7 w-7 mb-3" />
                  <p className="font-bold text-sm">{a.label}</p>
                  <ChevronRight className="h-4 w-4 absolute bottom-4 right-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* My Leave Requests — with 2-step status tracker */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-indigo-500" /> My Leave Requests
              </h2>
              <Link href="/dashboard/leave" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Apply New <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {!data?.leaves.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <FileText className="h-12 w-12 mb-3 text-slate-200" />
                  <p className="font-medium text-slate-600">No leave requests yet</p>
                  <Link href="/dashboard/leave" className="mt-2 text-sm font-bold text-indigo-600 hover:text-indigo-700">Apply for leave →</Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.leaves.map(leave => {
                    const cfg = leaveStatusConfig[leave.status] || leaveStatusConfig.PENDING
                    const isRejected = leave.status === "REJECTED" || leave.status === "EXPIRED"
                    return (
                      <div key={leave.id} className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">"{leave.reason}"</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {new Date(leave.fromDate).toLocaleDateString()} – {new Date(leave.toDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        {/* Step Tracker */}
                        {!isRejected && (
                          <div className="flex items-center gap-1 mt-2">
                            {["Submitted", "HOD ✓", "Warden ✓"].map((step, i) => {
                              const done = cfg.step > i || leave.status === "APPROVED"
                              const active = cfg.step === i
                              return (
                                <div key={step} className="flex items-center gap-1 flex-1">
                                  <div className={`h-2 flex-1 rounded-full transition-colors ${done ? "bg-emerald-400" : active ? "bg-indigo-400 animate-pulse" : "bg-slate-200"}`} />
                                  <span className={`text-[9px] font-bold whitespace-nowrap ${done ? "text-emerald-600" : active ? "text-indigo-600" : "text-slate-300"}`}>{step}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {isRejected && (
                          <div className="flex items-center gap-1.5 mt-2 text-rose-500 text-xs font-medium">
                            <XCircle className="h-3.5 w-3.5" /> This request was not approved.
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: My Complaints + Notices */}
        <div className="space-y-6">
          {/* My Complaints */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> My Complaints
              </h2>
              <Link href="/dashboard/complaints" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                New <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {!data?.complaints.length ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <ShieldCheck className="h-10 w-10 mb-2 text-slate-200" />
                  <p className="text-sm font-medium text-slate-600">No complaints filed</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.complaints.map(c => (
                    <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{c.title}</p>
                        <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`ml-3 text-[10px] font-bold border px-2 py-0.5 rounded-full flex-shrink-0 ${
                        c.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        c.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-4 py-3 border-t border-slate-100 text-center">
                <Link href="/dashboard/complaints" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View all complaints →</Link>
              </div>
            </div>
          </div>

          {/* Recent Notices */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="h-5 w-5 text-rose-500" /> Recent Notices
              </h2>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {!data?.notices.length ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Bell className="h-10 w-10 mb-2 text-slate-200" />
                  <p className="text-sm font-medium text-slate-600">No active notices</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.notices.map(n => (
                    <div key={n.id} className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.category} • {new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-4 py-3 border-t border-slate-100 text-center">
                <Link href="/dashboard/notices" className="text-xs font-bold text-rose-600 hover:text-rose-700">View all notices →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
