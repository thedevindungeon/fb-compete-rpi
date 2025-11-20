# Getting Started

Quick start guide for the RPI Calculator.

## Prerequisites

- **Bun** installed: `curl -fsSL https://bun.sh/install | bash`
- **Node.js** 22+ (optional, Bun can run independently)
- **Git** for version control

## Installation

```bash
# Navigate to project
cd /Users/djt/fastbreak/rpi

# Install dependencies
bun install
```

## Development

### Start Dev Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Tests

```bash
# Watch mode
bun test

# Run once
bun test:run

# With coverage
bun test:coverage
```

### Build for Production

```bash
bun run build
bun start
```

### Linting

```bash
bun run lint
```

---

## Loading Data

### Option 1: Sample Data (Quickest)

1. Click **"Load Sample Data"** button
2. See 10 pre-configured basketball teams
3. Adjust coefficients and see results update

**Use Case**: Testing, demos, learning how RPI works

### Option 2: Generate Dataset

1. Click **"Sample Data & Upload"** accordion
2. Expand **"Generate Dataset"**
3. Configure:
   - **Teams**: 10-1000
   - **Games/Team**: 10-100
   - **Sport**: Select from dropdown (⚾⚽🏈🏐🏀🏒🥍🏓)
4. Click **"Generate"**
5. See sport-specific RPI calculations

**Use Case**: Large-scale testing, stress testing, sport-specific demos

See: [Generate Dataset Guide](generate-dataset-sport-selection.md)

### Option 3: Upload JSON

1. Click **"Upload JSON File"**
2. Select a JSON file with tournament data
3. Data must match schema (see below)

**Use Case**: Importing from external systems

### Option 4: Connect to Supabase

1. Click **"Supabase Connection"** accordion
2. Enter:
   - **Supabase URL**: `https://your-project.supabase.co`
   - **Anon Key**: Your Supabase anon key
3. Click **"Connect & Load Events"**
4. Select an event from the list
5. Click **"Load Event Data"**

**Use Case**: Live tournament data, production use

