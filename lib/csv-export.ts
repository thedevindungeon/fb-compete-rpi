import type { TeamRPIResult } from '@/lib/types'

const CSV_HEADERS = [
  'Rank',
  'Team',
  'Games',
  'Wins',
  'Losses',
  'Ties',
  'WP',
  'CLWP',
  'OCLWP',
  'OOCLWP',
  'DIFF',
  'RPI',
] as const

export function exportResultsToCSV(results: TeamRPIResult[]): void {
  const rows = results.map((result, index) => [
    index + 1,
    result.teamName,
    result.games,
    result.wins,
    result.losses,
    result.ties,
    result.wp.toFixed(4),
    result.clwp.toFixed(4),
    result.oclwp.toFixed(4),
    result.ooclwp.toFixed(4),
    result.diff.toFixed(4),
    result.rpi.toFixed(4),
  ])

  const csvContent = [
    CSV_HEADERS.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `rpi-results-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

