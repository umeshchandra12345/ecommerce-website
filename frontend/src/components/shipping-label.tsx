import React from "react"
import { Printer, Package, ShieldCheck, MapPin } from "lucide-react"
import { Button } from "./ui/button"
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import type { Shipment } from "~/lib/client"

export function ShippingLabelModal({ shipment }: { shipment: Shipment }) {
  const trackingUrl = `https://ecommerce-website-kappa-mauve.vercel.app/shipment/track?id=${shipment.id}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
    trackingUrl
  )}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <DialogContent className="sm:max-w-[560px] p-6">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>Shipping Label</span>
          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2 print:hidden">
            <Printer className="size-4" /> Print Label
          </Button>
        </DialogTitle>
      </DialogHeader>

      <div id="printable-label" className="border-2 border-black p-6 rounded-lg bg-white text-black font-sans space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <Package className="size-7 text-black" />
            <div>
              <h2 className="font-extrabold text-xl tracking-tight leading-none">FASTSHIP EXPRESS</h2>
              <p className="text-xs font-semibold text-gray-600">STANDARD AIR PARCEL</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-black text-white text-xs font-bold px-2 py-1 rounded">
              PRIORITY
            </span>
          </div>
        </div>

        {/* Addresses Grid */}
        <div className="grid grid-cols-2 gap-4 border-b-2 border-black pb-4 text-sm">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">FROM (SHIPPER):</p>
            <p className="font-bold">FastShip Verified Seller</p>
            <p className="text-xs text-gray-700">Origin Hub #{shipment.destination}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">SHIP TO (RECIPIENT):</p>
            <p className="font-bold">{shipment.client_contact_email}</p>
            <p className="text-xs text-gray-700">Phone: {shipment.client_contact_phone || "N/A"}</p>
            <div className="flex items-center gap-1 mt-1 font-bold text-base">
              <MapPin className="size-4 text-black shrink-0" />
              <span>ZIP: {shipment.destination}</span>
            </div>
          </div>
        </div>

        {/* Package Specs */}
        <div className="grid grid-cols-3 gap-2 border-b-2 border-black pb-3 text-center text-xs">
          <div className="border-r border-gray-300 pr-2">
            <span className="text-gray-500 block">WEIGHT</span>
            <span className="font-bold text-sm">{shipment.weight} KG</span>
          </div>
          <div className="border-r border-gray-300 pr-2">
            <span className="text-gray-500 block">CONTENTS</span>
            <span className="font-bold text-sm truncate block">{shipment.content}</span>
          </div>
          <div>
            <span className="text-gray-500 block">SERVICE</span>
            <span className="font-bold text-sm">EXPRESS</span>
          </div>
        </div>

        {/* Barcode & QR Section */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col items-start gap-1">
            <p className="text-[10px] font-mono font-bold uppercase text-gray-500">TRACKING NUMBER</p>
            <p className="font-mono font-extrabold text-sm tracking-wider">{shipment.id}</p>
            {/* Visual Simulated Barcode */}
            <div className="flex items-center h-10 gap-[2px] mt-1">
              {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 3, 4, 2, 1, 3, 2, 4, 1].map((width, idx) => (
                <div key={idx} className="bg-black h-full" style={{ width: `${width}px` }} />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <img src={qrCodeUrl} alt="Tracking QR Code" className="size-24 border border-gray-200 p-1 rounded" />
            <span className="text-[9px] font-bold text-gray-500 mt-1 flex items-center gap-0.5">
              <ShieldCheck className="size-3 text-green-600" /> SCAN TO TRACK
            </span>
          </div>
        </div>
      </div>
    </DialogContent>
  )
}
