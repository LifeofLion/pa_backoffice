import { createContext, useContext, useState, useEffect } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  userRole: "client" | "admin" | "shopkeeper" | "service_provider" | "delivery_man" | "guest"
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<"client" | "admin" | "shopkeeper" | "service_provider" | "delivery_man" | "guest">("guest")

  useEffect(() => {
    const stored = localStorage.getItem("userRole")
    if (stored === "client") {
      setIsAuthenticated(true)
      setUserRole("client")
    }
  }, [])

  const login = () => {
    setIsAuthenticated(true)
    setUserRole("client")
    localStorage.setItem("userRole", "client")
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUserRole("guest")
    localStorage.removeItem("userRole")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}