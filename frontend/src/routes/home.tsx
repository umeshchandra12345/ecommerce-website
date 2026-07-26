import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Truck, ShieldCheck, MapPin, ArrowRight, Store, Bike, PackageCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden font-sans">
      {/* Dynamic Ambient Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-800/60 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-200">
            FastShip
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild className="text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl">
            <Link to="/seller/login">Seller Login</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 border-0">
            <Link to="/partner/login">Partner Portal</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 py-16 text-center flex-1 flex flex-col items-center justify-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-in">
          <PackageCheck className="w-4 h-4 text-indigo-400" />
          <span>Next-Gen Doorstep Courier & Logistics Platform</span>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">FastShip</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl font-normal leading-relaxed">
          Start your journey with us right now! Seamless seller shipment management, real-time live package tracking, and doorstep 6-digit OTP delivery verification.
        </p>

        {/* Login Role Selection Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl text-left">
          {/* Seller Card */}
          <div className="group relative p-8 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Seller Portal</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Create & dispatch orders, generate instant shipping labels, track shipment status, and manage client orders.
              </p>
            </div>
            <Button asChild className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-between px-5">
              <Link to="/seller/login">
                <span>Seller Login / Signup</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Delivery Partner Card */}
          <div className="group relative p-8 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <Bike className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Delivery Partner Portal</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Accept assigned deliveries in your zip code area, update package status, and verify doorstep 6-digit OTP codes.
              </p>
            </div>
            <Button asChild className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-between px-5">
              <Link to="/partner/login">
                <span>Delivery Partner Login / Signup</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left border-t border-slate-800/60 pt-12">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Secure Doorstep OTP</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Mandatory 6-digit OTP verification at customer's doorstep before handing over packages.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Live Parcel Stepper</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Visual status progress bar from Placed to In Transit, Out For Delivery, and Delivered.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Smart Auto-Assignment</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Instant routing to delivery partners based on serviceable zip codes and capacity.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
        <p>&copy; 2026 FastShip Logistics & Courier Systems. All rights reserved.</p>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
          <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-slate-400 cursor-pointer">Support</span>
        </div>
      </footer>
    </div>
  );
}
