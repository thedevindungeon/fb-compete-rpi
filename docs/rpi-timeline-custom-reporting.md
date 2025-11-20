# RPI Historical Timeline & Custom Reporting

## Overview

The RPI Historical Timeline is a comprehensive reporting and analysis system that allows you to track RPI changes over time with advanced filtering and custom reporting capabilities.

**Access**: `/admin/rpi/timeline`

## Features

### Two View Modes

#### 1. Timeline View
- **Chronological layout** with date badges and connecting lines
- Each date entry displays:
  - Average RPI for that day
  - Maximum and minimum RPI values
  - Range (max - min)
  - Count of calculations
  - Top 5 teams with their RPI values
- Perfect for:
  - Seeing overall trends over time
  - Comparing multiple dates
  - Identifying calculation patterns
  - Daily performance snapshots

#### 2. Comparison View
- **Team-specific progress tracking**
- Requires team selection from filter
- Displays:
  - Team name and location
  - Total calculations tracked
  - Overall change (±0.1234)
  - Percentage change (±12.34%)
  - Trend direction (up/down arrows)
  - First vs Latest comparison cards
  - Full historical record list with changes
- Perfect for:
  - Tracking individual team progress
  - Identifying improvement/decline
  - Comparing first vs latest
  - Spotting calculation anomalies

### Comprehensive Filtering System

#### Date Range Filter
- **All Time**: Show all historical data
- **Last 7 Days**: Week view
- **Last 30 Days**: Month view (default)
- **Last 90 Days**: Quarter view

#### Sport Filter
- All Sports (default)
- Individual sport selection
- Auto-populated from your data

#### Team Filter
- All Teams (default)
- Individual team selection
- Shows team names (not just IDs)
- Up to 100 teams in dropdown

#### Event Filter
- All Events (default)
- Filter by specific event
- Shows event names
- Up to 50 events in dropdown
- Filters RPI data by event's sport

#### Search
- Search by Team ID
- Search by Team Name
- Real-time filtering

#### Additional Toggles
- **Active Only / All Records**: Toggle to include inactive records
- **Timeline / Comparison**: Switch between view modes

### Stats Overview

Five real-time stat cards always visible at the top:

1. **Total Records**: Count of filtered results
2. **Avg RPI**: Average across filtered data
3. **Max RPI**: Highest value (green)
4. **Min RPI**: Lowest value (red)
5. **Range**: Max - Min spread

Stats update dynamically as you filter!

### Export & Reporting

#### CSV Export
- Button in top-right of filters panel
- Exports all filtered data
- Includes columns:
  - Date
  - Team ID
  - Team Name
  - Sport ID
  - RPI Value
  - Active (Yes/No)
  - Generated At (ISO timestamp)
- Filename: `rpi-timeline-YYYY-MM-DD.csv`
- Opens in Excel/Google Sheets

#### Use Cases
- Custom analysis in Excel
- Share reports with coaches
- Archive historical data
- Create charts/graphs externally
- Import into other tools

## Navigation

### From Main RPI Page
1. Click "Timeline" button in header (next to environment badges)
2. Credentials passed automatically via URL params

### From Timeline Page
- Click "Back to RPI" to return to main RPI page
- Click "Back to DBA" (if no credentials) to go to admin page

### Direct URL
```
/admin/rpi/timeline?url=<supabase_url>&key=<supabase_key>
```

## Workflows

### Workflow 1: Daily Monitoring
1. Open Timeline view
2. Set date range to "Last 7 Days"
3. Review daily calculation summaries
4. Check for anomalies in stats

### Workflow 2: Team Progress Report
1. Switch to Comparison view
2. Select specific team from filter
3. Review overall change and percentage
4. Examine historical records list
5. Export to CSV for sharing

### Workflow 3: Sport-Specific Analysis
1. Select sport from filter
2. Set date range (e.g., "Last 30 Days")
3. Review timeline entries
4. Compare top teams across dates
5. Export filtered data

### Workflow 4: Event Reporting
1. Select event from filter
2. View RPI calculations for that event's sport
3. Check top performers on each date
4. Export for event organizers

### Workflow 5: Quality Assurance
1. Include inactive records (toggle)
2. Search for specific team
3. Review all calculations
4. Identify duplicate or erroneous entries

## Filter Combinations

### Example 1: "Last week's football rankings"
- Date: Last 7 Days
- Sport: Football
- Active: Active Only
- View: Timeline

### Example 2: "Team Alpha's season progress"
- Date: All Time
- Team: Team Alpha
- Active: All Records
- View: Comparison

