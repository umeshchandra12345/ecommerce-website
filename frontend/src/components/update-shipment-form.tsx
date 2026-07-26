
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
import { cn, getLatestStatus } from "~/lib/utils"
import { Button } from "./ui/button"
import { SubmitButton } from "./ui/submit-button"
import { QrReader } from 'react-qr-reader'


const statusValues = [
    ShipmentStatus.InTransit,
    ShipmentStatus.OutForDelivery,
    ShipmentStatus.Delivered,
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
        <div className={cn("flex flex-col gap-6 p-8 max-w-[640px]", className)} {...props}>
            <form action={updateShipment}>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-xl font-bold">Update shipment</h1>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="flex w-full items-center space-x-2">
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
                                    // Wait for the paste value to be applied
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
                                placeholder="Shipment Id (e.g. 41eabcaf-...)"
                            />
                            <Button variant="outline" type="button" onClick={() => {
                                if (idInput.trim()) {
                                    onScan(idInput.trim())
                                }
                            }}>
                                Search
                            </Button>
                            <QRScanner onScan={(scannedId) => {
                                setIdInput(scannedId)
                                onScan(scannedId)
                            }}/>
                        </div>
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select name="status" value={status} onValueChange={(value: string) => {
                                setStatus(value as ShipmentStatus)
                            }}>
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={shipment ? getLatestStatus(shipment) : "Shipment Status"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusValues.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {
                            status === "delivered" && <div className="grid gap-2">
                                <Label htmlFor="verification-code">Verification Code (6-digit OTP)</Label>
                                <InputOTP maxLength={6} value={otp} onChange={(val) => setOtp(val)}>
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                                <input type="hidden" name="verification-code" value={otp} />
                            </div>
                        }
                        <div className="grid gap-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                name="location"
                                type="number"
                                placeholder={
                                    latestEvent?.location
                                        ? latestEvent.location.toString()
                                        : "Location"
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                name="description"
                                type="text"
                                placeholder={
                                    latestEvent?.description
                                        ? latestEvent.description
                                        : "scanned at ..."
                                }
                            />
                        </div>
                        <SubmitButton text="Update" />
                    </div>
                </div>
            </form>
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

