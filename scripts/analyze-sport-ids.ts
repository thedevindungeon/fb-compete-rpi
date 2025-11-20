/**
 * Script to analyze sport_id values and show mismatches
 * (Dry run - doesn't modify database)
 */

import { createClient } from '@supabase/supabase-js'

// Sport ID mapping
const SPORT_IDS = {
  baseball: 1,
  soccer: 2,
  football: 3,
  volleyball: 4,
  basketball: 5,
  hockey: 6,
  lacrosse: 7,
  pickleball: 8,
} as const

type SportName = keyof typeof SPORT_IDS

/**
 * Detect sport from event name using keywords
 */
function detectSportFromName(eventName: string): number | null {
  const nameLower = eventName.toLowerCase()
  
  // Check for sport keywords in event name
  const sportKeywords: Record<SportName, string[]> = {
    baseball: ['baseball', 'base ball'],
    soccer: ['soccer', 'futbol'],
    football: ['football', 'gridiron'],
    volleyball: ['volleyball', 'volley ball'],
    basketball: ['basketball', 'basket ball', 'hoops'],
    hockey: ['hockey'],
    lacrosse: ['lacrosse', 'lax'],
    pickleball: ['pickleball', 'pickle ball'],
  }
  
  // Check each sport
  for (const [sport, keywords] of Object.entries(sportKeywords)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        return SPORT_IDS[sport as SportName]
      }
    }
  }
  
  return null
}

/**
 * Load config from supabase-config.json or environment variables
 */
async function loadConfig(): Promise<{ url: string; key: string }> {
  // Try to load from supabase-config.json first
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const configPath = path.join(process.cwd(), 'supabase-config.json')
    const configFile = await fs.readFile(configPath, 'utf-8')
    const config = JSON.parse(configFile)
    
    if (config.url && config.anonKey) {
      console.log('✅ Loaded config from supabase-config.json')
      return { url: config.url, key: config.anonKey }
    }
  } catch (err) {
    // Config file doesn't exist or is invalid, try env vars
  }
  
  // Fall back to environment variables
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY
  
  if (supabaseUrl && supabaseKey) {
    console.log('✅ Loaded config from environment variables')
    return { url: supabaseUrl, key: supabaseKey }
  }
  
  console.error('❌ No Supabase configuration found')
  console.log('\nPlease either:')
  console.log('  1. Create/update supabase-config.json with your credentials')
  console.log('  2. Or set environment variables:')
  console.log('     SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=xxx bun run scripts/analyze-sport-ids.ts')
  process.exit(1)
}

/**
 * Main analysis function
 */
