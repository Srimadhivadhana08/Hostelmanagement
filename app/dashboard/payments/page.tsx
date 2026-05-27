"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { CreditCard, CheckCircle2, AlertCircle, Loader2, Receipt } from "lucide-react"
import { toast } from "sonner"

interface Fee {
  id: string
  month: string
  year: number
  roomRent: number
  messCharges: number
  otherCharges: number
  totalAmount: number
  paid: number
  due: number
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE"
  paidAt?: string
  transactionId?: string
}

const statusConfig = {
  PENDING: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  PARTIAL: { label: "Partial", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  PAID: { label: "Paid", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  OVERDUE: { label: "Overdue", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
}

export default function StudentPaymentsPage() {
  const { data: session } = useSession()
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)
  const [payModal, setPayModal] = useState<Fee | null>(null)
  const [payAmount, setPayAmount] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/fees?limit=24")
      const data = await res.json()
      setFees(data.fees || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) load()
  }, [session?.user?.id])

  const handlePay = async () => {
    if (!payModal || !payAmount) { toast.error("Enter amount"); return }
    const amt = parseFloat(payAmount)
    if (isNaN(amt) || amt <= 0 || amt > payModal.due) { toast.error("Invalid amount"); return }
    setPaying(payModal.id)
    try {
      const res = await fetch(`/api/fees/${payModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: payModal.paid + amt }),
      })
      if (res.ok) {
        toast.success("Payment recorded successfully!")
        setPayModal(null)
        setPayAmount("")
        load()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to process payment")
      }
    } finally {
      setPaying(null)
    }
  }

  const totalDue = fees.reduce((s, f) => s + f.due, 0)
  const totalPaid = fees.reduce((s, f) => s + f.paid, 0)
  const pendingCount = fees.filter(f => f.status !== "PAID").length

  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">View and pay your hostel fees</p>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-red-200 bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Due</p>
              <p className="mt-1 text-2xl font-bold text-red-600">₹{totalDue.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{pendingCount} pending record(s)</p>
            </div>
            <div className="rounded-lg bg-red-50 p-2"><AlertCircle className="h-5 w-5 text-red-600" /></div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">₹{totalPaid.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">All time</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
          </div>
        </div>
        <div className="rounded-xl border border-primary/20 bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{fees.length}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Fee entries</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2"><Receipt className="h-5 w-5 text-primary" /></div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-1">Pay Fee</h2>
            <p className="text-sm text-muted-foreground mb-4">{payModal.month} {payModal.year}</p>
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Total</p><p className="font-bold text-sm">₹{payModal.totalAmount.toLocaleString()}</p></div>
              <div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-emerald-600">Paid</p><p className="font-bold text-sm text-emerald-700">₹{payModal.paid.toLocaleString()}</p></div>
              <div className="rounded-lg bg-red-50 p-3"><p className="text-xs text-red-600">Due</p><p className="font-bold text-sm text-red-700">₹{payModal.due.toLocaleString()}</p></div>
            </div>
            <label className="block text-sm font-medium mb-1">Amount to Pay (₹)</label>
            <input
              type="number"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              max={payModal.due}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mb-1"
              placeholder={`Max ₹${payModal.due}`}
            />
            <button onClick={() => setPayAmount(String(payModal.due))} className="text-xs text-primary hover:underline mb-4 block">
              Pay full amount (₹{payModal.due})
            </button>
            <div className="flex gap-2">
              <button onClick={() => { setPayModal(null); setPayAmount("") }} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
              <button
                onClick={handlePay}
                disabled={paying === payModal.id}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {paying === payModal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Records */}
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold text-foreground">Fee History</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : fees.length === 0 ? (
          <div className="flex flex-col items-center py-16 rounded-xl border border-dashed border-border bg-card">
            <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No fee records found</p>
            <p className="text-xs text-muted-foreground mt-1">Contact admin if you expect fee records here</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-4 py-3 text-left">Period</th>
                  <th className="px-4 py-3 text-right">Rent</th>
                  <th className="px-4 py-3 text-right">Mess</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fees.map(f => {
                  const cfg = statusConfig[f.status]
                  return (
                    <tr key={f.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{f.month} {f.year}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">₹{f.roomRent.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">₹{f.messCharges.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{f.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">₹{f.paid.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">₹{f.due.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {f.due > 0 ? (
                          <button
                            onClick={() => { setPayModal(f); setPayAmount("") }}
                            className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 flex items-center gap-1 mx-auto"
                          >
                            <CreditCard className="h-3 w-3" /> Pay
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
