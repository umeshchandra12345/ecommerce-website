import { useQuery } from "@tanstack/react-query"
import { useContext, useState } from "react"
import { Navigate } from "react-router"
import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { AppSidebar } from "~/components/app-sidebar"
import ShipmentCard from "~/components/shipment-card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import Loading from "~/components/ui/loading"
import { Separator } from "~/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { AuthContext } from "~/contexts/AuthContext"
import api from "~/lib/api"
import { ShipmentStatus } from "~/lib/client"
import { getShipmentsCountForStatus } from "~/lib/utils"

export default function DashboardPage() {
  const { token, user, logout } = useContext(AuthContext)
  
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const limit = 12

  if (!token) {
    return <Navigate to="/" />
  }

  const { isFetching, isError, data, refetch } = useQuery({
    queryKey: ["shipments", user, token, search, statusFilter, page],
    queryFn: async () => {
      if (!user) return { items: [], totalPages: 1 }
      const queryParams: any = {
        page,
        limit,
        ...(search ? { search } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      }
      
      let res;
      if (user === "seller") {
        res = await api.seller.getShipments(queryParams)
      } else if (user === "partner") {
        res = await api.partner.getShipments(queryParams)
      } else {
        return { items: [], totalPages: 1, totalCount: 0 }
      }

      // Support both paginated body {items, total, total_pages} and plain array response
      const body = res.data as any
      if (body && typeof body === 'object' && !Array.isArray(body) && body.items) {
        return {
          items: body.items || [],
          totalCount: body.total ?? body.items.length,
          totalPages: body.total_pages ?? 1,
        }
      }
      // Fallback: plain array (old API format)
      const items = Array.isArray(body) ? body : []
      const totalCount = parseInt(res.headers?.["x-total-count"] || String(items.length), 10)
      const totalPages = parseInt(res.headers?.["x-total-pages"] || "1", 10)
      return {
        items,
        totalCount: isNaN(totalCount) ? items.length : totalCount,
        totalPages: isNaN(totalPages) ? 1 : totalPages,
      }
    },
    retry: 2,
    enabled: !!user && !!token && (user === "seller" || user === "partner"),
  })

  if (isError) {
    return (
      <div className="flex flex-col gap-4 h-screen items-center justify-center">
        <h1 className="text-2xl font-bold">Error loading shipments</h1>
        <p className="text-muted-foreground text-sm">Your session may have expired or database was reset.</p>
        <div className="flex gap-2">
          <Button onClick={() => refetch()}>Retry</Button>
          <Button variant="outline" onClick={logout}>Log In Again</Button>
        </div>
      </div>
    )
  }

  const shipmentsList = data?.items || []
  const totalPages = data?.totalPages || 1
  const totalCount = data?.totalCount || shipmentsList.length

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar currentRoute="Dashboard" />
      <SidebarInset className="bg-[#FFF5F2]/50 min-h-screen">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-6 border-b border-[#FF6B4A]/10 bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4 bg-[#FF6B4A]/20"
            />
            <h2 className="font-extrabold text-lg text-slate-800 tracking-tight">Dashboard Overview</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#FFEFE8] px-3 py-1 text-xs font-bold text-[#FF6B4A] border border-[#FF6B4A]/20 uppercase tracking-wider">
              {user === "seller" ? "Seller Portal" : "Partner Portal"}
            </span>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
          {/* Top Analytics Cards */}
          {isFetching && !data ? (
            <Loading />
          ) : (
            <>
              <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                <NumberLabel value={totalCount} label="Total Shipments" icon="📦" />
                <NumberLabel value={getShipmentsCountForStatus(shipmentsList, ShipmentStatus.Placed)} label="Placed" icon="🆕" />
                <NumberLabel value={getShipmentsCountForStatus(shipmentsList, ShipmentStatus.InTransit)} label="In Transit" icon="🚚" />
                <NumberLabel value={getShipmentsCountForStatus(shipmentsList, ShipmentStatus.Delivered)} label="Delivered" icon="✅" />
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-5 rounded-2xl border border-[#FF6B4A]/15 shadow-sm">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    placeholder="Search contents or email..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="pl-10 h-11 rounded-xl bg-slate-100/70 border-none text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#FF6B4A]/40 transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Filter className="size-4 text-[#FF6B4A]" /> Status:
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                      setStatusFilter(val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-11 w-44 rounded-xl bg-slate-100/70 border-none text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#FF6B4A]/40 transition-all font-medium">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#FF6B4A]/15 bg-white">
                      <SelectItem value="all" className="rounded-lg focus:bg-[#FFEFE8] focus:text-[#FF6B4A]">All Statuses</SelectItem>
                      <SelectItem value="placed" className="rounded-lg focus:bg-[#FFEFE8] focus:text-[#FF6B4A]">Placed</SelectItem>
                      <SelectItem value="in_transit" className="rounded-lg focus:bg-[#FFEFE8] focus:text-[#FF6B4A]">In Transit</SelectItem>
                      <SelectItem value="out_for_delivery" className="rounded-lg focus:bg-[#FFEFE8] focus:text-[#FF6B4A]">Out for Delivery</SelectItem>
                      <SelectItem value="delivered" className="rounded-lg focus:bg-[#FFEFE8] focus:text-[#FF6B4A]">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Shipments Cards Grid */}
              {shipmentsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-[#FF6B4A]/15 rounded-2xl bg-white text-slate-500 gap-2 shadow-sm">
                  <span className="text-4xl mb-2">📦</span>
                  <p className="font-extrabold text-lg text-slate-800">No shipments found</p>
                  <p className="text-sm text-slate-400">Try adjusting your search query or status filter.</p>
                </div>
              ) : (
                <div className="grid auto-rows-min gap-5 md:grid-cols-3 xl:grid-cols-4">
                  {shipmentsList.map((shipment: any) => (
                    <ShipmentCard key={shipment.id} shipment={shipment} />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#FF6B4A]/10 pt-5 mt-2">
                  <span className="text-sm font-medium text-slate-500">
                    Showing Page <strong className="text-[#FF6B4A]">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-10 px-4 rounded-xl border-[#FF6B4A]/20 bg-white text-slate-700 hover:bg-[#FFEFE8] hover:text-[#FF6B4A] gap-1 transition-all"
                    >
                      <ChevronLeft className="size-4" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="h-10 px-4 rounded-xl border-[#FF6B4A]/20 bg-white text-slate-700 hover:bg-[#FFEFE8] hover:text-[#FF6B4A] gap-1 transition-all"
                    >
                      Next <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function NumberLabel({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#FF6B4A]/15 bg-white p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-slate-800">{value}</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFEFE8] text-2xl border border-[#FF6B4A]/15">
        {icon}
      </div>
    </div>
  )
}