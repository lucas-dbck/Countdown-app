"use client"

import { useCallback, useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"

export interface User {
  id: number
  email: string
}

interface AuthResponse {
  user: User | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadUser() {
      try {
        const data = await apiRequest<AuthResponse>("/api/me")
        if (active) {
          setUser(data.user)
          setError(null)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not check login")
        }
      } finally {
        if (active) {
          setHydrated(true)
        }
      }
    }

    loadUser()

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<AuthResponse>("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    setUser(data.user)
    setError(null)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<AuthResponse>("/api/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    setUser(data.user)
    setError(null)
  }, [])

  const logout = useCallback(async () => {
    await apiRequest<void>("/api/logout", {
      method: "POST",
    })

    setUser(null)
    setError(null)
  }, [])

  return { user, hydrated, error, login, register, logout }
}
