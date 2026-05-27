"use client"

import { useEffect, useState } from "react"
import { UtensilsCrossed, Loader2, Sun, Coffee, Moon, Star } from "lucide-react"

interface MessMenu {
  id: string; date: string; breakfast: string; lunch: string; dinner: string; special?: string
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function MessMenuPage() {
  const [menus, setMenus] = useState<MessMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<MessMenu | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/mess")
        const data = await res.json()
        setMenus(data.menus || [])
        const todayStr = new Date().toDateString()
        const todayMenu = data.menus?.find((m: MessMenu) => new Date(m.date).toDateString() === todayStr)
        setSelectedDay(todayMenu || data.menus?.[0] || null)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const today = new Date().toDateString()

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  const meals = [
    { label: "Breakfast", time: "7:00 AM - 9:00 AM", key: "breakfast" as const, icon: Coffee, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    { label: "Lunch", time: "12:00 PM - 2:00 PM", key: "lunch" as const, icon: Sun, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
    { label: "Dinner", time: "7:00 PM - 9:00 PM", key: "dinner" as const, icon: Moon, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  ]

  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mess Menu</h1>
        <p className="mt-1 text-sm text-muted-foreground">This week&apos;s meal schedule</p>
      </div>

      {/* Day Selector */}
      {menus.length > 0 && (
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {menus.map((m) => {
            const d = new Date(m.date)
            const isToday = d.toDateString() === today
            const isSelected = selectedDay?.id === m.id
            return (
              <button
                key={m.id}
                onClick={() => setSelectedDay(m)}
                className={`flex min-w-[72px] flex-col items-center rounded-xl px-4 py-3 transition-all border text-sm font-medium flex-shrink-0 ${isSelected ? "bg-primary text-primary-foreground border-primary shadow-sm" :
                    isToday ? "border-primary/40 bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:border-primary/30"
                  }`}
              >
                <span className="text-xs opacity-75">{DAYS[d.getDay()]}</span>
                <span className="text-lg font-bold">{d.getDate()}</span>
                {isToday && <span className="text-[10px] opacity-75 mt-0.5">Today</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Selected Day Menu */}
      {selectedDay ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {new Date(selectedDay.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            {new Date(selectedDay.date).toDateString() === today && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Today</span>
            )}
          </div>

          {selectedDay.special && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 flex items-start gap-3">
              <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Special Today!</p>
                <p className="text-sm text-yellow-700 mt-0.5">{selectedDay.special}</p>
              </div>
            </div>
          )}

          {meals.map((meal) => (
            <div key={meal.label} className={`rounded-xl border ${meal.border} ${meal.bg} p-5`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-white/60 p-2">
                  <meal.icon className={`h-5 w-5 ${meal.color}`} />
                </div>
                <div>
                  <p className={`font-semibold ${meal.color}`}>{meal.label}</p>
                  <p className="text-xs text-muted-foreground">{meal.time}</p>
                </div>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{selectedDay[meal.key]}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No menu available</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Menu will be posted by the warden</p>
        </div>
      )}
    </div>
  )
}
