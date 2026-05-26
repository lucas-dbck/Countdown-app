"use client"

import { useEffect, useRef, useState } from "react"
import { X, Check } from "lucide-react"
import type { Countdown } from "@/hooks/use-countdowns"
import { toInputDate } from "@/hooks/use-countdowns"
import { cn } from "@/lib/utils"

const EMOJI_SUGGESTIONS = [
  "🏖️","🎂","🎉","🏃","✈️","🎓","💍","🏠","🎸","⚽",
  "🎄","🌍","🚀","📅","🔥","💼","🎯","🌸","🧳","🎁",
]

interface CountdownFormProps {
  open: boolean
  editing?: Countdown | null
  onClose: () => void
  onSave: (data: { emoji: string; name: string; endDate: string }) => void
}

export function CountdownForm({ open, editing, onClose, onSave }: CountdownFormProps) {
  const [emoji, setEmoji] = useState("🎉")
  const [name, setName] = useState("")
  const [endDate, setEndDate] = useState("")
  const [emojiInput, setEmojiInput] = useState("🎉")
  const nameRef = useRef<HTMLInputElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Populate form when editing
  useEffect(() => {
    if (editing) {
      setEmoji(editing.emoji)
      setEmojiInput(editing.emoji)
      setName(editing.name)
      setEndDate(toInputDate(editing.endDate))
    } else {
      setEmoji("🎉")
      setEmojiInput("🎉")
      setName("")
      setEndDate("")
    }
  }, [editing, open])

  // Auto-focus name field
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => nameRef.current?.focus(), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  const isValid = name.trim().length > 0 && endDate.length > 0

  const handleSave = () => {
    if (!isValid) return
    onSave({ emoji, name: name.trim(), endDate: new Date(endDate).toISOString() })
  }

  const handleEmojiInput = (val: string) => {
    setEmojiInput(val)
    // Take the first character if it looks like an emoji or letter
    const trimmed = [...val].slice(-1).join("")
    if (trimmed) setEmoji(trimmed)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  // Today as min date
  const today = new Date().toISOString().slice(0, 10)

  if (!open) return null

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
      aria-label={editing ? "Edit countdown" : "Add countdown"}
    >
      <div className="w-full max-w-lg bg-card rounded-t-3xl border border-border border-b-0 p-6 pb-10 animate-in slide-in-from-bottom-4 duration-300">
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" aria-hidden="true" />

        {/* Title row */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-foreground font-semibold text-lg">
            {editing ? "Edit countdown" : "New countdown"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Emoji + Name */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">Emoji</label>
              <input
                type="text"
                value={emojiInput}
                onChange={(e) => handleEmojiInput(e.target.value)}
                className="w-14 h-12 text-2xl text-center bg-surface border border-border rounded-xl outline-none focus:border-ring transition-colors"
                aria-label="Emoji"
                maxLength={4}
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label htmlFor="countdown-name" className="text-xs text-muted-foreground font-medium">
                Name
              </label>
              <input
                ref={nameRef}
                id="countdown-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Last day at Bain"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="h-12 px-4 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-ring transition-colors"
              />
            </div>
          </div>

          {/* Emoji quick picks */}
          <div className="flex flex-wrap gap-2">
            {EMOJI_SUGGESTIONS.map((e) => (
              <button
                key={e}
                onClick={() => { setEmoji(e); setEmojiInput(e) }}
                className={cn(
                  "w-9 h-9 text-xl rounded-xl border transition-colors",
                  emoji === e
                    ? "border-ring bg-surface-raised"
                    : "border-transparent bg-surface hover:bg-surface-raised"
                )}
                aria-label={`Use ${e} emoji`}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="countdown-date" className="text-xs text-muted-foreground font-medium">
              End date
            </label>
            <input
              id="countdown-date"
              type="date"
              value={endDate}
              min={today}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-12 px-4 bg-surface border border-border rounded-xl text-foreground text-sm outline-none focus:border-ring transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
              isValid
                ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
                : "bg-surface text-muted-foreground cursor-not-allowed"
            )}
          >
            <Check size={16} />
            {editing ? "Save changes" : "Add countdown"}
          </button>
        </div>
      </div>
    </div>
  )
}
