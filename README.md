# RPI Calculator

A Next.js application for calculating Rating Percentage Index (RPI) for sports tournaments. Built with TDD principles, featuring real-time calculations and optional Supabase integration.

## Features

- **Real-time RPI Calculations**: Adjust coefficients and see instant updates
- **Sample Data**: Pre-loaded basketball tournament data for testing
- **Supabase Integration**: Connect to real event data from your Supabase database
- **Sortable Results Table**: Click column headers to sort by any metric
- **CSV Export**: Download results for further analysis
- **Responsive Design**: Works on mobile, tablet, and desktop
- **TDD Approach**: Comprehensive test coverage with Vitest

## Technology Stack

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn UI** for components
- **TanStack Query** for data management
- **Supabase** for database connection
- **Vitest** for testing
- **Bun** for package management

## Getting Started

### Prerequisites

- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Node.js 22+ (optional, Bun can run independently)

### Installation

```bash
# Clone or navigate to the project
cd /Users/djt/fastbreak/rpi

# Install dependencies
bun install

# Run development server
bun dev

# Open http://localhost:3000
```

### Testing

```bash
# Run tests in watch mode
bun test

# Run tests once
bun test:run

# Run with coverage
bun test:coverage
```

## RPI Formula Explained

### Overview

RPI (Rating Percentage Index) is a statistical measure used to rank teams based on wins, losses, strength of schedule, and point differentials. This implementation includes competitive level adjustments and domination bonuses.

### Components

#### 1. CLWP (Competitive Level Winning Percentage)

Adjusted winning percentage that accounts for competitive level differences between teams.

```
CLWP = Adjusted Wins / (Adjusted Wins + Adjusted Losses)
```

**Adjustments:**
- Beating a stronger opponent (higher competitive level): Win value increases by `levelDiff × CLGW_STEP`
- Losing to a stronger opponent: Loss penalty decreases by `levelDiff × CLGL_STEP`
- Beating a weaker opponent: Win value decreases by `levelDiff × CLGW_STEP`
- Losing to a weaker opponent: Loss penalty increases by `levelDiff × CLGL_STEP`
- Ties count as 0.5 wins and 0.5 losses

**Example:**
- Team A (Level 8) beats Team B (Level 10): `1 + (2 × 0.05) = 1.10 adjusted wins`
- Team A (Level 8) loses to Team C (Level 6): `1 + (2 × 0.1) = 1.20 adjusted losses`

#### 2. OCLWP (Opponent Competitive Level Winning Percentage)

Average CLWP of all opponents a team has faced.

```
OCLWP = Σ(Opponent CLWP) / Number of Opponents
```

This measures strength of schedule.

#### 3. OOCLWP (Opponent's Opponent Competitive Level Winning Percentage)

Average CLWP of all opponents that a team's opponents have faced (excluding the team itself).

```
OOCLWP = Σ(Opponent's Opponents CLWP) / Number of Opponent's Opponents
```

This provides a second-degree measure of schedule strength.

#### 4. DIFF (Points Differential)

Average score margin across all games.

```
Game DIFF = (Team Score - Opponent Score) / (Team Score + Opponent Score)
DIFF = Σ(Game DIFF) / Number of Games
```

Values range from -1.0 (extreme losses) to +1.0 (extreme wins).

#### 5. Base RPI Calculation

```
Base RPI = (CLWP_COEFF × CLWP) + (OCLWP_COEFF × OCLWP) + (OOCLWP_COEFF × OOCLWP)
```

**Default Coefficients:**
- CLWP_COEFF = 0.9 (90% weight on own performance)
- OCLWP_COEFF = 0.1 (10% weight on opponent strength)
- OOCLWP_COEFF = 0.1 (10% weight on secondary schedule strength)

#### 6. RPI with Differential

```
RPI with DIFF = Base RPI + (DIFF_COEFF × DIFF)
```

**Default DIFF_COEFF = 0.1**

#### 7. Domination Bonus

If a team has 8 or more consecutive wins:

```
Final RPI = RPI with DIFF × DOMINATION_COEFF
```

