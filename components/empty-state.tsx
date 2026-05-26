"use client"

import { Plus } from "lucide-react"

interface EmptyStateProps {
  onAdd: () => void
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-8 gap-5">
      <div className="text-6xl select-none" aria-hidden="true">⏳</div>
      <div className="space-y-1.5">
        <h2 className="text-foreground font-semibold text-lg">No countdowns yet</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
          Add your first countdown to start tracking the moments that matter most.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <Plus size={16} />
        Add countdown
      </button>
    </div>
  )
}
