"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import type { Countdown } from "@/hooks/use-countdowns"
import {
  getDaysRemaining,
  getProgress,
  getWorkingDaysRemaining,
  getWorkingDayProgress,
} from "@/hooks/use-countdowns"
import { cn } from "@/lib/utils"

interface CountdownCardProps {
  countdown: Countdown
  onEdit: (countdown: Countdown) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<Omit<Countdown, "id">>) => void
}

export function CountdownCard({ countdown, onEdit, onDelete, onUpdate }: CountdownCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const workingOnly = countdown.workingDaysOnly ?? false
  const days = workingOnly
    ? getWorkingDaysRemaining(countdown.endDate)
    : getDaysRemaining(countdown.endDate)
  const progress = workingOnly
    ? getWorkingDayProgress(countdown.startDate, countdown.endDate)
    : getProgress(countdown.startDate, countdown.endDate)

  const isPast = days < 0
  const isToday = days === 0
  const isSoon = days > 0 && days <= 7
  const dayLabel = workingOnly ? (days === 1 ? "working day left" : "working days left") : days === 1 ? "day left" : "days left"

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(countdown.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const endFormatted = new Date(countdown.endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <article className="group relative rounded-2xl bg-surface border border-border p-5 flex flex-col gap-4 active:scale-[0.99] transition-transform duration-150">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl leading-none select-none" aria-hidden="true">
            {countdown.emoji}
          </span>
          <div className="min-w-0">
            <h2 className="text-foreground font-semibold text-base leading-tight truncate">
              {countdown.name}
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5">{endFormatted}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(countdown)}
            aria-label={`Edit ${countdown.name}`}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={handleDeleteClick}
            aria-label={confirmDelete ? "Tap again to confirm delete" : `Delete ${countdown.name}`}
            className={cn(
              "p-2 rounded-xl transition-colors",
              confirmDelete
                ? "text-destructive-foreground bg-destructive/20 hover:bg-destructive/40"
                : "text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/20"
            )}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Big number */}
      <div className="flex items-end gap-2">
        <span
          className={cn(
            "font-bold tabular-nums leading-none",
            isPast
              ? "text-muted-foreground text-6xl"
              : isToday
              ? "text-primary text-7xl"
              : isSoon
              ? "text-primary text-7xl"
              : "text-foreground text-7xl"
          )}
        >
          {isPast ? "0" : days}
        </span>
        <span className="text-muted-foreground text-sm pb-2 leading-tight">
          {isPast ? "days ago" : isToday ? "today!" : dayLabel}
        </span>
      </div>

      {/* Working-days toggle */}
      <div className="flex items-center gap-2">
        <button
          role="switch"
          aria-checked={workingOnly}
          aria-label="Toggle working days only"
          onClick={() => onUpdate(countdown.id, { workingDaysOnly: !workingOnly })}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            workingOnly ? "bg-primary" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
              workingOnly ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
        <span className="text-xs text-muted-foreground select-none">Working days only</span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--progress-track)" }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${Math.round(progress)}% of time elapsed`}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: isPast
                ? "var(--muted-foreground)"
                : "var(--progress-fill)",
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Start</span>
          <span>{Math.round(progress)}% elapsed</span>
        </div>
      </div>

      {/* "Tap again" hint */}
      {confirmDelete && (
        <p className="text-[11px] text-destructive-foreground text-center animate-in fade-in slide-in-from-bottom-1 duration-200">
          Tap delete again to confirm
        </p>
      )}
    </article>
  )
}
