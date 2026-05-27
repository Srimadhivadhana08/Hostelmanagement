"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {  Home,
  Users,
  CreditCard,
  DoorOpen,
  AlertTriangle,
  Shield,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Building2,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/admin", icon: Home },
  { label: "Student Management", href: "/admin/students", icon: Users },
  { label: "Fee Management", href: "/admin/fees", icon: CreditCard },
  { label: "Room Management", href: "/admin/rooms", icon: DoorOpen },
  { label: "Complaints", href: "/admin/complaints", icon: AlertTriangle },
  { label: "Warden Management", href: "/admin/wardens", icon: Shield },
  { label: "Notices", href: "/admin/notices", icon: Bell },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-sidebar-foreground">Hostel Hub</h2>
          <p className="text-xs text-muted-foreground">Admin Portal</p>
        </div>
      </div>

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

      <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/10 transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}
