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
          const zip_code_str = data.get("zip_code")?.toString()?.trim()
          const parsed_zip = zip_code_str ? parseInt(zip_code_str, 10) : NaN
          const zip_code = !isNaN(parsed_zip) ? parsed_zip : undefined
          
          await api.seller.registerSeller({
            name,
            email,
            password,
            address: address || undefined,
            zip_code: zip_code,
          })
        } else {
          const zip_codes_str = data.get("serviceable_zip_codes")?.toString()?.trim()
          const serviceable_zip_codes = zip_codes_str
            ? zip_codes_str.split(",").map(z => parseInt(z.trim(), 10)).filter(z => !isNaN(z))
            : []
          const capacity_str = data.get("max_handling_capacity")?.toString()?.trim()
          const parsed_cap = capacity_str ? parseInt(capacity_str, 10) : 5
          const max_handling_capacity = !isNaN(parsed_cap) ? parsed_cap : 5

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
        let errorMsg = "Signup failed. Please check your inputs."
        if (typeof detail === "string") {
          errorMsg = detail
        } else if (Array.isArray(detail)) {
          errorMsg = detail.map((d: any) => {
            const field = d.loc && Array.isArray(d.loc) ? d.loc.filter((l: any) => l !== 'body').join(' -> ') : ''
            return field ? `${field}: ${d.msg}` : d.msg || JSON.stringify(d)
          }).join("; ")
        } else if (error?.message) {
          errorMsg = error.message
        }
        toast.error(errorMsg)
      }
    } else {
      await login(user, email, password)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border border-orange-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl rounded-3xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-start text-left">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF6B4A]">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-[#FF6B4A]">FastShip</span>
                </div>
                <span className="text-slate-400 dark:text-slate-400 text-xs font-medium tracking-wide">Welcome back !!!</span>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  {isSignup ? `Join FastShip as ${user === "seller" ? "Seller" : "Partner"}` : `Sign in`}
                </h1>
              </div>

              {isSignup && (
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    required
                    className="bg-[#FFF5F2] dark:bg-slate-950/60 border-orange-100 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#FF6B4A] focus:ring-[#FF6B4A] rounded-xl h-11"
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="test@gmail.com"
                  required
                  className="bg-[#FFF5F2] dark:bg-slate-950/60 border-orange-100 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#FF6B4A] focus:ring-[#FF6B4A] rounded-xl h-11"
                />
              </div>

              {isSignup && user === "seller" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="address" className="text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      name="address"
                      placeholder="123 Commerce St"
                      className="bg-[#FFF5F2] dark:bg-slate-950/60 border-orange-100 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#FF6B4A] focus:ring-[#FF6B4A] rounded-xl h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="zip_code" className="text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">Zip Code</Label>
                    <Input
                      id="zip_code"
                      type="number"
                      name="zip_code"
                      placeholder="110001"
                      className="bg-[#FFF5F2] dark:bg-slate-950/60 border-orange-100 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#FF6B4A] focus:ring-[#FF6B4A] rounded-xl h-11"
                    />
                  </div>
                </>
              )}

              {isSignup && user === "partner" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="serviceable_zip_codes" className="text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">Serviceable Zip Codes (comma-separated)</Label>
                    <Input
                      id="serviceable_zip_codes"
                      type="text"
                      name="serviceable_zip_codes"
                      placeholder="110001, 110002"
                      required
                      className="bg-[#FFF5F2] dark:bg-slate-950/60 border-orange-100 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#FF6B4A] focus:ring-[#FF6B4A] rounded-xl h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="max_handling_capacity" className="text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">Max Handling Capacity</Label>
                    <Input
                      id="max_handling_capacity"
                      type="number"
                      name="max_handling_capacity"
                      defaultValue="5"
                      required
                      className="bg-[#FFF5F2] dark:bg-slate-950/60 border-orange-100 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#FF6B4A] focus:ring-[#FF6B4A] rounded-xl h-11"
                    />
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">Password</Label>
                  {!isSignup && (
                    <a
                      href={`/${user}/forgot-password`}
                      className="text-xs text-[#FF6B4A] hover:text-[#E05536] hover:underline font-medium"
                    >
                      Forgot Password ?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    className="pr-10 bg-[#FFF5F2] dark:bg-slate-950/60 border-orange-100 dark:border-slate-800 text-slate-900 dark:text-white focus:border-[#FF6B4A] focus:ring-[#FF6B4A] rounded-xl h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer flex items-center justify-center"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-[#FF6B4A] to-[#FF8C68] hover:from-[#E05536] hover:to-[#FF6B4A] text-white font-bold rounded-full shadow-lg shadow-orange-500/20 border-0 transition-all mt-2 uppercase tracking-wider text-xs">
                {isSignup ? "CREATE ACCOUNT →" : "SING IN →"}
              </Button>

              <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                {isSignup ? (
                  <>
                    Already have an account ?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignup(false)}
                      className="font-semibold text-[#FF6B4A] hover:underline"
                    >
                      Log in
                    </button>
                  </>
                ) : (
                  <>
                    I don&apos;t have an account ?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignup(true)}
                      className="font-semibold text-[#FF6B4A] hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>

          {/* Right Side Illustration Panel */}
          <div className="relative hidden md:flex bg-[#FFEFE8] dark:bg-slate-950 p-8 md:p-10 flex-col justify-center items-center overflow-hidden border-l border-orange-100 dark:border-slate-800">
            <div className="absolute inset-0 bg-[radial-gradient(#FF8C68_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-md">
              <img
                src="/login-illustration.png"
                alt="FastShip Delivery Illustration"
                className="w-full h-auto object-contain max-h-[420px] rounded-2xl drop-shadow-xl hover:scale-105 transition-transform duration-500"
              />
              <div className="mt-6 text-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fast & Secure Delivery Network</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-xs">
                  Automated partner allocation and doorstep OTP parcel verification.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-slate-400 text-center text-xs">
        By clicking continue, you agree to FastShip&apos;s <a href="#" className="underline hover:text-slate-600 dark:hover:text-slate-300">Terms of Service</a> and <a href="#" className="underline hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</a>.
      </div>
    </div>
  )
}
