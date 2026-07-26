import { Edit3, Package, PackageX, Printer } from "lucide-react";
import { useContext } from "react";
import { useNavigate } from "react-router";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";
import { ShippingLabelModal } from "~/components/shipping-label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { AuthContext } from "~/contexts/AuthContext";
import type { Shipment } from "~/lib/client";


export default function ShipmentView({ shipment }: { shipment: Shipment }) {
    const { user } = useContext(AuthContext)
    const navigate = useNavigate()

    const estimatedDeliveryStr = shipment.estimated_delivery && shipment.estimated_delivery.includes("T")
        ? shipment.estimated_delivery.split("T")[0]
        : shipment.estimated_delivery || "N/A";

    const timeline = shipment.timeline || [];

    const details = [
        {
            "title": "Weight",
            "description": `${shipment.weight ?? 0} kg`,
        },
        {
            "title": "Destination",
            "description": shipment.destination ?? "N/A",
        },
        {
            "title": "Estimated Delivery",
            "description": estimatedDeliveryStr,
        },
        {
            "title": "Total Updates",
            "description": `${timeline.length} scans`,
        },
    ]

    const tags = shipment.tags || [];

    return (
        <div className="flex flex-col gap-6 w-full max-w-[640px] relative text-left pt-2">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#FFEFE8] to-[#FFF5F2] border border-[#FF6B4A]/15">
                <div className="w-14 h-14 bg-white text-[#FF6B4A] rounded-xl flex items-center justify-center shadow-xs border border-[#FF6B4A]/10 shrink-0">
                    <Package size={28} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug break-all">{shipment.content || "Parcel"}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Destination Pincode: <span className="text-[#FF6B4A] font-bold">{shipment.destination ?? "N/A"}</span></p>
                </div>
            </div>

            {
                tags.length !== 0 &&
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                        <Badge key={index} className="bg-[#FFEFE8] text-[#FF6B4A] border-[#FF6B4A]/20 hover:bg-[#FFEFE8] font-bold text-xs">{tag.name}</Badge>
                    ))}
                </div>
            }

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {details.map((item, index) => (
                    <div key={index} className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{item.title}</span>
                        <span className="text-sm font-extrabold text-slate-800 break-words block">{item.description}</span>
                    </div>
                ))}
            </div>

            <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Transit History</h4>
                <div className="rounded-2xl border border-[#FF6B4A]/15 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-[#FFEFE8]">
                            <TableRow className="border-b border-[#FF6B4A]/10">
                                <TableHead className="font-bold text-slate-700 text-xs">Date / Time</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Location</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Status</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {timeline.map((item, index) => {
                                const dateStr = item.created_at && item.created_at.includes("T")
                                    ? `${item.created_at.split("T")[0]} ${item.created_at.split("T")[1].slice(0, 5)}`
                                    : item.created_at || "--";
                                return (
                                    <TableRow key={index} className="border-b border-slate-100 hover:bg-[#FFF5F2]/50">
                                        <TableCell className="text-xs font-mono font-bold text-slate-600">{dateStr}</TableCell>
                                        <TableCell className="text-xs font-medium text-slate-700">{item.location || "--"}</TableCell>
                                        <TableCell className="text-xs font-extrabold text-[#FF6B4A] uppercase">{item.status?.replace(/_/g, " ")}</TableCell>
                                        <TableCell className="text-xs text-slate-600">{item.description || "--"}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-slate-100">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2 h-11 px-4 rounded-xl border-[#FF6B4A]/20 text-slate-700 hover:bg-[#FFEFE8] hover:text-[#FF6B4A] font-bold text-xs transition-all">
                            <Printer className="size-4 text-[#FF6B4A]" />
                            Print Shipping Label
                        </Button>
                    </DialogTrigger>
                    <ShippingLabelModal shipment={shipment} />
                </Dialog>
                {
                    user === "seller" &&
                    <Button variant="outline" className="gap-2 h-11 px-4 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all">
                        <PackageX className="size-4" />
                        Cancel Shipment
                    </Button>
                }
                {
                    user === "partner" &&
                    <Button
                        onClick={() => {
                            navigate({
                                pathname: "/update-shipment",
                                search: `?id=${shipment.id}`,
                            })
                        }}
                        className="btn-coral-gradient gap-2 h-11 px-5 rounded-xl text-white font-bold text-xs shadow-md shadow-[#FF6B4A]/20 transition-all hover:scale-[1.01]"
                    >
                        <Edit3 className="size-4" />
                        Update Shipment Status
                    </Button>
                }
            </div>
        </div>
    );
}