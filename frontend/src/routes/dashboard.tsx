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
  const { token, user } = useContext(AuthContext)
  
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const limit = 12

  if (!token) {
    return <Navigate to="/" />
  }

  const { isLoading, isError, data, refetch } = useQuery({
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
        <Button onClick={() => refetch()}>Retry</Button>
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
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 justify-between border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <h2 className="font-semibold text-lg">Dashboard Overview</h2>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Top Analytics Cards */}
          {isLoading || !data ? (
            <Loading />
          ) : (
            <>
              <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                <NumberLabel value={totalCount} label="Total Filtered Shipments" />
                <NumberLabel value={getShipmentsCountForStatus(shipmentsList, ShipmentStatus.Placed)} label="Placed" />
                <NumberLabel value={getShipmentsCountForStatus(shipmentsList, ShipmentStatus.InTransit)} label="In Transit" />
                <NumberLabel value={getShipmentsCountForStatus(shipmentsList, ShipmentStatus.Delivered)} label="Delivered" />
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-4 rounded-xl border">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    placeholder="Search package content or email..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="pl-9 bg-white"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <Filter className="size-4" /> Filter Status:
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                      setStatusFilter(val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-44 bg-white">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="placed">Placed</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Shipments Cards Grid */}
              {shipmentsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-slate-50 text-slate-500 gap-2">
                  <p className="font-semibold text-lg">No shipments found</p>
                  <p className="text-sm">Try adjusting your search query or status filter.</p>
                </div>
              ) : (
                <div className="grid auto-rows-min gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {shipmentsList.map((shipment: any) => (
                    <ShipmentCard key={shipment.id} shipment={shipment} />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4 mt-2">
                  <span className="text-sm text-slate-500">
                    Showing Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="gap-1"
                    >
                      <ChevronLeft className="size-4" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="gap-1"
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

function NumberLabel({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h1 className="text-3xl font-extrabold text-slate-900">{value}</h1>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  )
}