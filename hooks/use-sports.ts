import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase-client-singleton'

export type Sport = {
  id: number
  name: string
  display_name: string
  icon: string | null
  slug: string
  default_clwp_coeff: number
  default_oclwp_coeff: number
  default_ooclwp_coeff: number
  default_diff_coeff: number
  default_domination_coeff: number
  default_clgw_step: number
  default_clgl_step: number
  default_min_games: number
  default_diff_interval: number
  points_term: string
  score_term: string
  show_diff: boolean
  show_domination: boolean
  description: string | null
  is_active: boolean
  sort_order: number
}

async function fetchSports(supabaseUrl?: string, supabaseKey?: string): Promise<Sport[]> {
  // Try to get from environment or use local config
  if (!supabaseUrl || !supabaseKey) {
    // Try to load from local config
    try {
      const response = await fetch('/supabase-config.json')
      if (response.ok) {
        const config = await response.json()
        supabaseUrl = config.url
        supabaseKey = config.anonKey
      }
    } catch {
      // Will use default config
    }
  }

  // If still no config, return empty (will fallback to hardcoded config)
  if (!supabaseUrl || !supabaseKey) {
    return []
  }

  const supabase = getSupabaseClient(supabaseUrl, supabaseKey)
  
  const { data, error } = await supabase
    .schema('fb_compete')
    .from('sports')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    console.error('Error fetching sports:', error)
    return []
  }

  return (data || []) as Sport[]
}

/**
 * Hook to fetch sports configuration from database
 * Falls back to hardcoded config if database is unavailable
 */
export function useSports(supabaseUrl?: string, supabaseKey?: string) {
  return useQuery<Sport[]>({
    queryKey: ['sports', supabaseUrl],
    queryFn: () => fetchSports(supabaseUrl, supabaseKey),
    staleTime: 10 * 60 * 1000, // 10 minutes (sports config rarely changes)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  })
}

/**
 * Hook to get a single sport by ID
 */
export function useSport(sportId: number | null | undefined, supabaseUrl?: string, supabaseKey?: string) {
  const { data: sports, ...rest } = useSports(supabaseUrl, supabaseKey)
  
  const sport = sportId ? sports?.find(s => s.id === sportId) : undefined
  
  return {
    data: sport,
    ...rest,
  }
}

