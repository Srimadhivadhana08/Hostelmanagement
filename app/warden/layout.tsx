import WardenSidebar from "@/components/warden-sidebar"

export default function WardenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <WardenSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
