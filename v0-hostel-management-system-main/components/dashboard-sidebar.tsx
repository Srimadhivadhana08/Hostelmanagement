"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  Home,
  AlertTriangle,
  CalendarDays,
  UtensilsCrossed,
  Bell,
  User,
  Settings,
  LogOut,
  Building2,
  CheckCircle2,
  CreditCard,
  DoorOpen,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "My Room", href: "/dashboard/room", icon: DoorOpen },
  { label: "Attendance", href: "/dashboard/attendance", icon: CheckCircle2 },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Complaints", href: "/dashboard/complaints", icon: AlertTriangle },
  { label: "Leave", href: "/dashboard/leave", icon: CalendarDays },
  { label: "Mess Menu", href: "/dashboard/mess-menu", icon: UtensilsCrossed },
  { label: "Notices", href: "/dashboard/notices", icon: Bell },
  { label: "Profile", href: "/dashboard/profile", icon: User },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-sidebar-foreground">
            Hostel Hub
          </h2>
          <p className="text-xs text-muted-foreground">Student Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/10"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/10 transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}
