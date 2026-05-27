"use client"

import { useState } from "react"
import { LogOut, Plus } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useCountdowns, type Countdown } from "@/hooks/use-countdowns"
import { AuthForm } from "@/components/auth-form"
import { CountdownCard } from "@/components/countdown-card"
import { CountdownForm } from "@/components/countdown-form"
import { EmptyState } from "@/components/empty-state"

export default function Home() {
  const auth = useAuth()
  const { countdowns, hydrated, error, addCountdown, updateCountdown, deleteCountdown } = useCountdowns(Boolean(auth.user))
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Countdown | null>(null)

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (countdown: Countdown) => {
    setEditing(countdown)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const handleSave = async (data: { emoji: string; name: string; end_date: string }) => {
    if (editing) {
      await updateCountdown(editing.id, data)
    } else {
      await addCountdown({ ...data, working_days_only: false })
    }
    handleClose()
  }

  const handleLogout = async () => {
    handleClose()
    await auth.logout()
  }

  if (!auth.hydrated) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="rounded-2xl bg-surface border border-border h-40 w-full max-w-sm animate-pulse" />
      </main>
    )
  }

  if (!auth.user) {
    return <AuthForm onLogin={auth.login} onRegister={auth.register} />
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl leading-none select-none" aria-hidden="true">⏳</span>
            <div className="min-w-0">
              <h1 className="text-foreground font-bold text-lg tracking-tight">Countdown</h1>
              <p className="text-muted-foreground text-xs truncate">{auth.user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors flex items-center justify-center"
            >
              <LogOut size={16} />
            </button>
            <button
              onClick={openAdd}
              aria-label="Add new countdown"
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus size={15} />
              <span>New</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {(auth.error || error) && (
          <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
            {auth.error || error}
          </p>
        )}

        {!hydrated ? (
          <div className="space-y-3" aria-label="Loading countdowns">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-surface border border-border h-36 animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : countdowns.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <div className="space-y-3">
            {countdowns.map((countdown) => (
              <CountdownCard
                key={countdown.id}
                countdown={countdown}
                onEdit={openEdit}
                onDelete={deleteCountdown}
                onUpdate={updateCountdown}
              />
            ))}
          </div>
        )}

        <div className="h-8" aria-hidden="true" />
      </div>

      <CountdownForm
        open={formOpen}
        editing={editing}
        onClose={handleClose}
        onSave={handleSave}
      />
    </main>
  )
}
