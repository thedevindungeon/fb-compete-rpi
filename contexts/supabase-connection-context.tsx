'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'supabase-connection-state'

type SupabaseConnectionState = {
  url: string
  key: string
  eventId: number | null
  eventName: string | null
  timestamp: number
}

type SupabaseConnectionContextType = {
  url: string | null
  key: string | null
  eventId: number | null
  eventName: string | null
  isConnected: boolean
  setConnection: (url: string, key: string, eventId?: number | null, eventName?: string | null) => void
  clearConnection: () => void
  updateEvent: (eventId: number, eventName: string) => void
}

const SupabaseConnectionContext = createContext<SupabaseConnectionContextType | undefined>(
  undefined
)

export function SupabaseConnectionProvider({ children }: { children: React.ReactNode }) {
  const [url, setUrl] = useState<string | null>(null)
  const [key, setKey] = useState<string | null>(null)
  const [eventId, setEventId] = useState<number | null>(null)
  const [eventName, setEventName] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const state: SupabaseConnectionState = JSON.parse(stored)
        
        // Check if connection is less than 7 days old
        const sevenDays = 7 * 24 * 60 * 60 * 1000
        if (Date.now() - state.timestamp < sevenDays) {
          setUrl(state.url)
          setKey(state.key)
          setEventId(state.eventId)
          setEventName(state.eventName)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Failed to load connection state:', error)
    }
  }, [])

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          try {
            const state: SupabaseConnectionState = JSON.parse(e.newValue)
            setUrl(state.url)
            setKey(state.key)
            setEventId(state.eventId)
            setEventName(state.eventName)
          } catch {}
        } else {
          // Connection cleared
          setUrl(null)
          setKey(null)
          setEventId(null)
          setEventName(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const setConnection = useCallback(
    (newUrl: string, newKey: string, newEventId?: number | null, newEventName?: string | null) => {
      const state: SupabaseConnectionState = {
        url: newUrl,
        key: newKey,
        eventId: newEventId ?? null,
        eventName: newEventName ?? null,
        timestamp: Date.now(),
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      setUrl(newUrl)
      setKey(newKey)
      setEventId(newEventId ?? null)
      setEventName(newEventName ?? null)
    },
    []
  )

  const clearConnection = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUrl(null)
    setKey(null)
    setEventId(null)
    setEventName(null)
  }, [])

  const updateEvent = useCallback(
    (newEventId: number, newEventName: string) => {
      if (url && key) {
        const state: SupabaseConnectionState = {
          url,
          key,
          eventId: newEventId,
          eventName: newEventName,
          timestamp: Date.now(),
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        setEventId(newEventId)
        setEventName(newEventName)
      }
    },
    [url, key]
  )

  const isConnected = !!(url && key)

  return (
    <SupabaseConnectionContext.Provider
      value={{
        url,
        key,
        eventId,
        eventName,
        isConnected,
        setConnection,
        clearConnection,
        updateEvent,
      }}
    >
      {children}
    </SupabaseConnectionContext.Provider>
  )
}

export function useSupabaseConnection() {
  const context = useContext(SupabaseConnectionContext)
  if (context === undefined) {
    throw new Error('useSupabaseConnection must be used within a SupabaseConnectionProvider')
  }
  return context
}