### Example 3: "Basketball tournament trends"
- Date: Last 30 Days
- Sport: Basketball
- Event: [Specific Tournament]
- View: Timeline

### Example 4: "All calculations this month"
- Date: Last 30 Days
- Sport: All Sports
- Active: All Records
- View: Timeline

## Technical Details

### Data Sources
- **RPI Data**: `team_rpi` table (up to 10,000 records)
- **Team Info**: `teams` table (for team names)
- **Event Info**: `compete_event_details` table (for event names)

### API Endpoints Used
- `/api/admin/rpi` - Fetch RPI data
- `/api/admin/teams` - Fetch team info
- `/api/admin/events` - Fetch event info

### Performance
- **Client-side filtering**: All filtering happens in the browser
- **Instant updates**: No API calls when changing filters
- **Auto-recalculation**: Stats update automatically
- **No lag**: Efficient React memoization

### Smart Features

#### 1. Multi-table Data Fetching
- Fetches RPI data, team info, and event info in parallel
- Joins data intelligently on the client side
- Displays team names instead of just IDs

#### 2. Real-time Filtering
- All filtering happens client-side
- Instant updates, no API calls
- Stats recalculate automatically
- No performance lag

#### 3. Intelligent Grouping
- Groups RPI records by date
- Calculates stats per date
- Sorts chronologically (newest first)
- Shows top 5 teams per date

#### 4. Change Tracking
- Calculates change between consecutive records
- Shows percentage change
- Visual trend indicators (up/down arrows)
- Color-coded positive/negative changes

#### 5. Credential Management
- Reads from URL params first
- Falls back to localStorage
- Passes credentials on navigation
- Maintains connection state

## Visual Design

### Timeline Design
- Blue circular date badges (day number)
- Vertical connecting lines between dates
- Card-based entry layout
- Color-coded stats (green max, red min)
- Hover effects on team list

### Comparison Design
- Large trend indicators (up/down arrows)
- Color-coded changes (green up, red down)
- Side-by-side comparison cards
- Timeline-style records list
- Monospace font for precise numbers

### Responsive Layout
- Grid adapts to screen size
- Mobile-friendly filters
- Scroll areas for long content
- Compact spacing

## Use Cases by Role

### For Coaches
- Track team improvement over time
- Compare performance across dates
- Export reports for players/parents
- Identify when RPI changed significantly

### For Admins
- Monitor calculation frequency
- Verify data consistency
- Identify outliers or errors
- Generate historical reports

### For Developers
- Debug RPI calculation logic
- Validate algorithm changes
- Analyze performance patterns
- Export for external analysis

### For Analysts
- Custom date range analysis
- Sport-specific trends
- Multi-dimensional filtering
- CSV export for advanced tools

## Troubleshooting

### No Data Showing
- Check that you're connected to Supabase
- Verify RPI calculations have been run
- Try changing filters (date range, sport, etc.)
- Click "Refresh" button

### Comparison View Empty
- Ensure a team is selected from the filter
- Check that the team has at least 2 RPI records
- Try expanding the date range

### Export Not Working
- Ensure there's data visible (filtered results > 0)
- Check browser pop-up blocker settings
- Try a different browser if issues persist

### Slow Performance
- Reduce date range to load less data
- Use specific filters (sport, team) to narrow results
- Close other browser tabs
- Refresh the page

## File Structure

```
app/
  admin/
    rpi/
      timeline/
        page.tsx          # Main timeline page component
      page.tsx            # Main RPI page (with Timeline button)
api/
  admin/
    rpi/
      route.ts            # RPI data API endpoint
    teams/
      route.ts            # Teams data API endpoint
    events/
      route.ts            # Events data API endpoint
docs/
  rpi-timeline-custom-reporting.md  # This file
```

## Related Documentation

- [RPI Formula](./rpi-formula.md) - How RPI is calculated
- [RPI Historical Calculations](./rpi-historical-calculations.md) - Historical calculation system
- [Sport-Specific RPI](./sport-specific-rpi.md) - Sport-specific adjustments
- [DBA Debugging Features](./dba-debugging-features.md) - Database admin debugging tools

## Future Enhancements

Potential features for future development:

- **Visual Charts**: Line/bar charts for trends
- **Head-to-Head**: Compare two teams side-by-side
- **Percentile Rankings**: Show team percentile
- **Historical Snapshots**: Save report configurations
- **Email Reports**: Schedule automated reports
- **PDF Export**: Generate formatted PDF reports
- **Advanced Analytics**: Standard deviation, quartiles
- **Custom Date Range**: Pick specific start/end dates
- **Bulk Export**: Export multiple sports/teams at once
- **Real-time Updates**: WebSocket for live data

