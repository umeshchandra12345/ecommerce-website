import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import api from "~/lib/api";

type UserType = "seller" | "partner"

interface AuthContextType {
  token?: string | null
  user?: UserType
  login: (user_type: UserType, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
    login: async () => {},
    logout: () => {},
})

function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null | undefined>(() => {
        if (typeof window !== 'undefined') {
            const t = sessionStorage.getItem("token")
            if (t) {
                api.setSecurityData(t)
                return t
            }
            return null
        }
        return undefined
    })
    const [user, setUser] = useState<UserType | undefined>(() => {
        if (typeof window !== 'undefined') {
            return (sessionStorage.getItem("user") as UserType) || undefined
        }
        return undefined
    })
    const navigate = useNavigate()

    useEffect(() => {
        const storedToken = sessionStorage.getItem("token")
        const storedUser = sessionStorage.getItem("user") as UserType
        if (storedToken) {
            setToken(storedToken)
            setUser(storedUser)
            api.setSecurityData(storedToken)
        } else {
            setToken(null)
        }

        const handleUnauthorized = () => {
            setToken(null)
            setUser(undefined)
            api.setSecurityData(null)
            sessionStorage.removeItem("token")
            sessionStorage.removeItem("user")
            navigate("/seller/login")
        }

        window.addEventListener("auth:unauthorized", handleUnauthorized)
        return () => {
            window.removeEventListener("auth:unauthorized", handleUnauthorized)
        }
    }, [navigate])

    async function login(user_type: UserType, email: string, password: string) {
        try {
            const loginUser = user_type === "seller" ? api.seller.loginSeller : api.partner.loginDeliveryPartner

            const { data } = await loginUser({username: email, password})
            
            if (data?.access_token) {
                setToken(data.access_token)
                setUser(user_type)

                api.setSecurityData(data.access_token)
    
                sessionStorage.setItem("token", data.access_token)
                sessionStorage.setItem("user", user_type)
    
                navigate("/dashboard")
            }
        } catch (error) {
            toast.error("Login failed. Please check your credentials.")
        }
    }

    function logout() {
        api.seller.logoutSeller()

        setToken(null)
        setUser(undefined)

        api.setSecurityData(null)

        sessionStorage.removeItem("token")
        sessionStorage.removeItem("user")
    }

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {token === undefined ? <div>Loading...</div> : children}
        </AuthContext.Provider>
    )
}

export { AuthProvider, AuthContext, type AuthContextType, type UserType }