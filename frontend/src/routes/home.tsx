import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Truck, ShieldCheck, MapPin, ArrowRight, Store, Bike, PackageCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#FFF5F2] text-slate-800 flex flex-col justify-between overflow-hidden font-sans">
      {/* Dynamic Ambient Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-[#FFEFE8] via-[#FFF5F2] to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#FF6B4A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FF8F73]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[#FF6B4A]/10 backdrop-blur-md bg-white/60 rounded-b-3xl shadow-sm">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B4A] to-[#FF8F73] flex items-center justify-center shadow-lg shadow-[#FF6B4A]/25 group-hover:scale-105 transition-transform text-white">
            <Truck className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-800">
            Fast<span className="text-[#FF6B4A]">Ship</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild className="text-slate-600 hover:text-[#FF6B4A] hover:bg-[#FFEFE8] rounded-xl font-bold">
            <Link to="/seller/login">Seller Login</Link>
          </Button>
          <Button asChild className="btn-coral-gradient text-white rounded-xl font-bold shadow-md shadow-[#FF6B4A]/20 border-0">
            <Link to="/partner/login">Partner Portal</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 py-16 text-center flex-1 flex flex-col items-center justify-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFEFE8] border border-[#FF6B4A]/20 text-[#FF6B4A] text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in shadow-xs">
          <PackageCheck className="w-4 h-4 text-[#FF6B4A]" />
          <span>Next-Gen Doorstep Courier & Logistics Platform</span>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight text-slate-900">
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF6B4A] via-[#FF8F73] to-[#FF5533]">FastShip</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
          Start your journey with us right now! Seamless seller shipment management, real-time live package tracking, and doorstep 6-digit OTP delivery verification.
        </p>

        {/* Login Role Selection Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl text-left">
          {/* Seller Card */}
          <div className="group relative p-8 rounded-3xl bg-white border border-[#FF6B4A]/15 shadow-xl shadow-[#FF6B4A]/5 hover:shadow-2xl hover:shadow-[#FF6B4A]/15 hover:border-[#FF6B4A]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFEFE8] border border-[#FF6B4A]/20 flex items-center justify-center text-[#FF6B4A] mb-5 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Seller Portal</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Create & dispatch orders, generate instant shipping labels, track shipment status, and manage client orders.
              </p>
            </div>
            <Button asChild className="btn-coral-gradient w-full h-12 text-white font-bold rounded-xl shadow-lg shadow-[#FF6B4A]/30 flex items-center justify-between px-5">
              <Link to="/seller/login">
                <span>Seller Login / Signup</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Delivery Partner Card */}
          <div className="group relative p-8 rounded-3xl bg-white border border-[#FF6B4A]/15 shadow-xl shadow-[#FF6B4A]/5 hover:shadow-2xl hover:shadow-[#FF6B4A]/15 hover:border-[#FF6B4A]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFEFE8] border border-[#FF6B4A]/20 flex items-center justify-center text-[#FF6B4A] mb-5 group-hover:scale-110 transition-transform">
                <Bike className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Delivery Partner Portal</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Accept assigned deliveries in your zip code area, update package status, and verify doorstep 6-digit OTP codes.
              </p>
            </div>
            <Button asChild className="btn-coral-gradient w-full h-12 text-white font-bold rounded-xl shadow-lg shadow-[#FF6B4A]/30 flex items-center justify-between px-5">
              <Link to="/partner/login">
                <span>Delivery Partner Login / Signup</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left border-t border-[#FF6B4A]/10 pt-12">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-[#FF6B4A]/10 shadow-xs">
            <div className="p-2.5 rounded-xl bg-[#FFEFE8] text-[#FF6B4A] border border-[#FF6B4A]/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Secure Doorstep OTP</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Mandatory 6-digit OTP verification at customer's doorstep before handing over packages.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-[#FF6B4A]/10 shadow-xs">
            <div className="p-2.5 rounded-xl bg-[#FFEFE8] text-[#FF6B4A] border border-[#FF6B4A]/20 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Live Parcel Stepper</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Visual status progress bar from Placed to In Transit, Out For Delivery, and Delivered.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-[#FF6B4A]/10 shadow-xs">
            <div className="p-2.5 rounded-xl bg-[#FFEFE8] text-[#FF6B4A] border border-[#FF6B4A]/20 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Smart Auto-Assignment</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Instant routing to delivery partners based on serviceable zip codes and capacity.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-[#FF6B4A]/10 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
        <p>&copy; 2026 FastShip Logistics & Courier Systems. All rights reserved.</p>
        <div className="flex items-center gap-6 mt-4 md:mt-0 font-medium">
          <span className="hover:text-[#FF6B4A] cursor-pointer transition-colors">Terms of Service</span>
          <span className="hover:text-[#FF6B4A] cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-[#FF6B4A] cursor-pointer transition-colors">Support</span>
        </div>
      </footer>
    </div>
  );
}
