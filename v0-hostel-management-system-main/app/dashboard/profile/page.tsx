"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { User, Phone, MapPin, Mail, Home, Loader2, Edit2, Lock } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [user, setUser] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", address: "", department: "", year: "" })
  const [pwForm, setPwForm] = useState({ password: "", confirm: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      if (!session?.user?.id) return
      try {
        const res = await fetch(`/api/users/${session.user.id}`)
        const data = await res.json()
        setUser(data.user)
        setForm({ name: data.user.name || "", phone: data.user.phone || "", address: data.user.address || "", department: data.user.department || "", year: data.user.year ? String(data.user.year) : "" })
      } finally { setLoading(false) }
    }
    load()
  }, [session?.user?.id])

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${session?.user?.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (res.ok) { const data = await res.json(); setUser(prev => ({ ...prev, ...data.user })); setEditing(false); toast.success("Profile updated!"); await update() }
      else { toast.error("Failed to update profile") }
    } finally { setSaving(false) }
  }

  const handlePasswordChange = async () => {
    if (!pwForm.password || pwForm.password.length < 6) { toast.error("Password must be at least 6 characters"); return }
    if (pwForm.password !== pwForm.confirm) { toast.error("Passwords don't match"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${session?.user?.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pwForm.password }) })
      if (res.ok) { setChangingPassword(false); setPwForm({ password: "", confirm: "" }); toast.success("Password changed successfully!") }
      else { toast.error("Failed to change password") }
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!user) return <div className="p-8 text-center text-muted-foreground">Failed to load profile</div>

  const room = user.room as { roomNumber: string; block: string; floor: string; type: string } | null

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your personal information</p>
          {(!user.department || !user.year) && session?.user?.role === "STUDENT" && (
            <div className="mt-2 rounded-md bg-red-50 p-2 text-xs font-medium text-red-600 border border-red-200">
              ⚠️ Please update your profile with your department and year. This is mandatory to access other features like leave applications.
            </div>
          )}
        </div>
        <button onClick={() => setEditing(true)} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
          <Edit2 className="h-4 w-4" /> Edit Profile
        </button>
      </div>

      {/* Avatar & Name */}
      <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-6 mb-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
          {String(user.name || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{String(user.name)}</h2>
          <p className="text-sm text-muted-foreground capitalize">{String(user.role).toLowerCase()}</p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
            {user.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border mb-6">
        {[
          { icon: Mail, label: "Email", value: String(user.email) },
          { icon: Edit2, label: "Department", value: String(user.department || "Not provided") },
          { icon: Edit2, label: "Year", value: String(user.year || "Not provided") },
          { icon: Phone, label: "Phone", value: String(user.phone || "Not provided") },
          { icon: MapPin, label: "Address", value: String(user.address || "Not provided") },
          { icon: Home, label: "Room", value: room ? `${room.roomNumber} · Block ${room.block} · Floor ${room.floor} · ${room.type}` : "Not assigned" },
          { icon: User, label: "Member Since", value: new Date(user.createdAt as string).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-muted p-2">
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-medium text-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Change Password Button */}
      <button onClick={() => setChangingPassword(true)} className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted transition-colors w-full">
        <Lock className="h-4 w-4 text-muted-foreground" /> Change Password
      </button>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div><label className="block text-sm font-medium mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              {session?.user?.role === "STUDENT" && (
                <>
                  <div><label className="block text-sm font-medium mb-1">Department *</label>
                    <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g., Computer Science, AIDS" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Year *</label>
                    <input type="number" min="1" max="5" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g., 1, 2, 3, 4" required /></div>
                </>
              )}
              <div><label className="block text-sm font-medium mb-1">Address</label>
                <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditing(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {changingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Change Password</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">New Password</label>
                <input type="password" value={pwForm.password} onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Min 6 characters" /></div>
              <div><label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setChangingPassword(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handlePasswordChange} disabled={saving} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
