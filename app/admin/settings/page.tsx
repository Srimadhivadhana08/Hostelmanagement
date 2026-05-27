"use client"

import { useState } from "react"
import { Settings, Bell, Shield, Eye, EyeOff, Save, Key, User, Mail, Phone, Building, CreditCard } from "lucide-react"

export default function AdminSettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [notifications, setNotifications] = useState({
    feeAlerts: true,
    complaints: true,
    wardenUpdates: true,
    emergencies: true,
    occupancy: true,
    reports: false,
  })

  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage system settings and admin preferences</p>
      </div>

      <div className="mt-6 space-y-6">
        {/* Admin Profile */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><User className="h-5 w-5 text-primary" />Admin Profile</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium text-foreground">Full Name</label><input defaultValue="Admin User" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-sm font-medium text-foreground">Admin ID</label><input defaultValue="ADM-001" disabled className="mt-1 w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-sm text-muted-foreground" /></div>
            <div><label className="flex items-center gap-1 text-sm font-medium text-foreground"><Mail className="h-3.5 w-3.5" />Email</label><input defaultValue="admin@college.edu" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="flex items-center gap-1 text-sm font-medium text-foreground"><Phone className="h-3.5 w-3.5" />Phone</label><input defaultValue="+91 98765 00000" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
          </div>
        </div>

        {/* Hostel Configuration */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Building className="h-5 w-5 text-primary" />Hostel Configuration</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium text-foreground">Hostel Name</label><input defaultValue="College Hostel Hub" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-sm font-medium text-foreground">Total Blocks</label><input defaultValue="5" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-sm font-medium text-foreground">Night Curfew Time</label><input defaultValue="10:30 PM" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-sm font-medium text-foreground">Academic Year</label><input defaultValue="2024-25" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
          </div>
        </div>

        {/* Fee Configuration */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><CreditCard className="h-5 w-5 text-primary" />Fee Configuration</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div><label className="text-sm font-medium text-foreground">Single Room Fee (per sem)</label><input defaultValue="30,000" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-sm font-medium text-foreground">Double Sharing Fee</label><input defaultValue="25,000" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-sm font-medium text-foreground">Triple Sharing Fee</label><input defaultValue="20,000" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-sm font-medium text-foreground">Late Fee (per week)</label><input defaultValue="500" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-sm font-medium text-foreground">Mess Fee (per month)</label><input defaultValue="4,000" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-sm font-medium text-foreground">Security Deposit</label><input defaultValue="5,000" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Bell className="h-5 w-5 text-primary" />Notification Preferences</h2>
          <div className="mt-5 space-y-4">
            {[
              { key: "feeAlerts" as const, label: "Fee Collection Alerts", desc: "Notifications for fee deadlines and overdue payments" },
              { key: "complaints" as const, label: "Escalated Complaints", desc: "High priority complaints that need admin attention" },
              { key: "wardenUpdates" as const, label: "Warden Reports", desc: "Daily and weekly warden activity reports" },
              { key: "emergencies" as const, label: "Emergency Alerts", desc: "Critical hostel emergencies and security issues" },
              { key: "occupancy" as const, label: "Occupancy Updates", desc: "Changes in room allocation and occupancy" },
              { key: "reports" as const, label: "Automated Reports", desc: "Weekly and monthly auto-generated reports" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                <button onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))} className={`relative h-6 w-11 rounded-full transition-colors ${notifications[item.key] ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${notifications[item.key] ? "translate-x-5" : "translate-x-0"}`} />
                  <span className="sr-only">Toggle {item.label}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Shield className="h-5 w-5 text-primary" />Security</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium text-foreground">Current Password</label><div className="relative mt-1"><input type={showCurrentPassword ? "text" : "password"} placeholder="Enter current password" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /><button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
            <div><label className="text-sm font-medium text-foreground">New Password</label><div className="relative mt-1"><input type={showNewPassword ? "text" : "password"} placeholder="Enter new password" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /><button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
          </div>
          <button className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"><Key className="h-4 w-4" />Update Password</button>
        </div>

        <div className="flex justify-end">
          <button className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"><Save className="h-4 w-4" />Save All Settings</button>
        </div>
      </div>
    </div>
  )
}
