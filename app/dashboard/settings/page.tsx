"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, Monitor, Bell, Shield, Palette } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your preferences and account settings</p>
      </div>

      {/* Theme Settings */}
      <div className="rounded-xl border border-border bg-card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2"><Palette className="h-5 w-5 text-primary" /></div>
          <div>
            <h2 className="font-semibold text-foreground">Appearance</h2>
            <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(t => (
            <button key={t.value} onClick={() => setTheme(t.value)} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${theme === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
              <t.icon className={`h-6 w-6 ${theme === t.value ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${theme === t.value ? "text-primary" : "text-foreground"}`}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="rounded-xl border border-border bg-card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2"><Bell className="h-5 w-5 text-primary" /></div>
          <div>
            <h2 className="font-semibold text-foreground">Notifications</h2>
            <p className="text-xs text-muted-foreground">Control how you receive notifications</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: "New Notices", desc: "Get notified when new notices are posted" },
            { label: "Leave Status Updates", desc: "Notify when your leave request is approved/rejected" },
            { label: "Complaint Updates", desc: "Updates on your complaint status" },
            { label: "Fee Reminders", desc: "Reminders for upcoming fee due dates" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <button onClick={() => toast.info("Notification settings saved")} className="relative h-6 w-11 rounded-full bg-primary transition-colors">
                <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2"><Shield className="h-5 w-5 text-primary" /></div>
          <div>
            <h2 className="font-semibold text-foreground">Privacy</h2>
            <p className="text-xs text-muted-foreground">Manage your privacy settings</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: "Show phone to roommates", desc: "Allow your roommates to see your phone number" },
            { label: "Public profile", desc: "Allow wardens to view your full profile" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <button onClick={() => toast.info("Settings saved")} className="relative h-6 w-11 rounded-full bg-muted border border-border transition-colors hover:bg-primary/20">
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-muted-foreground shadow-sm transition-all" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
