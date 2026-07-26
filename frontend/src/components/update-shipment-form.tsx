
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { ScanQrCode } from "lucide-react"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle
} from "~/components/ui/drawer"
import { Input } from "~/components/ui/input"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "~/components/ui/input-otp"
import { Label } from "~/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import api from "~/lib/api"
import { ShipmentStatus, type Shipment, type ShipmentUpdate } from "~/lib/client"
import { getLatestStatus } from "~/lib/utils"
import { Button } from "./ui/button"
import { QrReader } from 'react-qr-reader'


const statusValues = [
    ShipmentStatus.InTransit,
    ShipmentStatus.OutForDelivery,
    ShipmentStatus.Delivered,
]

const suggestionsByStatus: Record<string, string[]> = {
    in_transit: [
        "Arrived at sorting facility hub",
        "Scanned at warehouse & dispatched",
        "In transit to destination city",
        "Package processed at transit hub",
    ],
    out_for_delivery: [
        "Out for delivery with courier agent",
        "Arrived at local doorstep facility",
        "Agent en route to customer address",
    ],
    delivered: [
        "Handed over to customer with OTP verification",
        "Delivered safely at doorstep",
        "Received by authorized recipient",
    ],
    cancelled: [
        "Delivery cancelled per customer request",
        "Address unlocatable / incorrect pincode",
    ],
}
const defaultSuggestions = [
    "Arrived at sorting facility hub",
    "Out for delivery with courier agent",
    "Handed over to customer with OTP verification",
    "Scanned & processed at sorting facility",
]

