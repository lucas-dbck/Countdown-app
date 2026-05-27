"use client"

import { useState } from "react"
import { LogIn, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string) => Promise<void>
}

export function AuthForm({ onLogin, onRegister }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRegistering = mode === "register"
  const isValid = email.trim().length > 0 && password.length >= 6

  const handleSubmit = async () => {
    if (!isValid || busy) return

    setBusy(true)
    setError(null)
    try {
      if (isRegistering) {
        await onRegister(email.trim(), password)
      } else {
        await onLogin(email.trim(), password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <section className="w-full max-w-sm rounded-2xl bg-surface border border-border p-5">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="text-2xl leading-none select-none" aria-hidden="true">⏳</span>
          <h1 className="text-foreground font-bold text-lg tracking-tight">Countdown</h1>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1 mb-5">
          <button
            onClick={() => { setMode("login"); setError(null) }}
            className={cn(
              "h-9 rounded-lg text-sm font-semibold transition-colors",
              mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            Log in
          </button>
          <button
            onClick={() => { setMode("register"); setError(null) }}
            className={cn(
              "h-9 rounded-lg text-sm font-semibold transition-colors",
              mode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            Sign up
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-email" className="text-xs text-muted-foreground font-medium">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-12 px-4 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-ring transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-password" className="text-xs text-muted-foreground font-medium">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSubmit()
              }}
              autoComplete={isRegistering ? "new-password" : "current-password"}
              className="h-12 px-4 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-ring transition-colors"
            />
          </div>

          <button
            onClick={() => void handleSubmit()}
            disabled={!isValid || busy}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
              isValid && !busy
                ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
                : "bg-background text-muted-foreground cursor-not-allowed"
            )}
          >
            {isRegistering ? <UserPlus size={16} /> : <LogIn size={16} />}
            {busy ? "Please wait..." : isRegistering ? "Create account" : "Log in"}
          </button>

          {error && (
            <p className="text-sm text-destructive-foreground text-center">
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