async function analyzeSportIds() {
  const { url: supabaseUrl, key: supabaseKey } = await loadConfig()
  
  console.log('🔗 Connecting to Supabase...')
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Fetch all events
  console.log('📊 Fetching events...')
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name')
    .order('name')
  
  if (eventsError) {
    console.error('❌ Error fetching events:', eventsError)
    process.exit(1)
  }
  
  if (!events || events.length === 0) {
    console.log('⚠️  No events found')
    process.exit(0)
  }
  
  console.log(`✅ Found ${events.length} events\n`)
  
  // Fetch current sport_ids
  const eventIds = events.map(e => e.id)
  const { data: currentDetails, error: detailsError } = await supabase
    .schema('fb_compete')
    .from('compete_event_details')
    .select('event_id, sport_id')
    .in('event_id', eventIds)
  
  if (detailsError) {
    console.error('❌ Error fetching event details:', detailsError)
    process.exit(1)
  }
  
  const currentSportMap = new Map<number, number | null>()
  currentDetails?.forEach((detail: any) => {
    currentSportMap.set(detail.event_id, detail.sport_id)
  })
  
  // Analyze events
  const analysis = {
    correct: [] as any[],
    incorrect: [] as any[],
    undetected: [] as any[],
    missing: [] as any[],
  }
  
  for (const event of events) {
    const currentSportId = currentSportMap.get(event.id)
    const detectedSportId = detectSportFromName(event.name || '')
    
    const record = {
      id: event.id,
      name: event.name,
      current: currentSportId,
      detected: detectedSportId,
      currentName: getSportName(currentSportId),
      detectedName: getSportName(detectedSportId),
    }
    
    if (currentSportId === undefined || currentSportId === null) {
      analysis.missing.push(record)
    } else if (detectedSportId === null) {
      analysis.undetected.push(record)
    } else if (currentSportId !== detectedSportId) {
      analysis.incorrect.push(record)
    } else {
      analysis.correct.push(record)
    }
  }
  
  // Display results
  console.log('═══════════════════════════════════════════════════════════════\n')
  console.log('📊 SPORT ID ANALYSIS REPORT\n')
  console.log('═══════════════════════════════════════════════════════════════\n')
  
  console.log('📈 Summary:')
  console.log(`   ✅ Correct: ${analysis.correct.length}`)
  console.log(`   ❌ Incorrect: ${analysis.incorrect.length}`)
  console.log(`   ❓ Cannot detect: ${analysis.undetected.length}`)
  console.log(`   🚫 Missing from DB: ${analysis.missing.length}`)
  console.log(`   📦 Total events: ${events.length}\n`)
  
  if (analysis.incorrect.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('❌ INCORRECT SPORT IDS (Need fixing):')
    console.log('═══════════════════════════════════════════════════════════════\n')
    
    for (const item of analysis.incorrect) {
      console.log(`Event ID: ${item.id}`)
      console.log(`  Name:     "${item.name}"`)
      console.log(`  Current:  ${item.currentName}`)
      console.log(`  Should be: ${item.detectedName}`)
      console.log(`  SQL: UPDATE fb_compete.compete_event_details SET sport_id = ${item.detected} WHERE event_id = ${item.id};`)
      console.log()
    }
  }
  
  if (analysis.missing.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('🚫 MISSING FROM DATABASE:')
    console.log('═══════════════════════════════════════════════════════════════\n')
    
    for (const item of analysis.missing) {
      console.log(`Event ID: ${item.id}`)
      console.log(`  Name:     "${item.name}"`)
      console.log(`  Detected: ${item.detectedName}`)
      if (item.detected) {
        console.log(`  SQL: INSERT INTO fb_compete.compete_event_details (event_id, sport_id) VALUES (${item.id}, ${item.detected});`)
      }
      console.log()
    }
  }
  
  if (analysis.undetected.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('❓ CANNOT AUTO-DETECT SPORT (Manual review needed):')
    console.log('═══════════════════════════════════════════════════════════════\n')
    
    console.table(
      analysis.undetected.map(item => ({
        ID: item.id,
        Name: item.name,
        'Current Sport': item.currentName,
      }))
    )
    console.log()
  }
  
  if (analysis.correct.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════')
    console.log(`✅ CORRECT (${analysis.correct.length} events)`)
    console.log('═══════════════════════════════════════════════════════════════\n')
    
    // Group by sport
    const bySport: Record<string, number> = {}
    for (const item of analysis.correct) {
      const sport = item.currentName
      bySport[sport] = (bySport[sport] || 0) + 1
    }
    
    for (const [sport, count] of Object.entries(bySport)) {
      console.log(`   ${sport}: ${count} events`)
    }
    console.log()
  }
  
  console.log('═══════════════════════════════════════════════════════════════\n')
  
  if (analysis.incorrect.length > 0 || analysis.missing.length > 0) {
    console.log('💡 To fix these issues, run:')
    console.log('   bun run scripts/fix-sport-ids.ts\n')
  } else {
    console.log('🎉 All sport IDs are correct!\n')
  }
}

function getSportName(sportId: number | null | undefined): string {
  const sportNames: Record<number, string> = {
    1: '⚾ Baseball',
    2: '⚽ Soccer',
    3: '🏈 Football',
    4: '🏐 Volleyball',
    5: '🏀 Basketball',
    6: '🏒 Hockey',
    7: '🥍 Lacrosse',
    8: '🏓 Pickleball',
  }
  return sportId ? sportNames[sportId] || `Unknown (${sportId})` : '❓ None'
}

// Run the script
analyzeSportIds().catch(console.error)