See: [Connecting to Supabase](#connecting-to-supabase)

---

## Connecting to Supabase

### Required Database Schema

The app expects these tables in the `fb_compete` schema:

```sql
fb_compete.match           -- Matches for events
fb_compete.match_team      -- Teams in matches
fb_compete.match_game      -- Games within matches
fb_compete.match_game_team -- Game scores
fb_compete.teams           -- Team details
fb_compete.sports          -- Sport configurations
```

See: [Database Sports Structure](database-sports-structure.md)

### Setup Supabase Connection

#### 1. Get Credentials

From Supabase Dashboard:
- **Project Settings** → **API** → **Project URL**
- **Project Settings** → **API** → **anon/public key**

#### 2. Configure in App

You can either:

**A. Enter via UI** (Recommended)
1. Open Supabase Connection panel
2. Paste URL and key
3. Click "Connect"

**B. Upload Config File**
1. Create `supabase-config.json`:
   ```json
   {
     "url": "https://your-project.supabase.co",
     "anonKey": "your-anon-key"
   }
   ```
2. Click "Upload Config"
3. Select the file

#### 3. Load Event Data

1. Browse available events (with sport icons)
2. Click on an event
3. See RPI calculations with sport-specific formulas

---

## Adjusting RPI Coefficients

### Via UI (Real-time)

1. Open **"RPI Coefficients"** panel (right sidebar)
2. Adjust any coefficient:
   - **CLWP**: Your winning percentage weight (default 0.9)
   - **OCLWP**: Opponent strength weight (default 0.1)
   - **OOCLWP**: Secondary schedule strength (default 0.1)
   - **DIFF**: Point differential weight (default 0.1)
   - **Domination**: Win streak penalty (default 0.9)
3. See results update instantly

### Reset to Defaults

Click the **"↻"** button to restore:
- **Generic defaults** (if no sport detected)
- **Sport-specific defaults** (if Supabase sport detected)

**Example**: Loading Soccer event → Reset restores NCAA 25-50-25 formula

See: [Sport-Specific RPI](sport-specific-rpi.md)

---

## Understanding Results

### Rankings Table

| Column | Meaning |
|--------|---------|
| **Rank** | Overall ranking (1 = best) |
| **Team** | Team name |
| **G** | Games played |
| **W** | Wins |
| **L** | Losses |
| **T** | Ties (if applicable) |
| **WP** | Winning Percentage |
| **PPG** | Points Per Game |
| **OPP PPG** | Opponent Points Per Game |
| **DIFF** | Point Differential (may hide for some sports) |
| **RPI** | Final RPI score |

### Sorting

Click any column header to sort by that metric.

### Sport-Specific Columns

Some columns hide based on sport:
- **Volleyball/Pickleball**: DIFF column less relevant (set/game-based)
- **Future**: Domination column may hide for certain sports

See: [Sport UI Guide](sport-ui-guide.md)

---

## Exporting Results

### CSV Export

1. Calculate RPI for your data
2. Click **"Export CSV"** button
3. Choose location to save
4. Open in Excel, Google Sheets, etc.

**Includes**: All metrics (rank, RPI, CLWP, OCLWP, OOCLWP, record, etc.)

### JSON Export

1. Click **"Export JSON"** button
2. Save raw data
3. Use for backups or data processing

---

## Saving Calculations (Historical Tracking)

**Only available with Supabase connection**

1. Calculate RPI for an event
2. Click **"Save Calculation"** button
3. Add optional notes (e.g., "End of Day 1")
4. Click **"Save"**
5. View history in the modal

**Use Cases**:
- Track rankings throughout a tournament
- Compare different coefficient settings
- Audit trail for decisions

See: [RPI Historical Calculations](rpi-historical-calculations.md)

---

## Database Admin Interface

**Only available with Supabase connection**

### Accessing Admin

1. Connect to Supabase
2. In connection modal, click **"Admin"** button (blue)
3. Opens in new tab

### What You Can Do

- **Events**: Create, edit, delete events
- **Teams**: Manage team roster
- **Sports**: Configure sport settings

See: [Database Admin Interface](database-admin-interface.md)

---

## Common Workflows

### Testing New RPI Formula

1. Generate dataset (100 teams, 50 games)
2. Select sport (e.g., Baseball)
3. Adjust coefficients
4. Compare results
5. Export to CSV for analysis

### Tournament Day Updates

1. Connect to Supabase
2. Load event
3. See current rankings
4. Save calculation with notes
5. Repeat after each round

### Comparing Sports

1. Generate Baseball dataset
2. Note RPI values
3. Generate Basketball dataset (same size)
4. Compare RPI distributions
5. Understand formula differences

---

## Keyboard Shortcuts

None currently implemented, but planned:
- `Cmd/Ctrl + K`: Focus search
- `Cmd/Ctrl + E`: Export CSV
- `R`: Reset coefficients
- `S`: Save calculation

---

## Performance Tips

### Large Datasets (500+ teams)

- Use "Generate Dataset" instead of manual entry
- Calculations happen instantly (optimized algorithm)
- Export large results to CSV for external analysis

### Supabase Connections

- Events are cached (no re-fetch needed)
- Switching events is fast
- Historical calculations use batch inserts

### Browser Performance

- Modern browsers handle 1000+ teams easily
- Table virtualization (future enhancement)
- Export to reduce memory usage

---

## Next Steps

- [Learn about RPI Formula](rpi-formula.md)
- [Explore Sport-Specific Features](sport-specific-rpi.md)
- [Set up Database Admin](database-admin-interface.md)
- [Generate Large Datasets](generate-dataset-sport-selection.md)

---

## Troubleshooting

See: [Troubleshooting Guide](troubleshooting.md)

**Common Issues**:
- Supabase connection fails → Check credentials and RLS policies
- RPI values seem wrong → Verify coefficient settings
- Table empty → Ensure minimum games requirement met
- Export not working → Check browser download settings

