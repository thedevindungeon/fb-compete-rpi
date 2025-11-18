import { useQuery } from '@tanstack/react-query'
import type { TeamData } from '@/lib/types'
import { fetchTeamDataFromSupabase } from '@/lib/supabase-client'

export function useSupabaseData(
  supabaseUrl: string,
  supabaseKey: string,
  eventId: number
) {
  return useQuery<TeamData[], Error>({
    queryKey: ['supabase-data', supabaseUrl, eventId],
    queryFn: () => fetchTeamDataFromSupabase(supabaseUrl, supabaseKey, eventId),
    enabled: !!supabaseUrl && !!supabaseKey && !!eventId && eventId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

