/**
 * Script to fix sport_id values in compete_event_details table
 * based on event names
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
    soccer: ['soccer', 'futbol', 'football' /* but not american */],
    football: ['football', 'gridiron'],
    volleyball: ['volleyball', 'volley ball'],
    basketball: ['basketball', 'basket ball', 'hoops'],
    hockey: ['hockey'],
    lacrosse: ['lacrosse', 'lax'],
    pickleball: ['pickleball', 'pickle ball'],
  }
  
  // Special case: "football" could be soccer or american football
  // If name has "football" but no american football context, assume soccer
  if (nameLower.includes('football')) {
    // American football keywords
    if (nameLower.includes('gridiron') || nameLower.includes('nfl') || nameLower.includes('american')) {
      return SPORT_IDS.football
    }
    // Default football to soccer (international usage)
    return SPORT_IDS.soccer
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
  console.log('     SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=xxx bun run scripts/fix-sport-ids.ts')
  process.exit(1)
}

/**
 * Main function to fix sport IDs
 */
async function fixSportIds() {
  const { url: supabaseUrl, key: supabaseKey } = await loadConfig()
  
  console.log('🔗 Connecting to Supabase...')
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Fetch all events
  console.log('📊 Fetching events...')
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name')
  
  if (eventsError) {
    console.error('❌ Error fetching events:', eventsError)
    process.exit(1)
  }
  
  if (!events || events.length === 0) {
    console.log('⚠️  No events found')
    process.exit(0)
  }
  
  console.log(`✅ Found ${events.length} events`)
  
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
  
  // Analyze and prepare updates
  console.log('\n🔍 Analyzing events...\n')
  
  const updates: Array<{
    eventId: number
    eventName: string
    currentSportId: number | null
    detectedSportId: number | null
    needsUpdate: boolean
  }> = []
  
  for (const event of events) {
    const currentSportId = currentSportMap.get(event.id) || null
    const detectedSportId = detectSportFromName(event.name || '')
    const needsUpdate = detectedSportId !== null && currentSportId !== detectedSportId
    
    updates.push({
      eventId: event.id,
      eventName: event.name || `Event ${event.id}`,
      currentSportId,
      detectedSportId,
      needsUpdate,
    })
  }
  
  // Display findings
  const needsUpdateCount = updates.filter(u => u.needsUpdate).length
  const undetectedCount = updates.filter(u => u.detectedSportId === null).length
  
  console.log('📋 Summary:')
  console.log(`   Total events: ${updates.length}`)
  console.log(`   Need update: ${needsUpdateCount}`)
  console.log(`   Cannot detect sport: ${undetectedCount}`)
  console.log(`   Already correct: ${updates.length - needsUpdateCount - undetectedCount}`)
  
  if (needsUpdateCount > 0) {
    console.log('\n🔧 Events that need updating:\n')
    console.table(
      updates
        .filter(u => u.needsUpdate)
        .map(u => ({
          ID: u.eventId,
          Name: u.eventName.substring(0, 40),
          'Current Sport': getSportName(u.currentSportId),
          'Detected Sport': getSportName(u.detectedSportId),
        }))
    )
  }
  
  if (undetectedCount > 0) {
    console.log('\n⚠️  Events with undetected sports (will be skipped):\n')
    console.table(
      updates
        .filter(u => u.detectedSportId === null)
        .map(u => ({
          ID: u.eventId,
          Name: u.eventName.substring(0, 50),
          'Current Sport': getSportName(u.currentSportId),
        }))
    )
  }
  
  // Prompt for confirmation
  if (needsUpdateCount === 0) {
    console.log('\n✨ All events have correct sport_ids! No updates needed.')
    process.exit(0)
  }
  
  console.log('\n⚠️  This will update the compete_event_details table in your database.')
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')
  
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  // Perform updates
  console.log('🚀 Updating sport_ids...\n')
  
  let successCount = 0
  let errorCount = 0
  
  for (const update of updates) {
    if (!update.needsUpdate || !update.detectedSportId) continue
    
    const { error } = await supabase
      .schema('fb_compete')
      .from('compete_event_details')
      .update({ sport_id: update.detectedSportId })
      .eq('event_id', update.eventId)
    
    if (error) {
      console.error(`❌ Failed to update event ${update.eventId}: ${error.message}`)
      errorCount++
    } else {
      console.log(`✅ Updated event ${update.eventId} (${update.eventName}): ${getSportName(update.currentSportId)} → ${getSportName(update.detectedSportId)}`)
      successCount++
    }
  }
  
  console.log('\n📊 Update Summary:')
  console.log(`   ✅ Successfully updated: ${successCount}`)
  console.log(`   ❌ Failed: ${errorCount}`)
  console.log('\n🎉 Done!')
}

function getSportName(sportId: number | null): string {
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
fixSportIds().catch(console.error)

