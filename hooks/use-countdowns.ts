"use client"

import { useState, useEffect, useCallback } from "react"

export interface Countdown {
  id: string
  emoji: string
  name: string
  startDate: string      // ISO string — when the countdown was created
  endDate: string        // ISO string — target date
  workingDaysOnly: boolean
}

const STORAGE_KEY = "countdowns-v1"

const DEFAULTS: Countdown[] = [
  {
    id: "default-1",
    emoji: "🏖️",
    name: "Summer vacation",
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    workingDaysOnly: false,
  },
  {
    id: "default-2",
    emoji: "🎂",
    name: "My birthday",
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    workingDaysOnly: false,
  },
]

export function useCountdowns() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setCountdowns(JSON.parse(stored))
      } else {
        setCountdowns(DEFAULTS)
      }
    } catch {
      setCountdowns(DEFAULTS)
    }
    setHydrated(true)
  }, [])

  const persist = useCallback((next: Countdown[]) => {
    setCountdowns(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore storage errors
    }
  }, [])

  const addCountdown = useCallback(
    (data: Omit<Countdown, "id" | "startDate">) => {
      const item: Countdown = {
        ...data,
        id: crypto.randomUUID(),
        startDate: new Date().toISOString(),
        workingDaysOnly: data.workingDaysOnly ?? false,
      }
      persist([item, ...countdowns])
    },
    [countdowns, persist]
  )

  const updateCountdown = useCallback(
    (id: string, data: Partial<Omit<Countdown, "id">>) => {
      persist(countdowns.map((c) => (c.id === id ? { ...c, ...data } : c)))
    },
    [countdowns, persist]
  )

  const deleteCountdown = useCallback(
    (id: string) => {
      persist(countdowns.filter((c) => c.id !== id))
    },
    [countdowns, persist]
  )

  return { countdowns, hydrated, addCountdown, updateCountdown, deleteCountdown }
}

/** Returns days remaining (can be negative if past) */
export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate)
  const now = new Date()
  // Normalize to midnight
  end.setHours(0, 0, 0, 0)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = end.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/** Returns progress 0–100 (% of time elapsed from start → end) */
export function getProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const now = Date.now()
  if (end <= start) return 100
  const progress = ((now - start) / (end - start)) * 100
  return Math.min(100, Math.max(0, progress))
}

/** Formats a date as YYYY-MM-DD for <input type="date"> */
export function toInputDate(iso: string): string {
  return iso.slice(0, 10)
}

/**
 * Counts working days (Mon–Fri) between two dates, inclusive of start,
 * exclusive of end. Returns a negative count if end is before start.
 */
function countWorkingDays(from: Date, to: Date): number {
  const sign = to >= from ? 1 : -1
  let cursor = new Date(sign === 1 ? from : to)
  const stop = new Date(sign === 1 ? to : from)
  cursor.setHours(0, 0, 0, 0)
  stop.setHours(0, 0, 0, 0)
  let count = 0
  while (cursor < stop) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return sign * count
}

/** Returns working days remaining (Mon–Fri only). Can be negative if past. */
export function getWorkingDaysRemaining(endDate: string): number {
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return countWorkingDays(today, end)
}

/**
 * Returns progress 0–100 based on working days elapsed from start → end.
 */
export function getWorkingDayProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const total = countWorkingDays(start, end)
  if (total <= 0) return 100
  const elapsed = countWorkingDays(start, today)
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}
