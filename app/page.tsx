"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useCountdowns, type Countdown } from "@/hooks/use-countdowns"
import { CountdownCard } from "@/components/countdown-card"
import { CountdownForm } from "@/components/countdown-form"
import { EmptyState } from "@/components/empty-state"

export default function Home() {
  const { countdowns, hydrated, addCountdown, updateCountdown, deleteCountdown } = useCountdowns()
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

  const handleSave = (data: { emoji: string; name: string; endDate: string }) => {
    if (editing) {
      updateCountdown(editing.id, data)
    } else {
      addCountdown(data)
    }
    handleClose()
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none select-none" aria-hidden="true">⏳</span>
            <h1 className="text-foreground font-bold text-lg tracking-tight">Countdown</h1>
          </div>
          <button
            onClick={openAdd}
            aria-label="Add new countdown"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus size={15} />
            <span>New</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {!hydrated ? (
          /* Skeleton loaders */
          <div className="space-y-3" aria-label="Loading countdowns">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-surface border border-border h-44 animate-pulse"
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

        {/* Bottom padding */}
        <div className="h-8" aria-hidden="true" />
      </div>

      {/* Form sheet */}
      <CountdownForm
        open={formOpen}
        editing={editing}
        onClose={handleClose}
        onSave={handleSave}
      />
    </main>
  )
}
