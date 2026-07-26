import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useContext, useState } from "react"
import { AuthContext, type UserType } from "~/contexts/AuthContext"
import { toast } from "sonner"
import api from "~/lib/api"
import { Eye, EyeOff, Truck } from "lucide-react"

export function LoginForm({
  className,
  user,
  ...props
}: { user: UserType } & React.ComponentProps<"div">) {

  const { login } = useContext(AuthContext)
  const [isSignup, setIsSignup] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const email = data.get("email")?.toString()
    const password = data.get("password")?.toString()

    if (!email || !password) {
      toast.error("Please enter email and password.")
      return
    }

    if (isSignup) {
      const name = data.get("name")?.toString()
      if (!name) {
        toast.error("Please enter your name.")
        return
      }

      try {
        if (user === "seller") {
          const address = data.get("address")?.toString() || ""
          const zip_code_str = data.get("zip_code")?.toString()
          const zip_code = zip_code_str ? parseInt(zip_code_str, 10) : undefined
          
          await api.seller.registerSeller({
            name,
            email,
            password,
            address: address || undefined,
            zip_code: zip_code || undefined,
          })
        } else {
          const zip_codes_str = data.get("serviceable_zip_codes")?.toString()
          const serviceable_zip_codes = zip_codes_str
            ? zip_codes_str.split(",").map(z => parseInt(z.trim(), 10)).filter(z => !isNaN(z))
            : []
          const capacity_str = data.get("max_handling_capacity")?.toString()
          const max_handling_capacity = capacity_str ? parseInt(capacity_str, 10) : 5

          await api.partner.registerDeliveryPartner({
            name,
            email,
            password,
            serviceable_zip_codes,
            max_handling_capacity,
          })
        }

        await login(user, email, password)
        toast.success("Signup successful! Welcome to FastShip.")
      } catch (error: any) {
        console.error("Signup error:", error)
        const detail = error?.response?.data?.detail
        if (detail) {
          let errorMsg = "Signup failed. Please check the entered data."
          if (typeof detail === "string") {
            errorMsg = detail
          } else if (Array.isArray(detail)) {
            errorMsg = detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ")
          }
          toast.error(errorMsg)
        }
      }
    } else {
      await login(user, email, password)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl rounded-2xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-10 flex flex-col justify-center" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                  <Truck className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {isSignup ? `Join FastShip as ${user === "seller" ? "Seller" : "Partner"}` : `Welcome Back`}
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  {isSignup ? `Create your ${user} account to get started` : `Login to your FastShip ${user} portal`}
                </p>
              </div>

              {isSignup && (
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    required
                    className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500 rounded-xl"
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="m@example.com"
                  required
                  className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500 rounded-xl"
                />
              </div>

              {isSignup && user === "seller" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="address" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      name="address"
                      placeholder="123 Commerce St"
                      className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500 rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="zip_code" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Zip Code</Label>
                    <Input
                      id="zip_code"
                      type="number"
                      name="zip_code"
                      placeholder="110001"
                      className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500 rounded-xl"
                    />
                  </div>
                </>
              )}

              {isSignup && user === "partner" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="serviceable_zip_codes" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Serviceable Zip Codes (comma-separated)</Label>
                    <Input
                      id="serviceable_zip_codes"
                      type="text"
                      name="serviceable_zip_codes"
                      placeholder="110001, 110002"
                      required
                      className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500 rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="max_handling_capacity" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Max Handling Capacity</Label>
                    <Input
                      id="max_handling_capacity"
                      type="number"
                      name="max_handling_capacity"
                      defaultValue="5"
                      required
                      className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500 rounded-xl"
                    />
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Password</Label>
                  {!isSignup && (
                    <a
                      href={`/${user}/forgot-password`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    className="pr-10 bg-slate-950/60 border-slate-800 text-white focus:border-indigo-500 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer flex items-center justify-center"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 border-0 transition-all mt-2">
                {isSignup ? "Create Account →" : "Sign In →"}
              </Button>

              <div className="text-center text-xs text-slate-400 mt-2">
                {isSignup ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignup(false)}
                      className="font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                    >
                      Log in
                    </button>
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignup(true)}
                      className="font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                    >
                      Sign up now
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
          <div className="relative hidden md:flex bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-10 flex-col justify-between border-l border-slate-800">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
                FastShip E-Commerce Network
              </div>
              <h2 className="text-3xl font-extrabold text-white leading-snug">
                Powering Fast & Secure Deliveries Nationwide
              </h2>
              <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                Connect sellers, delivery partners, and customers with automated OTP doorstep verification and real-time parcel tracking.
              </p>
            </div>
            <div className="relative z-10 pt-8 border-t border-slate-800/80">
              <div className="flex items-center gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span> Live System</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></span> OTP Secured</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-slate-500 text-center text-xs">
        By clicking continue, you agree to FastShip&apos;s <a href="#" className="underline hover:text-slate-400">Terms of Service</a> and <a href="#" className="underline hover:text-slate-400">Privacy Policy</a>.
      </div>
    </div>
  )
}
