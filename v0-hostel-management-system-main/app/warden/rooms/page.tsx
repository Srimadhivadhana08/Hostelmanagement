"use client"

import { useEffect, useState } from "react"
import { Home, Plus, Loader2, Edit2 } from "lucide-react"
import { toast } from "sonner"

interface Room { id: string; roomNumber: string; type: string; capacity: number; occupied: number; price: number; status: string; floor?: string; block?: string; amenities: string[] }
interface Student { id: string; name: string; email: string }

const statusColors: Record<string, string> = { AVAILABLE: "text-emerald-600 bg-emerald-50 border-emerald-200", OCCUPIED: "text-blue-600 bg-blue-50 border-blue-200", MAINTENANCE: "text-amber-600 bg-amber-50 border-amber-200", RESERVED: "text-purple-600 bg-purple-50 border-purple-200" }

export default function WardenRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [showCreate, setShowCreate] = useState(false)
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [form, setForm] = useState({ roomNumber: "", type: "DOUBLE", capacity: "2", price: "", floor: "", block: "", amenities: "" })
  const [saving, setSaving] = useState(false)

  const fetch_ = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "100" })
      if (filterStatus !== "ALL") params.set("status", filterStatus)
      const [roomsRes, studRes] = await Promise.all([fetch(`/api/rooms?${params}`), fetch("/api/users?role=STUDENT&isActive=true&limit=200")])
      const [roomsData, studData] = await Promise.all([roomsRes.json(), studRes.json()])
      setRooms(roomsData.rooms || [])
      setStudents(studData.users?.filter((u: Student) => !roomsData.rooms.some((r: Room & { students?: Student[] }) => r.students?.find((s: Student) => s.id === u.id))) || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch_() }, [filterStatus])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.roomNumber || !form.price) { toast.error("Room number and price required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, capacity: parseInt(form.capacity), price: parseFloat(form.price), amenities: form.amenities.split(",").map(a => a.trim()).filter(Boolean) }) })
      if (res.ok) { toast.success("Room created!"); setShowCreate(false); setForm({ roomNumber: "", type: "DOUBLE", capacity: "2", price: "", floor: "", block: "", amenities: "" }); fetch_() }
      else { const err = await res.json(); toast.error(err.error || "Failed") }
    } finally { setSaving(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/rooms/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    if (res.ok) { toast.success("Room status updated"); fetch_() }
    else { toast.error("Failed to update") }
  }

  const FormFields = () => (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1">Room Number *</label><input value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. A101" disabled={!!editRoom} /></div>
        <div><label className="block text-sm font-medium mb-1">Type</label><select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"><option value="SINGLE">Single</option><option value="DOUBLE">Double</option><option value="TRIPLE">Triple</option><option value="DORMITORY">Dormitory</option></select></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="block text-sm font-medium mb-1">Capacity</label><input type="number" min="1" max="12" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></div>
        <div><label className="block text-sm font-medium mb-1">Price (₹/mo) *</label><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></div>
        <div><label className="block text-sm font-medium mb-1">Block</label><input value={form.block} onChange={e => setForm(f => ({ ...f, block: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" placeholder="A or B" /></div>
      </div>
      <div><label className="block text-sm font-medium mb-1">Floor</label><input value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" placeholder="1, 2, 3..." /></div>
      <div><label className="block text-sm font-medium mb-1">Amenities (comma-separated)</label><input value={form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" placeholder="WiFi, AC, Attached Bathroom..." /></div>
    </>
  )

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Room Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage room allocations and availability</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Room
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {["ALL", "AVAILABLE", "OCCUPIED", "MAINTENANCE", "RESERVED"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>{s}</button>
        ))}
      </div>

      {/* Create Modal */}
      {(showCreate || editRoom) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editRoom ? "Edit Room" : "Add New Room"}</h2>
            <form onSubmit={editRoom ? async (e) => { e.preventDefault(); setSaving(true); const res = await fetch(`/api/rooms/${editRoom.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ price: parseFloat(form.price), capacity: parseInt(form.capacity), floor: form.floor, block: form.block, amenities: form.amenities.split(",").map(a => a.trim()).filter(Boolean) }) }); if (res.ok) { toast.success("Room updated!"); setEditRoom(null); fetch_() } else toast.error("Failed"); setSaving(false) } : handleCreate} className="space-y-3">
              <FormFields />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setEditRoom(null) }} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editRoom ? "Save Changes" : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-xs font-semibold text-muted-foreground uppercase">
                <th className="px-4 py-3 text-left">Room #</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Block/Floor</th>
                <th className="px-4 py-3 text-center">Occupancy</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rooms.map(room => (
                <tr key={room.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground">{room.roomNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">{room.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{room.block || "—"} / {room.floor || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-semibold ${room.occupied >= room.capacity ? "text-red-600" : "text-foreground"}`}>{room.occupied}/{room.capacity}</span>
                    <div className="w-16 h-1.5 mx-auto mt-1 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${(room.occupied / room.capacity) * 100}%` }} /></div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">₹{room.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <select value={room.status} onChange={e => updateStatus(room.id, e.target.value)} className={`rounded-full px-2 py-1 text-xs font-medium border cursor-pointer ${statusColors[room.status]}`}>
                      {["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RESERVED"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => { setEditRoom(room); setForm({ roomNumber: room.roomNumber, type: room.type, capacity: String(room.capacity), price: String(room.price), floor: room.floor || "", block: room.block || "", amenities: room.amenities.join(", ") }) }} className="rounded-lg bg-muted p-1.5 hover:bg-muted/80"><Edit2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
