"use client"

import { useState } from "react"
import { Settings, Bell, Shield, Eye, EyeOff, Save, Key, User, Mail, Phone } from "lucide-react"

export default function WardenSettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [notifications, setNotifications] = useState({
    newComplaints: true,
    leaveRequests: true,
    feeAlerts: true,
    emergencies: true,
    messUpdates: false,
    maintenanceAlerts: true,
  })

  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your warden account and preferences</p>
      </div>

      <div className="mt-6 space-y-6">
        {/* Profile */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><User className="h-5 w-5 text-primary" />Profile Information</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <input defaultValue="Dr. Sharma" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Warden ID</label>
              <input defaultValue="WRD-001" disabled className="mt-1 w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-sm text-muted-foreground" />
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-foreground"><Mail className="h-3.5 w-3.5" />Email</label>
              <input defaultValue="sharma@college.edu" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-foreground"><Phone className="h-3.5 w-3.5" />Phone</label>
              <input defaultValue="+91 98765 43210" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Assigned Blocks</label>
              <input defaultValue="Block A, Block B" disabled className="mt-1 w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-sm text-muted-foreground" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Department</label>
              <input defaultValue="Computer Science" className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Bell className="h-5 w-5 text-primary" />Notification Preferences</h2>
          <div className="mt-5 space-y-4">
            {[
              { key: "newComplaints" as const, label: "New Complaints", desc: "Get notified when students file complaints" },
              { key: "leaveRequests" as const, label: "Leave Requests", desc: "Notifications for new leave applications" },
              { key: "feeAlerts" as const, label: "Fee Alerts", desc: "Alerts for overdue student fees" },
              { key: "emergencies" as const, label: "Emergency Alerts", desc: "Critical hostel emergencies" },
              { key: "maintenanceAlerts" as const, label: "Maintenance Updates", desc: "Updates on maintenance requests" },
              { key: "messUpdates" as const, label: "Mess Updates", desc: "Menu changes and feedback alerts" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
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
            <div>
              <label className="text-sm font-medium text-foreground">Current Password</label>
              <div className="relative mt-1">
                <input type={showCurrentPassword ? "text" : "password"} placeholder="Enter current password" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative mt-1">
                <input type={showNewPassword ? "text" : "password"} placeholder="Enter new password" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
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
