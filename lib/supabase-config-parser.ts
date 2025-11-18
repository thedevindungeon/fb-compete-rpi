export type SupabaseConfig = {
  url: string
  anonKey: string
}

/**
 * Parse Supabase configuration from various formats
 */
export function parseSupabaseConfig(content: string): SupabaseConfig | null {
  // Try JSON format first
  try {
    const json = JSON.parse(content)
    const url = json.url || json.supabaseUrl || json.SUPABASE_URL || json.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = json.anonKey || json.supabaseKey || json.anon_key || json.SUPABASE_ANON_KEY || json.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (url && anonKey) {
      return { url, anonKey }
    }
  } catch {
    // Not JSON, try other formats
  }

  // Try environment variable format
  const envVars: Record<string, string> = {}
  const lines = content.split('\n')
  
  for (const line of lines) {
    // Match KEY=VALUE format
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '') // Remove quotes
      envVars[key] = value
    }
    
    // Match "Key: Value" format (like the SUPABASE_LOCAL_INFO.txt)
    const colonMatch = line.match(/^([^:]+):\s*(.+)$/)
    if (colonMatch) {
      const key = colonMatch[1].trim().toLowerCase()
      const value = colonMatch[2].trim()
      
      if (key.includes('api url') || key.includes('supabase url')) {
        envVars['NEXT_PUBLIC_SUPABASE_URL'] = value
      } else if (key.includes('publishable key') || key.includes('anon key')) {
        envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = value
      }
    }
  }

  const url = envVars['NEXT_PUBLIC_SUPABASE_URL'] || envVars['SUPABASE_URL']
  const anonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || envVars['SUPABASE_ANON_KEY']

  if (url && anonKey) {
    return { url, anonKey }
  }

  // Try simple key-value pairs
  const urlMatch = content.match(/(?:url|supabase[_-]?url)[\s:=]+([^\s\n]+)/i)
  const keyMatch = content.match(/(?:anon[_-]?key|publishable[_-]?key)[\s:=]+([^\s\n]+)/i)

  if (urlMatch && keyMatch) {
    return {
      url: urlMatch[1].trim(),
      anonKey: keyMatch[1].trim(),
    }
  }

  return null
}

/**
 * Validate Supabase configuration
 */
export function validateSupabaseConfig(config: SupabaseConfig): { valid: boolean; error?: string } {
  if (!config.url) {
    return { valid: false, error: 'Supabase URL is required' }
  }

  if (!config.anonKey) {
    return { valid: false, error: 'Anon key is required' }
  }

  // Basic URL validation
  try {
    const url = new URL(config.url)
    if (!url.protocol.startsWith('http')) {
      return { valid: false, error: 'Invalid URL protocol' }
    }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  // Basic key validation (should start with eyJ or sb_)
  if (!config.anonKey.match(/^(eyJ|sb_)/)) {
    return { valid: false, error: 'Invalid anon key format' }
  }

  return { valid: true }
}

/**
 * Export configuration to JSON format
 */
export function exportSupabaseConfig(config: SupabaseConfig): string {
  return JSON.stringify(
    {
      url: config.url,
      anonKey: config.anonKey,
    },
    null,
    2
  )
}

