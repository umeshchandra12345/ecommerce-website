import { ArrowUp, ChevronRight, Package2, PackageCheck, PackageX, SquareArrowOutUpRight, Truck } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";


import { type Shipment, type ShipmentEvent } from "~/lib/client";
import ShipmentView from "./shipment-view";

const statusBadges = {
    placed: {
        label: "Placed",
        badgeStyle: "bg-blue-50 text-blue-600 border-blue-200",
        nodeStyle: "bg-blue-500 text-white shadow-md shadow-blue-500/20",
    },
    in_transit: {
        label: "In Transit",
        badgeStyle: "bg-[#FFEFE8] text-[#FF6B4A] border-[#FF6B4A]/30",
        nodeStyle: "bg-[#FF6B4A] text-white shadow-md shadow-[#FF6B4A]/20",
    },
    out_for_delivery: {
        label: "Out for Delivery",
        badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
        nodeStyle: "bg-amber-500 text-white shadow-md shadow-amber-500/20",
    },
    delivered: {
        label: "Delivered",
        badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
        nodeStyle: "bg-emerald-500 text-white shadow-md shadow-emerald-500/20",
    },
    cancelled: {
        label: "Cancelled",
        badgeStyle: "bg-slate-100 text-slate-600 border-slate-200",
        nodeStyle: "bg-slate-500 text-white shadow-md shadow-slate-500/20",
    },
}

const statusIcons = {
    placed: <ArrowUp className="size-4 text-white" />,
    in_transit: <Truck className="size-4 text-white" />,
    out_for_delivery: <SquareArrowOutUpRight className="size-4 text-white" />,
    delivered: <PackageCheck className="size-4 text-white" />,
    cancelled: <PackageX className="size-4 text-white" />,
}

export default function ShipmentCard({ shipment }: { shipment: Shipment }) {
    const timeline = shipment.timeline || [];
    const latestEvent = timeline.length > 0 ? timeline[timeline.length - 1] : null;
    const latestStatus = (latestEvent?.status || "placed") as keyof typeof statusBadges;
    const badgeInfo = statusBadges[latestStatus] || statusBadges.placed;

    return (
        <div className="card-elevated-white flex flex-col justify-between p-6 bg-white rounded-3xl border border-[#FF6B4A]/15 shadow-md shadow-[#FF6B4A]/5 hover:shadow-xl hover:shadow-[#FF6B4A]/12 hover:-translate-y-1 transition-all duration-300">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#FF6B4A]/10">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FFEFE8] text-[#FF6B4A] border border-[#FF6B4A]/20">
                            <Package2 className="size-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Shipment ID</span>
                            <h3 className="font-extrabold text-slate-800 text-sm font-mono tracking-tight">#{shipment.id ? shipment.id.slice(-8) : "N/A"}</h3>
                        </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-extrabold rounded-full border ${badgeInfo.badgeStyle}`}>
                        {badgeInfo.label}
                    </span>
                </div>

                {/* Main Package Info */}
                <div className="mb-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex flex-col gap-2 text-xs">
                    <div className="w-full">
                        <span className="text-slate-400 font-bold uppercase block text-[10px] tracking-wider mb-0.5">Contents</span>
                        <span className="font-extrabold text-slate-800 break-all block leading-snug">{shipment.content || "Parcel"}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <div>
                            <span className="text-slate-400 font-bold uppercase text-[10px] mr-1.5">Weight:</span>
                            <span className="font-extrabold text-[#FF6B4A]">{shipment.weight ? `${shipment.weight} kg` : "N/A"}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 font-bold uppercase text-[10px] mr-1.5">Pincode:</span>
                            <span className="font-extrabold text-slate-700">{shipment.destination ?? "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Timeline Events */}
                <div className="relative pl-6 space-y-4 my-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#FF6B4A]/20">
                    {latestEvent && <TimelineEvent event={latestEvent} nodeStyle={badgeInfo.nodeStyle} isLatest={true} />}
                    {
                        timeline.length > 1 && timeline[timeline.length - 2] &&
                        <TimelineEvent
                            event={timeline[timeline.length - 2]}
                            nodeStyle="bg-slate-300 text-slate-600"
                            isLatest={false}
                        />
                    }
                </div>
            </div>

            {/* Footer View Details Button */}
            <div className="pt-4 border-t border-[#FF6B4A]/10 mt-2">
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="btn-coral-gradient flex w-full items-center justify-center gap-2 rounded-xl h-11 px-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-[#FF6B4A]/25 transition-all hover:scale-[1.01]">
                            View Details <ChevronRight className="size-4" />
                        </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[640px] rounded-3xl p-6 border-[#FF6B4A]/20 bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                                📦 Shipment #{shipment.id}
                            </DialogTitle>
                            <DialogDescription asChild>
                                <div className="mt-4">
                                    <ShipmentView shipment={shipment} />
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

function TimelineEvent({ event, nodeStyle, isLatest }: { event: ShipmentEvent, nodeStyle: string, isLatest: boolean }) {
    if (!event) return null;
    const timeStr = event.created_at && event.created_at.includes("T") ? event.created_at.split("T")[1].slice(0, 5) : "--:--";
    const icon = statusIcons[event.status as keyof typeof statusIcons] || statusIcons.placed;

    return (
        <div className="relative flex items-center justify-between text-xs gap-3">
            <div className={`absolute -left-[23px] flex size-5 items-center justify-center rounded-full ${nodeStyle}`}>
                {icon}
            </div>
            <div className="flex-1 truncate">
                <p className={`font-semibold truncate ${isLatest ? "text-slate-800 font-bold" : "text-slate-500"}`}>
                    {event.description || event.status?.replace(/_/g, " ")}
                </p>
                {event.location && <span className="text-[10px] text-slate-400">Pincode: {event.location}</span>}
            </div>
            <span className="text-[10px] font-mono text-slate-400 shrink-0 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                {timeStr}
            </span>
        </div>
    );
}