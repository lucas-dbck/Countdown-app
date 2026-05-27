"use client"

import { useCallback, useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"

export interface Countdown {
  id: number
  emoji: string
  name: string
  end_date: string
  working_days_only: boolean
}

type CountdownInput = Omit<Countdown, "id">

export function useCountdowns(enabled: boolean) {
  const [countdowns, setCountdowns] = useState<Countdown[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    if (!enabled) {
      setCountdowns([])
      setHydrated(true)
      setError(null)
      return () => {
        active = false
      }
    }

    setHydrated(false)

    async function loadCountdowns() {
      try {
        const data = await apiRequest<Countdown[]>("/api/countdowns")
        if (active) {
          setCountdowns(data)
          setError(null)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load countdowns")
        }
      } finally {
        if (active) {
          setHydrated(true)
        }
      }
    }

    loadCountdowns()

    return () => {
      active = false
    }
  }, [enabled])

  const addCountdown = useCallback(async (data: CountdownInput) => {
    const item = await apiRequest<Countdown>("/api/countdowns", {
      method: "POST",
      body: JSON.stringify(data),
    })

    setCountdowns((current) => [item, ...current])
    setError(null)
  }, [])

  const updateCountdown = useCallback(async (id: number, data: Partial<CountdownInput>) => {
    const item = await apiRequest<Countdown>(`/api/countdowns/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })

    setCountdowns((current) => current.map((countdown) => (countdown.id === id ? item : countdown)))
    setError(null)
  }, [])

  const deleteCountdown = useCallback(async (id: number) => {
    await apiRequest<void>(`/api/countdowns/${id}`, {
      method: "DELETE",
    })

    setCountdowns((current) => current.filter((countdown) => countdown.id !== id))
    setError(null)
  }, [])

  return { countdowns, hydrated, error, addCountdown, updateCountdown, deleteCountdown }
}

/** Returns days remaining (can be negative if past). */
export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate)
  const now = new Date()
  end.setHours(0, 0, 0, 0)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = end.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/** Formats a date as YYYY-MM-DD for <input type="date">. */
export function toInputDate(iso: string): string {
  return iso.slice(0, 10)
}

/**
 * Counts working days (Mon-Fri) between two dates, inclusive of start,
 * exclusive of end. Returns a negative count if end is before start.
 */
function countWorkingDays(from: Date, to: Date): number {
  const sign = to >= from ? 1 : -1
  const cursor = new Date(sign === 1 ? from : to)
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

/** Returns working days remaining (Mon-Fri only). Can be negative if past. */
export function getWorkingDaysRemaining(endDate: string): number {
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return countWorkingDays(today, end)
}
