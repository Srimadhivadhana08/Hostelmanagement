"use client"

import { useEffect, useState } from "react"
import { DoorOpen, Loader2, Search, Plus, Users, X, CheckCircle2, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Room {
  id: string
  roomNumber: string
  type: string
  capacity: number
  occupied: number
  price: number
  status: string
  amenities: string[]
  floor?: string
  block?: string
  students: Array<{ id: string; name: string; email: string }>
}

interface Student {
  id: string
  name: string
  email: string
  roomId?: string | null
  room?: { roomNumber: string } | null
}

const statusColors: Record<string, string> = {
  AVAILABLE: "text-emerald-600 bg-emerald-50 border-emerald-200",
  OCCUPIED: "text-blue-600 bg-blue-50 border-blue-200",
  MAINTENANCE: "text-amber-600 bg-amber-50 border-amber-200",
  RESERVED: "text-purple-600 bg-purple-50 border-purple-200",
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [selected, setSelected] = useState<Room | null>(null)
  const [assignModal, setAssignModal] = useState<Room | null>(null)
  const [addModal, setAddModal] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [stuSearch, setStuSearch] = useState("")
  const [assigning, setAssigning] = useState(false)
  const [vacating, setVacating] = useState<string | null>(null)
  const [newRoom, setNewRoom] = useState({ roomNumber: "", type: "DOUBLE", capacity: 2, price: "", floor: "", block: "" })
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "100" })
      if (filterStatus !== "ALL") params.set("status", filterStatus)
      const res = await fetch(`/api/rooms?${params}`)
      const data = await res.json()
      let list = data.rooms || []
      if (search) list = list.filter((r: Room) =>
        r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
        (r.block || "").toLowerCase().includes(search.toLowerCase())
      )
      setRooms(list)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterStatus])
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t) }, [search])

  const loadStudents = async (q = "") => {
    const res = await fetch(`/api/users?role=STUDENT&limit=50${q ? `&search=${q}` : ""}`)
    const data = await res.json()
    setStudents(data.users || [])
  }

  const openAssign = async (room: Room) => {
    setAssignModal(room)
    setStuSearch("")
    await loadStudents()
  }

  const assignStudent = async (studentId: string) => {
    if (!assignModal) return
    setAssigning(true)
    try {
      // Update user's roomId
      const res = await fetch(`/api/users/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: assignModal.id }),
      })
      if (res.ok) {
        toast.success("Student assigned to room!")
        setAssignModal(null)
        load()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to assign")
      }
    } finally { setAssigning(false) }
  }

  const vacateStudent = async (studentId: string, roomId: string) => {
    setVacating(studentId)
    try {
      const res = await fetch(`/api/users/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: null }),
      })
      if (res.ok) {
        toast.success("Student vacated from room")
        setSelected(null)
        load()
      } else {
        toast.error("Failed to vacate student")
      }
    } finally { setVacating(null) }
  }

  const updateRoomStatus = async (roomId: string, status: string) => {
    const res = await fetch(`/api/rooms/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) { toast.success("Room status updated"); load() }
    else { toast.error("Failed to update status") }
  }

  const createRoom = async () => {
    if (!newRoom.roomNumber || !newRoom.price) { toast.error("Room number and price are required"); return }
    setCreating(true)
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newRoom, price: parseFloat(newRoom.price), capacity: Number(newRoom.capacity) }),
      })
      const data = await res.json()
      if (res.ok) { toast.success("Room created!"); setAddModal(false); setNewRoom({ roomNumber: "", type: "DOUBLE", capacity: 2, price: "", floor: "", block: "" }); load() }
      else { toast.error(data.error || "Failed to create room") }
    } finally { setCreating(false) }
  }

  const availableStudents = students.filter(s => !s.roomId || s.roomId === null)

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rooms Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">{rooms.length} rooms total</p>
        </div>
        <button onClick={() => setAddModal(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Room
        </button>
      </div>

      {/* Summary */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total", value: rooms.length, color: "text-foreground" },
          { label: "Available", value: rooms.filter(r => r.status === "AVAILABLE").length, color: "text-emerald-600" },
          { label: "Occupied", value: rooms.filter(r => r.status === "OCCUPIED").length, color: "text-blue-600" },
          { label: "Maintenance", value: rooms.filter(r => r.status === "MAINTENANCE").length, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm focus:outline-none" placeholder="Search room/block..." />
        </div>
        {["ALL", "AVAILABLE", "OCCUPIED", "MAINTENANCE", "RESERVED"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>
            {s === "ALL" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Add Room Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <div className="flex justify-between mb-4"><h2 className="text-lg font-bold">Add New Room</h2><button onClick={() => setAddModal(false)}><X className="h-5 w-5 text-muted-foreground" /></button></div>
            <div className="space-y-3">
              {[
                { label: "Room Number *", key: "roomNumber", placeholder: "e.g. A-101" },
                { label: "Block", key: "block", placeholder: "e.g. A" },
                { label: "Floor", key: "floor", placeholder: "e.g. 1" },
                { label: "Monthly Price (₹) *", key: "price", placeholder: "e.g. 5000" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                  <input value={(newRoom as Record<string, string | number>)[f.key] as string} onChange={e => setNewRoom(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                  <select value={newRoom.type} onChange={e => setNewRoom(p => ({ ...p, type: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">
                    {["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Capacity</label>
                  <input type="number" min={1} max={10} value={newRoom.capacity} onChange={e => setNewRoom(p => ({ ...p, capacity: Number(e.target.value) }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setAddModal(false)} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={createRoom} disabled={creating} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-70">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Room {selected.roomNumber}</h2>
                <p className="text-sm text-muted-foreground">{selected.type} · Block {selected.block || "—"} · Floor {selected.floor || "—"}</p>
              </div>
              <button onClick={() => setSelected(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4 text-center text-sm">
              <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Capacity</p><p className="font-bold">{selected.capacity}</p></div>
              <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Occupied</p><p className="font-bold">{selected.occupied}</p></div>
              <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Rent</p><p className="font-bold">₹{selected.price?.toLocaleString()}</p></div>
            </div>
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Change Status</p>
              <div className="flex flex-wrap gap-2">
                {["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RESERVED"].filter(s => s !== selected.status).map(s => (
                  <button key={s} onClick={() => { updateRoomStatus(selected.id, s); setSelected(null) }} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">→ {s}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Current Occupants ({selected.students?.length || 0})</p>
                {selected.occupied < selected.capacity && (
                  <button onClick={() => { setSelected(null); openAssign(selected) }} className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20">
                    <Plus className="h-3 w-3" /> Assign Student
                  </button>
                )}
              </div>
              {selected.students?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">No students assigned</p>
              ) : (
                <div className="space-y-2">
                  {selected.students?.map(s => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{s.name.charAt(0)}</div>
                        <div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.email}</p></div>
                      </div>
                      <button onClick={() => vacateStudent(s.id, selected.id)} disabled={vacating === s.id} className="rounded-lg bg-red-50 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 flex items-center gap-1">
                        {vacating === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Vacate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Student Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-bold">Assign Student to Room {assignModal.roomNumber}</h2>
              <button onClick={() => setAssignModal(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={stuSearch} onChange={e => { setStuSearch(e.target.value); loadStudents(e.target.value) }} className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none" placeholder="Search students..." />
            </div>
            <div className="space-y-2">
              {availableStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No unassigned students found</p>
              ) : availableStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{s.name.charAt(0)}</div>
                    <div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.email}</p></div>
                  </div>
                  <button onClick={() => assignStudent(s.id)} disabled={assigning} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 flex items-center gap-1">
                    {assigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rooms Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-xl border border-dashed border-border bg-card mt-5">
          <DoorOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No rooms found</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map(r => {
            const pct = r.capacity > 0 ? Math.round((r.occupied / r.capacity) * 100) : 0
            return (
              <div key={r.id} onClick={() => setSelected(r)} className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Room {r.roomNumber}</h3>
                    {r.block && <p className="text-xs text-muted-foreground">Block {r.block}{r.floor ? ` · Floor ${r.floor}` : ""}</p>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${statusColors[r.status]}`}>{r.status}</span>
                </div>
                <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{r.occupied}/{r.capacity} occupants</span>
                  <span className="ml-auto text-xs font-medium text-foreground">₹{r.price?.toLocaleString()}/mo</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-2 rounded-full ${pct >= 100 ? "bg-red-500" : pct > 75 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.students?.slice(0, 3).map(s => (
                    <span key={s.id} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s.name.split(" ")[0]}</span>
                  ))}
                  {(r.students?.length || 0) > 3 && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">+{(r.students?.length || 0) - 3}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
