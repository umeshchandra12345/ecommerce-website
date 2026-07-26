import { LoginForm } from "~/components/login-form"

export default function DeliveryPartnerLoginPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 md:p-10 overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm md:max-w-4xl">
        <LoginForm user="partner" />
      </div>
    </div>
  )
}
