/**
 * Detect sport by analyzing match data patterns
 * Different sports have different scoring patterns
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'

async function loadConfig() {
  const configFile = await fs.readFile('supabase-config.json', 'utf-8')
  return JSON.parse(configFile)
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
  return sportId ? sportNames[sportId] : '❓ Unknown'
}

async function detectSportFromMatches() {
  const config = await loadConfig()
  const supabase = createClient(config.url, config.anonKey)
  
  console.log('🔗 Analyzing match data to detect sports...\n')
  
  // Get all events
  const { data: events } = await supabase
    .from('events')
    .select('id, name')
    .order('id')
  
  if (!events) return
  
  // Get current sport_ids
  const { data: eventDetails } = await supabase
    .schema('fb_compete')
    .from('compete_event_details')
    .select('event_id, sport_id')
  
  const currentSportMap = new Map<number, number>()
  eventDetails?.forEach((d: any) => {
    currentSportMap.set(d.event_id, d.sport_id)
  })
  
  console.log('Event Analysis (with scoring patterns):\n')
  console.log('═══════════════════════════════════════════════════════════════\n')
  
  for (const event of events) {
    const currentSport = currentSportMap.get(event.id)
    
    // Get sample match scores
    const { data: matches } = await supabase
      .schema('fb_compete')
      .from('match')
      .select(`
        id,
        match_game!inner(
          match_game_team!inner(
            score
          )
        )
      `)
      .eq('event_id', event.id)
      .eq('published', true)
      .limit(5)
    
    // Analyze score patterns
    const scores: number[] = []
    matches?.forEach((match: any) => {
      match.match_game?.forEach((game: any) => {
        game.match_game_team?.forEach((team: any) => {
          if (typeof team.score === 'number') {
            scores.push(team.score)
          }
        })
      })
    })
    
    const avgScore = scores.length > 0 
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : 'N/A'
    
    const maxScore = scores.length > 0 ? Math.max(...scores) : 'N/A'
    const minScore = scores.length > 0 ? Math.min(...scores) : 'N/A'
    
    // Suggest sport based on scoring patterns
    let suggestedSport = '?'
    if (scores.length > 0) {
      const avg = parseFloat(avgScore as string)
      if (avg >= 15 && avg <= 30) suggestedSport = 'Maybe Volleyball 🏐 or Soccer ⚽'
      else if (avg > 30 && avg <= 60) suggestedSport = 'Maybe Football 🏈 or Basketball 🏀'
      else if (avg > 60) suggestedSport = 'Maybe Basketball 🏀'
      else if (avg < 15) suggestedSport = 'Maybe Baseball ⚾, Soccer ⚽, or Hockey 🏒'
    }
    
    console.log(`Event ${event.id}: ${event.name}`)
    console.log(`  Current: ${getSportName(currentSport || null)}`)
    console.log(`  Scores: Avg=${avgScore}, Min=${minScore}, Max=${maxScore} (${scores.length} samples)`)
    if (suggestedSport !== '?') {
      console.log(`  Pattern suggests: ${suggestedSport}`)
    }
    console.log()
  }
  
  console.log('═══════════════════════════════════════════════════════════════\n')
  console.log('💡 This is just a heuristic based on scoring patterns.')
  console.log('   Use the interactive fixer to set sports correctly:\n')
  console.log('   npm run fix-sports:interactive\n')
}

detectSportFromMatches().catch(console.error)