**Default DOMINATION_COEFF = 0.9** (reduces RPI to prevent over-rewarding win streaks)

### Complete Formula

```
Final RPI = (
  (CLWP_COEFF × CLWP) + 
  (OCLWP_COEFF × OCLWP) + 
  (OOCLWP_COEFF × OOCLWP) + 
  (DIFF_COEFF × DIFF)
) × DOMINATION_COEFF (if 8+ wins in a row)
```

## Coefficient Reference

### CLWP Coefficient (0.9)
Weight for team's own adjusted winning percentage. Higher = more emphasis on wins/losses.

### OCLWP Coefficient (0.1)
Weight for opponent strength. Higher = more reward for beating strong teams.

### OOCLWP Coefficient (0.1)
Weight for secondary schedule strength. Considers quality of opponents' opponents.

### DIFF Coefficient (0.1)
Weight for point differentials. Higher = more emphasis on margin of victory.

### Domination Coefficient (0.9)
Multiplier applied when team has 8+ consecutive wins. <1.0 prevents over-rewarding streaks.

### CLGW Step (0.05)
Amount added/subtracted per competitive level difference for wins.

### CLGL Step (0.1)
Amount added/subtracted per competitive level difference for losses.

### Min Games (3)
Minimum games required to be ranked (prevents teams with few games topping standings).

### Points Differential Interval (15)
Optional cap on score differential impact (not currently enforced in calculations).

## Using Sample Data

Click "Load Sample Data" to test with 10 pre-configured basketball teams:

- **10 teams** across competitive levels 6-10
- **4-9 games** per team
- **Realistic scores** (70-95 points)
- **Competitive level differences** for testing adjustments
- **Falcons Premier** has 9 consecutive wins for domination bonus testing

## Connecting to Supabase

1. Click "Supabase Connection" accordion to expand
2. Enter your Supabase project URL
3. Enter your Supabase anon key
4. Enter the Event ID from your `fb_compete.match` table
5. Click "Connect & Load Data"

### Database Schema Requirements

The application expects the following Supabase schema in the `fb_compete` namespace:

```sql
- match (event_id, published, config)
- match_team (match_id, team_id, definition)
- match_game (match_id)
- match_game_team (match_game_id, team_id, score, definition)
- teams (id, name) in public schema
```

## Development

### Project Structure

```
rpi/
├── app/
│   ├── layout.tsx          # Root layout with QueryClientProvider
│   ├── page.tsx            # Main RPI calculator page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Shadcn UI components
│   ├── rpi-coefficients-panel.tsx
│   ├── team-results-table.tsx
│   ├── sample-data-panel.tsx
│   └── supabase-connection-panel.tsx
├── lib/
│   ├── rpi-calculator.ts   # Core RPI calculation logic
│   ├── types.ts            # TypeScript type definitions
│   ├── sample-data.ts      # Sample tournament data
│   ├── supabase-client.ts  # Supabase data fetching
│   └── utils.ts            # Utility functions
├── hooks/
│   ├── use-rpi-calculation.ts   # TanStack Query hook for RPI
│   └── use-supabase-data.ts     # TanStack Query hook for Supabase
└── tests/
    └── rpi-calculator.test.ts   # Comprehensive test suite
```

### Adding New Features

1. Write tests first (TDD approach)
2. Implement minimal code to pass tests
3. Refactor and optimize
4. Update UI components if needed

### Testing Strategy

- **Unit tests** for all calculation functions
- **Edge case tests** for 0 games, all wins, all losses
- **Integration tests** for coefficient application
- **Component tests** (future enhancement)

## Abbreviations

- **WP**: Winning Percentage
- **PPG**: Points Per Game
- **OPP PPG**: Opponent Points Per Game
- **DIFF**: Points Differential
- **RPI**: Rating Percentage Index
- **CLN**: Competitive Level Normalization
- **CLG**: Competitive Levels/Grades
- **CLWP**: Competitive Level Winning Percentage
- **OCLWP**: Opponent CLWP
- **OOCLWP**: Opponent's Opponent CLWP

## License

MIT

## Contributing

This is a test/development tool. Feel free to fork and customize for your needs.
