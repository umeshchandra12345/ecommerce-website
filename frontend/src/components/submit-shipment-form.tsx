import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import api from "~/lib/api"
import type { ShipmentCreate } from "~/lib/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AxiosError } from "axios"

export function SubmitShipmentForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {

  const queryClient = useQueryClient()

  const shipments = useMutation({
    mutationFn: (data: ShipmentCreate) => api.shipment.submitShipment(data),
    onSuccess: (response) => {
      toast(`Shipment is submitted successfully (#${response.data.id})`)
      queryClient.invalidateQueries({ queryKey: ["shipments"] })
    },
    onError: (error) => {
      const apiError = error as AxiosError
      const detail = (apiError.response?.data as any)?.detail
      if (apiError.response?.status === 401) {
        toast.error("Session expired. Please log in again.")
        window.dispatchEvent(new CustomEvent("auth:unauthorized"))
      } else if (apiError.response?.status === 406) {
        toast.error("No delivery partners are available for this destination.")
      } else if (typeof detail === "string") {
        toast.error(detail)
      } else {
        toast.error("Failed to submit shipment. Please try again.")
      }
    }
  })

  async function submitShipment(data: FormData) {
    const content = data.get("content")?.toString()
    const weight = data.get("weight")?.toString()
    const destination = data.get("destination")?.toString()
    const clientContactEmail = data.get("client-contact-email")?.toString()

    if (!content || !weight || !destination || !clientContactEmail) {
      toast.error("Please fill in all required fields (Contents, Weight, Destination, Client Email).")
      return
    }

    const shipment = {
      content: content,
      weight: parseFloat(weight),
      destination: parseInt(destination),
      client_contact_email: clientContactEmail,
      client_contact_phone: data.get("client-contact-phone")?.toString(),
    }
    shipments.mutate(shipment)
  }

  return (
    <div className="mx-auto w-full max-w-[640px] p-2">
      <div className="card-elevated-white overflow-hidden p-8 sm:p-10 border border-[#FF6B4A]/15 bg-white shadow-xl shadow-[#FF6B4A]/5">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#FFEFE8] to-[#FFF5F2] p-6 border border-[#FF6B4A]/10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FF6B4A]/10 px-3 py-1 text-xs font-bold text-[#FF6B4A] uppercase tracking-wider mb-2">
            📦 Logistics Management
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Submit a new shipment</h1>
          <p className="text-sm text-slate-500 mt-1">Enter parcel details for automated courier allocation and customer tracking.</p>
        </div>

        <form {...props} action={submitShipment} className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="content" className="text-xs font-bold uppercase tracking-wider text-slate-500">Parcel Contents</Label>
            <Input
              id="content"
              name="content"
              type="text"
              placeholder="e.g. MacBook Pro, Electronics, Documents"
              className="h-12 rounded-xl bg-slate-100/70 border-none px-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#FF6B4A]/40 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="weight" className="text-xs font-bold uppercase tracking-wider text-slate-500">Weight (KG)</Label>
              <Input
                id="weight"
                name="weight"
                step={0.1}
                type="number"
                max={25}
                placeholder="e.g. 2.5"
                className="h-12 rounded-xl bg-slate-100/70 border-none px-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#FF6B4A]/40 transition-all"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="destination" className="text-xs font-bold uppercase tracking-wider text-slate-500">Destination Pincode</Label>
              <Input
                id="destination"
                name="destination"
                type="number"
                placeholder="e.g. 110001"
                className="h-12 rounded-xl bg-slate-100/70 border-none px-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#FF6B4A]/40 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="client-contact-email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Recipient Email</Label>
            <Input
              id="client-contact-email"
              name="client-contact-email"
              type="email"
              placeholder="customer@example.com"
              className="h-12 rounded-xl bg-slate-100/70 border-none px-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#FF6B4A]/40 transition-all"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="client-contact-phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">Recipient Phone (Optional)</Label>
            <Input
              id="client-contact-phone"
              name="client-contact-phone"
              type="phone"
              placeholder="+91 98765 43210"
              className="h-12 rounded-xl bg-slate-100/70 border-none px-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#FF6B4A]/40 transition-all"
            />
          </div>

          <button
            type="submit"
            className="btn-coral-gradient mt-4 h-12 w-full rounded-xl font-bold uppercase tracking-wider text-white transition-all hover:scale-[1.01]"
          >
            SUBMIT SHIPMENT →
          </button>
        </form>
      </div>
    </div>
  )
}
