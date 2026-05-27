"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { DoorOpen, Users, Bed, Wifi, Wind, Loader2, MapPin, Hash, Layers } from "lucide-react"

interface RoomData {
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
  students: Array<{ id: string; name: string; email: string; phone?: string; avatar?: string }>
}

interface UserProfile {
  name: string
  email: string
  room: (RoomData & { students: Array<{ id: string; name: string; email: string }> }) | null
}

const amenityIcons: Record<string, React.ReactNode> = {
  "WiFi": <Wifi className="h-4 w-4" />,
  "AC": <Wind className="h-4 w-4" />,
  "Fan": <Wind className="h-4 w-4" />,
  "Wardrobe": <Layers className="h-4 w-4" />,
  "Attached Bathroom": <DoorOpen className="h-4 w-4" />,
}

export default function StudentRoomPage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return
    async function load() {
      try {
        const res = await fetch(`/api/users/${session!.user!.id}`)
        const data = await res.json()
        setProfile(data.user)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session?.user?.id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const room = profile?.room

  if (!room) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-foreground">My Room</h1>
        <p className="mt-1 text-sm text-muted-foreground mb-8">Your room allocation details</p>
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border bg-card">
          <DoorOpen className="h-14 w-14 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground">No Room Assigned</h2>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            You have not been assigned a room yet. Please contact the hostel admin or warden to get a room allocation.
          </p>
        </div>
      </div>
    )
  }

  const occupancyPercent = room.capacity > 0 ? Math.round((room.occupied / room.capacity) * 100) : 0
  const roommates = room.students?.filter(s => s.id !== session?.user?.id) || []

  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Room</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your room allocation details</p>
      </div>

      {/* Room Header Card */}
      <div className="mt-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DoorOpen className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Room Number</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground">{room.roomNumber}</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {room.block && (
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" /> Block {room.block}
                </span>
              )}
              {room.floor && (
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> Floor {room.floor}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {room.type} Room
              </span>
            </div>
          </div>
          <div className={`rounded-full px-4 py-2 text-sm font-semibold ${
            room.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" :
            room.status === "OCCUPIED" ? "bg-blue-100 text-blue-700" :
            "bg-amber-100 text-amber-700"
          }`}>
            {room.status}
          </div>
        </div>
      </div>

      {/* Room Details Grid */}
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Room Type", value: room.type, icon: DoorOpen },
          { label: "Capacity", value: `${room.capacity} Person${room.capacity > 1 ? "s" : ""}`, icon: Users },
          { label: "Current Occupancy", value: `${room.occupied}/${room.capacity}`, icon: Bed },
          { label: "Monthly Rent", value: `₹${room.price?.toLocaleString() || "—"}`, icon: Layers },
        ].map(item => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <Icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{item.value}</p>
            </div>
          )
        })}
      </div>

      {/* Occupancy Bar */}
      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Room Occupancy</span>
          <span className="text-sm font-semibold text-primary">{occupancyPercent}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-2.5 rounded-full bg-primary" style={{ width: `${occupancyPercent}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{room.capacity - room.occupied} spot(s) available</p>
      </div>

      {/* Amenities */}
      {room.amenities && room.amenities.length > 0 && (
        <div className="mt-5 rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-base font-semibold text-foreground">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {room.amenities.map(a => (
              <span key={a} className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-sm text-foreground">
                {amenityIcons[a] || <DoorOpen className="h-4 w-4" />}
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Roommates */}
      <div className="mt-5 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold text-foreground">
          Roommates <span className="text-sm font-normal text-muted-foreground">({roommates.length})</span>
        </h2>
        {roommates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No roommates assigned yet</p>
        ) : (
          <div className="space-y-3">
            {roommates.map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
