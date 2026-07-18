import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useContext, useState } from "react"
import { AuthContext, type UserType } from "~/contexts/AuthContext"
import { toast } from "sonner"
import api from "~/lib/api"

export function LoginForm({
  className,
  user,
  ...props
}: { user: UserType } & React.ComponentProps<"div">) {

  const { login } = useContext(AuthContext)
  const [isSignup, setIsSignup] = useState(false)

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

        toast.success("Signup successful! Logging you in...")
        await login(user, email, password)
      } catch (error: any) {
        console.error("Signup error:", error)
        toast.error(error?.response?.data?.detail || "Signup failed. Please check the entered data.")
      }
    } else {
      await login(user, email, password)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">{isSignup ? "Create an account" : "Welcome back"}</h1>
                <p className="text-muted-foreground text-balance">
                  {isSignup ? `Register as a new FastShip ${user}` : `Login to your FastShip ${user} account`}
                </p>
              </div>

              {isSignup && (
                <div className="grid gap-3">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    required
                  />
                </div>
              )}

              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="m@example.com"
                  required
                />
              </div>

              {isSignup && user === "seller" && (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      name="address"
                      placeholder="123 Street Address"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="zip_code">Zip Code</Label>
                    <Input
                      id="zip_code"
                      type="number"
                      name="zip_code"
                      placeholder="110001"
                    />
                  </div>
                </>
              )}

              {isSignup && user === "partner" && (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="serviceable_zip_codes">Serviceable Zip Codes (comma-separated)</Label>
                    <Input
                      id="serviceable_zip_codes"
                      type="text"
                      name="serviceable_zip_codes"
                      placeholder="110001, 110002"
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="max_handling_capacity">Max Handling Capacity</Label>
                    <Input
                      id="max_handling_capacity"
                      type="number"
                      name="max_handling_capacity"
                      defaultValue="5"
                      required
                    />
                  </div>
                </>
              )}

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {!isSignup && (
                    <a
                      href={`/${user}/forgot-password`}
                      className="ml-auto text-sm underline-offset-2 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  )}
                </div>
                <Input id="password" type="password" name="password" required />
              </div>

              <Button type="submit" className="w-full">
                {isSignup ? "Sign up" : "Login"}
              </Button>

              <div className="text-center text-sm">
                {isSignup ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignup(false)}
                      className="underline underline-offset-4 font-semibold text-primary"
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
                      className="underline underline-offset-4 font-semibold text-primary"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/rider.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
