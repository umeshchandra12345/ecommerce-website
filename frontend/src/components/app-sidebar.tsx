import { Package } from "lucide-react"
import * as React from "react"
import { useContext } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "~/components/ui/sidebar"
import { AuthContext } from "~/contexts/AuthContext"

export function AppSidebar({ currentRoute, ...props }: { currentRoute: string } & React.ComponentProps<typeof Sidebar>) {
  
  const { user } = useContext(AuthContext)
  
  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
    },
    {
      title: "Account",
      url: "/account",
    }
  ]

  return (
    <Sidebar variant="floating" className="border-r border-[#FF6B4A]/10 bg-white/80 backdrop-blur-md" {...props}>
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-[#FFEFE8]/60 transition-colors rounded-2xl">
              <a href="/dashboard" className="flex items-center gap-3">
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B4A] to-[#FF8F73] text-white shadow-md shadow-[#FF6B4A]/20">
                  <Package className="size-5" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-slate-800 text-base">FastShip</span>
                  <span className="text-xs font-medium text-[#FF6B4A] tracking-wider uppercase">Delivery Network</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {menuItems.map((item) => {
              const isActive = currentRoute === item.title
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={`rounded-xl px-4 py-2.5 font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-[#FF6B4A] to-[#FF8F73] text-white shadow-md shadow-[#FF6B4A]/25 hover:text-white"
                        : "text-slate-600 hover:bg-[#FFEFE8] hover:text-[#FF6B4A]"
                    }`}
                  >
                    <a href={item.url}>
                      {item.title}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
            {
              user === "seller" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={currentRoute === "Submit Shipment"}
                    className={`rounded-xl px-4 py-2.5 font-medium transition-all ${
                      currentRoute === "Submit Shipment"
                        ? "bg-gradient-to-r from-[#FF6B4A] to-[#FF8F73] text-white shadow-md shadow-[#FF6B4A]/25 hover:text-white"
                        : "text-slate-600 hover:bg-[#FFEFE8] hover:text-[#FF6B4A]"
                    }`}
                  >
                    <a href="/submit-shipment">
                      Submit Shipment
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }
            {
              user === "partner" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={currentRoute === "Update Shipment"}
                    className={`rounded-xl px-4 py-2.5 font-medium transition-all ${
                      currentRoute === "Update Shipment"
                        ? "bg-gradient-to-r from-[#FF6B4A] to-[#FF8F73] text-white shadow-md shadow-[#FF6B4A]/25 hover:text-white"
                        : "text-slate-600 hover:bg-[#FFEFE8] hover:text-[#FF6B4A]"
                    }`}
                  >
                    <a href="/update-shipment">
                      Update Shipment
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
