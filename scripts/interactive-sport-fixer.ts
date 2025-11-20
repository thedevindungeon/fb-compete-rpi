/**
 * Interactive script to manually assign sports to events
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

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

const SPORT_OPTIONS = [
  { id: 1, name: 'Baseball', icon: '⚾', key: '1' },
  { id: 2, name: 'Soccer', icon: '⚽', key: '2' },
  { id: 3, name: 'Football', icon: '🏈', key: '3' },
  { id: 4, name: 'Volleyball', icon: '🏐', key: '4' },
  { id: 5, name: 'Basketball', icon: '🏀', key: '5' },
  { id: 6, name: 'Hockey', icon: '🏒', key: '6' },
  { id: 7, name: 'Lacrosse', icon: '🥍', key: '7' },
  { id: 8, name: 'Pickleball', icon: '🏓', key: '8' },
]

async function loadConfig(): Promise<{ url: string; key: string }> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const configPath = path.join(process.cwd(), 'supabase-config.json')
    const configFile = await fs.readFile(configPath, 'utf-8')
    const config = JSON.parse(configFile)
    
    if (config.url && config.anonKey) {
      return { url: config.url, key: config.anonKey }
    }
  } catch (err) {
    // Fall through
  }
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY
  
  if (supabaseUrl && supabaseKey) {
    return { url: supabaseUrl, key: supabaseKey }
  }
  
  console.error('❌ No Supabase configuration found')
  process.exit(1)
}

function getSportName(sportId: number | null): string {
  const sport = SPORT_OPTIONS.find(s => s.id === sportId)
  return sport ? `${sport.icon} ${sport.name}` : '❓ Unknown'
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function interactiveFix() {
  const { url: supabaseUrl, key: supabaseKey } = await loadConfig()
  
  console.log('🔗 Connecting to Supabase...')
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Fetch events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name')
    .order('name')
  
  if (eventsError || !events) {
    console.error('❌ Error fetching events:', eventsError)
    process.exit(1)
  }
  
  // Fetch current sport_ids
  const eventIds = events.map(e => e.id)
  const { data: currentDetails } = await supabase
    .schema('fb_compete')
    .from('compete_event_details')
    .select('event_id, sport_id')
    .in('event_id', eventIds)
  
  const currentSportMap = new Map<number, number | null>()
  currentDetails?.forEach((detail: any) => {
    currentSportMap.set(detail.event_id, detail.sport_id)
  })
  
  console.log(`\n✅ Found ${events.length} events\n`)
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('Interactive Sport Assignment')
  console.log('═══════════════════════════════════════════════════════════════\n')
  console.log('For each event, select the correct sport:')
  console.log('Options:')
  SPORT_OPTIONS.forEach(sport => {
    console.log(`  ${sport.key}) ${sport.icon} ${sport.name}`)
  })
  console.log('  s) Skip this event')
  console.log('  q) Quit')
  console.log('\n═══════════════════════════════════════════════════════════════\n')
  
  const updates: Array<{ eventId: number; sportId: number }> = []
  
  for (const event of events) {
    const currentSportId = currentSportMap.get(event.id)
    
    console.log(`\nEvent: "${event.name}" (ID: ${event.id})`)
    console.log(`Current sport: ${getSportName(currentSportId)}`)
    
    const answer = await prompt('Select sport (1-8, s=skip, q=quit): ')
    
    if (answer.toLowerCase() === 'q') {
      console.log('\n❌ Cancelled by user')
      break
    }
    
    if (answer.toLowerCase() === 's' || answer === '') {
      console.log('⏭️  Skipped')
      continue
    }
    
    const sportOption = SPORT_OPTIONS.find(s => s.key === answer)
    if (!sportOption) {
      console.log('❌ Invalid option, skipping')
      continue
    }
    
    if (sportOption.id === currentSportId) {
      console.log(`✓ Already set to ${getSportName(sportOption.id)}`)
      continue
    }
    
    updates.push({
      eventId: event.id,
      sportId: sportOption.id,
    })
    
    console.log(`✓ Will update to ${getSportName(sportOption.id)}`)
  }
  
  if (updates.length === 0) {
    console.log('\n✨ No updates to apply')
    return
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log(`📝 Summary: ${updates.length} event(s) to update`)
  console.log('═══════════════════════════════════════════════════════════════\n')
  
  for (const update of updates) {
    const event = events.find(e => e.id === update.eventId)
    console.log(`  ${event?.name} → ${getSportName(update.sportId)}`)
  }
  
  const confirm = await prompt('\nApply these updates? (yes/no): ')
  
  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('\n❌ Cancelled by user')
    return
  }
  
  console.log('\n🚀 Applying updates...\n')
  
  let successCount = 0
  let errorCount = 0
  
  for (const update of updates) {
    const { error } = await supabase
      .schema('fb_compete')
      .from('compete_event_details')
      .update({ sport_id: update.sportId })
      .eq('event_id', update.eventId)
    
    if (error) {
      console.error(`❌ Failed to update event ${update.eventId}: ${error.message}`)
      errorCount++
    } else {
      const event = events.find(e => e.id === update.eventId)
      console.log(`✅ Updated: ${event?.name}`)
      successCount++
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('📊 Results:')
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Failed: ${errorCount}`)
  console.log('═══════════════════════════════════════════════════════════════\n')
  console.log('🎉 Done!')
}

interactiveFix().catch(console.error)