export function UpdateShipmentForm({
    className,
    onScan,
    shipment,
    ...props
}: { shipment?: Shipment | null, onScan: (id: string) => void } & React.ComponentPropsWithoutRef<"div">) {

    const queryClient = useQueryClient()

    const [idInput, setIdInput] = useState(shipment?.id || "")
    const [status, setStatus] = useState<ShipmentStatus>()
    const [otp, setOtp] = useState("")
    const [description, setDescription] = useState("")

    useEffect(() => {
        if (shipment?.id) {
            setIdInput(shipment.id)
        }
    }, [shipment?.id])

    const shipments = useMutation({
        mutationFn: async ({
            id, update
        }: {
            id: string, update: ShipmentUpdate
        }) => api.shipment.updateShipment({ id }, update),
        onSuccess: () => {
            toast.success("Shipment updated successfully")
            if (shipment?.id) {
                queryClient.invalidateQueries({ queryKey: [shipment.id] })
            }
            queryClient.invalidateQueries({ queryKey: ["shipments"] })
        },
        onError: (error: any) => {
            console.error("Update shipment error:", error)
            if (error?.response?.status === 401) {
                toast.error("Session expired. Please log in again.")
                window.dispatchEvent(new CustomEvent("auth:unauthorized"))
                return
            }
            const detail = error?.response?.data?.detail
            let errorMsg = "Failed to update shipment"
            if (typeof detail === "string") {
                errorMsg = detail
            } else if (Array.isArray(detail)) {
                errorMsg = detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ")
            } else if (error?.message) {
                errorMsg = error.message
            }
            toast.error(errorMsg)
        }
    })

    const updateShipment = async (shipmentForm: FormData) => {
        const id = shipmentForm.get("id")?.toString()?.trim() || idInput.trim()
        const verificationCode = shipmentForm.get("verification-code")?.toString()?.trim()
        const location_str = shipmentForm.get("location")?.toString()?.trim()
        const description = shipmentForm.get("description")?.toString()?.trim()

        if (!id) {
            toast.warning("Please enter a Shipment ID")
            return
        }

        const location = location_str && !isNaN(parseInt(location_str, 10)) ? parseInt(location_str, 10) : undefined

        if (!status && location === undefined && !description) {
            toast.warning("Please select a status or provide location/description to update")
            return
        }

        if (status === ShipmentStatus.Delivered && !verificationCode) {
            toast.warning("Please enter the 6-digit OTP verification code")
            return
        }

        shipments.mutate({
            id: id,
            update: {
                status: status || undefined,
                location: location,
                description: description || undefined,
                verification_code: verificationCode || undefined,
            },
        })
    }

    const latestEvent = shipment?.timeline[shipment?.timeline.length - 1]

    return (
        <div className={`mx-auto w-full max-w-[680px] p-2 ${className || ''}`} {...props}>
            <div className="card-elevated-white overflow-hidden p-8 sm:p-10 border border-[#FF6B4A]/15 bg-white shadow-xl shadow-[#FF6B4A]/5">
                <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#FFEFE8] to-[#FFF5F2] p-6 border border-[#FF6B4A]/10">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#FF6B4A]/10 px-3 py-1 text-xs font-bold text-[#FF6B4A] uppercase tracking-wider mb-2">
                        🚚 Partner Execution
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Update Shipment Status</h1>
                    <p className="text-sm text-slate-500 mt-1">Scan or enter Shipment ID to record transit scans or confirm doorstep OTP delivery.</p>
                </div>

                <form action={updateShipment} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Shipment Search</Label>
                            <div className="flex w-full items-center gap-2">
                                <Input
                                    value={idInput}
                                    onChange={(e) => {
                                        setIdInput(e.target.value)
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            if (idInput.trim()) {
                                                onScan(idInput.trim())
                                            }
                                        }
                                    }}
                                    onPaste={(e) => {
                                        setTimeout(() => {
                                            const input = e.target as HTMLInputElement
                                            if (input.value.trim()) {
                                                onScan(input.value.trim())
                                            }
                                        }, 0)
                                    }}
                                    type="text"
                                    name="id"
                                    required
                                    placeholder="Paste or enter Shipment ID (UUID)..."
                                    className="h-12 flex-1 rounded-xl bg-slate-100/70 border-none px-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#FF6B4A]/40 transition-all"
                                />
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="h-12 px-5 rounded-xl border-[#FF6B4A]/20 bg-[#FFEFE8]/50 text-[#FF6B4A] font-bold hover:bg-[#FF6B4A] hover:text-white transition-all"
                                    onClick={() => {
                                        if (idInput.trim()) {
                                            onScan(idInput.trim())
                                        }
                                    }}
                                >
                                    Search
                                </Button>
                                <QRScanner onScan={(scannedId) => {
                                    setIdInput(scannedId)
                                    onScan(scannedId)
                                }}/>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">New Status</Label>
                            <Select name="status" value={status} onValueChange={(value: string) => {
                                setStatus(value as ShipmentStatus)
                            }}>
                                <SelectTrigger className="h-12 w-full rounded-xl bg-slate-100/70 border-none px-4 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#FF6B4A]/40 transition-all">
                                    <SelectValue
                                        placeholder={shipment ? getLatestStatus(shipment) : "Select Shipment Status"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-[#FF6B4A]/15 bg-white">
                                    {statusValues.map((status) => (
                                        <SelectItem key={status} value={status} className="rounded-lg focus:bg-[#FFEFE8] focus:text-[#FF6B4A]">
                                            {status.toUpperCase().replace(/_/g, " ")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {
                            status === "delivered" && (
                                <div className="grid gap-3 rounded-2xl bg-[#FFEFE8]/70 p-5 border border-[#FF6B4A]/20">
                                    <Label htmlFor="verification-code" className="text-xs font-bold uppercase tracking-wider text-[#FF6B4A]">
                                        🔑 Customer Doorstep OTP Code (Required for Delivered)
                                    </Label>
                                    <InputOTP maxLength={6} value={otp} onChange={(val) => setOtp(val)}>
                                        <InputOTPGroup className="gap-1">
                                            <InputOTPSlot index={0} className="h-12 w-12 rounded-xl bg-white border-[#FF6B4A]/30 text-lg font-bold text-slate-800" />
                                            <InputOTPSlot index={1} className="h-12 w-12 rounded-xl bg-white border-[#FF6B4A]/30 text-lg font-bold text-slate-800" />
                                            <InputOTPSlot index={2} className="h-12 w-12 rounded-xl bg-white border-[#FF6B4A]/30 text-lg font-bold text-slate-800" />
                                        </InputOTPGroup>
                                        <InputOTPSeparator className="text-[#FF6B4A]" />
                                        <InputOTPGroup className="gap-1">
                                            <InputOTPSlot index={3} className="h-12 w-12 rounded-xl bg-white border-[#FF6B4A]/30 text-lg font-bold text-slate-800" />
                                            <InputOTPSlot index={4} className="h-12 w-12 rounded-xl bg-white border-[#FF6B4A]/30 text-lg font-bold text-slate-800" />
                                            <InputOTPSlot index={5} className="h-12 w-12 rounded-xl bg-white border-[#FF6B4A]/30 text-lg font-bold text-slate-800" />
                                        </InputOTPGroup>
                                    </InputOTP>
                                    <input type="hidden" name="verification-code" value={otp} />
                                </div>
                            )
                        }

                        <div className="grid gap-2">
                            <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-slate-500">Scan Location Pincode</Label>
                            <Input
                                id="location"
                                name="location"
                                type="number"
                                placeholder={
                                    latestEvent?.location
                                        ? latestEvent.location.toString()
                                        : "e.g. 110001"
                                }
                                className="h-12 rounded-xl bg-slate-100/70 border-none px-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#FF6B4A]/40 transition-all"
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500">Scan Remarks / Note</Label>
                                <span className="text-[10px] font-bold text-[#FF6B4A]">Click chip to auto-fill</span>
                            </div>
                            <Input
                                id="description"
                                name="description"
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={
                                    latestEvent?.description
                                        ? latestEvent.description
                                        : "e.g. Processed at sorting facility..."
                                }
                                className="h-12 rounded-xl bg-slate-100/70 border-none px-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#FF6B4A]/40 transition-all"
                            />

                            {/* Quick Suggestion Chips */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {(status && suggestionsByStatus[status] ? suggestionsByStatus[status] : defaultSuggestions).map((item, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setDescription(item)}
                                        className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-all cursor-pointer ${
                                            description === item
                                                ? "bg-[#FF6B4A] text-white border-[#FF6B4A] shadow-xs font-bold"
                                                : "bg-[#FFEFE8]/70 text-slate-700 border-[#FF6B4A]/20 hover:bg-[#FF6B4A] hover:text-white"
                                        }`}
                                    >
                                        + {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-coral-gradient mt-4 h-12 w-full rounded-xl font-bold uppercase tracking-wider text-white transition-all hover:scale-[1.01]"
                        >
                            UPDATE SHIPMENT →
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
function QRScanner({ onScan }: { onScan: (id: string) => void }) {
    const [open, setOpen] = useState(false)

    return <Drawer open={open} onDrag={() => setOpen(false)}>
    
    <Button variant="outline" onClick={() => setOpen(true)}>
        <ScanQrCode />
    </Button>

    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Scan Shipment Label</DrawerTitle>
      </DrawerHeader>
      {
        open && <>
            <video id="qr-scan-video"></video>
            <QrReader
                videoId="qr-scan-video"
                onResult={(result, _error) => {
                    if (result) {
                        onScan(result.getText())
                        setOpen(false)
                    }
                }}
                constraints={{ facingMode: "environment" }}
            />
        </>
      }
    </DrawerContent>
  </Drawer>
  
}

