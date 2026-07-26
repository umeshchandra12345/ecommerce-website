import { LoginForm } from "~/components/login-form"

export default function SellerLoginPage() {
  return (
    <div className="relative min-h-screen bg-[#FFF5F2] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden font-sans">
      {/* Background Soft Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-orange-300/20 via-orange-100/10 to-transparent blur-3xl pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm md:max-w-5xl">
        <LoginForm user="seller" />
      </div>
    </div>
  )
}
