"use client"

import { useEffect, useRef, useState } from "react"
import { X, Check } from "lucide-react"
import type { Countdown } from "@/hooks/use-countdowns"
import { toInputDate } from "@/hooks/use-countdowns"
import { cn } from "@/lib/utils"

const EMOJI_SUGGESTIONS = [
  "\u{1F3D6}\u{FE0F}", "\u{1F382}", "\u{1F389}", "\u{1F3C3}", "\u{2708}\u{FE0F}",
  "\u{1F393}", "\u{1F48D}", "\u{1F3E0}", "\u{1F3B8}", "\u{26BD}",
  "\u{1F384}", "\u{1F30D}", "\u{1F680}", "\u{1F4C5}", "\u{1F525}",
  "\u{1F4BC}", "\u{1F3AF}", "\u{1F338}", "\u{1F9F3}", "\u{1F381}",
]

interface CountdownFormProps {
  open: boolean
  editing?: Countdown | null
  onClose: () => void
  onSave: (data: { emoji: string; name: string; end_date: string }) => void | Promise<void>
}

export function CountdownForm({ open, editing, onClose, onSave }: CountdownFormProps) {
  const [emoji, setEmoji] = useState("\u{1F389}")
  const [name, setName] = useState("")
  const [endDate, setEndDate] = useState("")
  const [emojiInput, setEmojiInput] = useState("\u{1F389}")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editing) {
      setEmoji(editing.emoji)
      setEmojiInput(editing.emoji)
      setName(editing.name)
      setEndDate(toInputDate(editing.end_date))
    } else {
      setEmoji("\u{1F389}")
      setEmojiInput("\u{1F389}")
      setName("")
      setEndDate("")
    }
    setSaving(false)
    setError(null)
  }, [editing, open])

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => nameRef.current?.focus(), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  const isValid = name.trim().length > 0 && endDate.length > 0

  const handleSave = async () => {
    if (!isValid || saving) return

    setSaving(true)
    setError(null)
    try {
      await onSave({ emoji, name: name.trim(), end_date: new Date(endDate).toISOString() })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save countdown")
    } finally {
      setSaving(false)
    }
  }

  const handleEmojiInput = (val: string) => {
    setEmojiInput(val)
    const trimmed = [...val].slice(-1).join("")
    if (trimmed) setEmoji(trimmed)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

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
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" aria-hidden="true" />

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
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSave()
                }}
                className="h-12 px-4 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-ring transition-colors"
              />
            </div>
          </div>

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

          <button
            onClick={() => void handleSave()}
            disabled={!isValid || saving}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
              isValid && !saving
                ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
                : "bg-surface text-muted-foreground cursor-not-allowed"
            )}
          >
            <Check size={16} />
            {saving ? "Saving..." : editing ? "Save changes" : "Add countdown"}
          </button>

          {error && (
            <p className="text-sm text-destructive-foreground text-center">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
