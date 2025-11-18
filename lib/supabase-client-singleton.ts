import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Use globalThis to persist across hot reloads and avoid multiple instances
const getGlobalCache = () => {
  if (typeof globalThis !== 'undefined' && !globalThis.__supabaseClientCache) {
    globalThis.__supabaseClientCache = new Map<string, SupabaseClient>()
  }
  return (globalThis as any).__supabaseClientCache as Map<string, SupabaseClient>
}

export function getSupabaseClient(
  supabaseUrl: string,
  supabaseKey: string
): SupabaseClient {
  const cache = getGlobalCache()
  const cacheKey = `${supabaseUrl}:${supabaseKey}`
  
  if (!cache.has(cacheKey)) {
    const client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      global: {
        headers: {
          'x-client-info': 'rpi-calculator',
        },
      },
    })
    cache.set(cacheKey, client)
  }
  
  return cache.get(cacheKey)!
}

