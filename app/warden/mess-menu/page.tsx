"use client"

import { useEffect, useState } from "react"
import { UtensilsCrossed, Plus, Loader2, Coffee, Sun, Moon } from "lucide-react"
import { toast } from "sonner"

interface MessMenu { id: string; date: string; breakfast: string; lunch: string; dinner: string; special?: string }

export default function WardenMessMenuPage() {
  const [menus, setMenus] = useState<MessMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], breakfast: "", lunch: "", dinner: "", special: "" })
  const [saving, setSaving] = useState(false)

  const fetch_ = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/mess?from=" + new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0] + "&to=" + new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0])
      const data = await res.json()
      setMenus(data.menus || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch_() }, [])

  const prefillPrevious = () => {
    if (menus.length === 0) return
    const last = menus[menus.length - 1]
    setForm(f => ({ ...f, breakfast: last.breakfast, lunch: last.lunch, dinner: last.dinner, special: last.special || "" }))
    toast.info("Prefilled from previous menu")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.breakfast || !form.lunch || !form.dinner) { toast.error("All meals required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/mess", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (res.ok) { toast.success("Menu saved!"); setShowForm(false); setForm({ date: new Date().toISOString().split("T")[0], breakfast: "", lunch: "", dinner: "", special: "" }); fetch_() }
      else { toast.error("Failed to save menu") }
    } finally { setSaving(false) }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mess Menu</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage daily mess menus</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Menu
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Create/Edit Daily Menu</h2>
              <button onClick={prefillPrevious} className="text-xs text-primary hover:underline border border-primary/30 rounded-lg px-2 py-1">Copy Previous</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Date *</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1"><Coffee className="h-4 w-4 text-amber-600" /> Breakfast *</label>
                <input value={form.breakfast} onChange={e => setForm(f => ({ ...f, breakfast: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Idli, Sambar, Chutney" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1"><Sun className="h-4 w-4 text-orange-600" /> Lunch *</label>
                <input value={form.lunch} onChange={e => setForm(f => ({ ...f, lunch: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Rice, Dal, Sabzi, Roti" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1"><Moon className="h-4 w-4 text-indigo-600" /> Dinner *</label>
                <input value={form.dinner} onChange={e => setForm(f => ({ ...f, dinner: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Chapati, Paneer, Dal" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Special Item (optional)</label>
                <input value={form.special} onChange={e => setForm(f => ({ ...f, special: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Sunday Special: Gulab Jamun" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : menus.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-xl border border-dashed border-border bg-card mt-5">
          <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No menus created yet. Add the first one!</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {menus.reverse().map(m => {
            const isToday = new Date(m.date).toDateString() === new Date().toDateString()
            return (
              <div key={m.id} className={`rounded-xl border p-5 ${isToday ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>
                    {new Date(m.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                  </h3>
                  {isToday && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Today</span>}
                </div>
                {m.special && <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-2 py-1 mb-2">⭐ {m.special}</p>}
                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-2"><Coffee className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" /><p className="text-muted-foreground"><span className="font-medium text-foreground">B: </span>{m.breakfast}</p></div>
                  <div className="flex gap-2"><Sun className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 mt-0.5" /><p className="text-muted-foreground"><span className="font-medium text-foreground">L: </span>{m.lunch}</p></div>
                  <div className="flex gap-2"><Moon className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0 mt-0.5" /><p className="text-muted-foreground"><span className="font-medium text-foreground">D: </span>{m.dinner}</p></div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
