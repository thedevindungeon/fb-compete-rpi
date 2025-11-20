# DBA Page - Environment Health & Debugging Features

## Overview

The DBA (Database Admin) page now includes comprehensive environment health monitoring, debugging data, and developer tools to make development super easy and efficient.

## 🎯 Key Features

### 1. **Quick Stats Dashboard**
**Location**: Top of the page  
**File**: `components/dba-quick-stats.tsx`

Displays at-a-glance statistics:
- 📅 **Total Events** - Number of events in the database
- 👥 **Total Teams** - Number of teams across all events
- 🏆 **Total Matches** - Total match records
- ⚡ **Total Sports** - Number of configured sports
- 📊 **Avg Teams/Event** - Average team count per event
- 📈 **Recent RPI Runs** - RPI calculations in last 30 days

**Benefits**:
- Instant data overview
- No need to query tables manually
- Color-coded cards for visual clarity

---

### 2. **Environment Health Monitor**
**Location**: Below quick stats  
**File**: `components/dba-environment-health.tsx`  
**API**: `/api/admin/health`

#### Always-Visible Quick Stats
- ✅ **Connection Status** - Green/Yellow/Red indicator
- 🖥️ **Environment Badge** - Local (blue), Staging (yellow), Production (red)
- 📡 **Latency** - Response time in milliseconds with color coding
  - <50ms: Green (Excellent)
  - 50-150ms: Yellow (Good)
  - >150ms: Red (Poor)
- 👥 **Active Connections** - Current/Max connection pool usage
- 💾 **Database Size** - Total database size
- ⏱️ **Uptime** - Database uptime

#### Expandable Details (Click to expand)

**Performance Metrics**:
- **Avg Query Time** - Average query execution time
- **Cache Hit Rate** - Percentage of queries served from cache
- **Index Efficiency** - How often indexes are used vs table scans

**Tables Overview**:
- List of all tables in `fb_compete` schema
- Row count for each table
- Size information
- Scrollable list for many tables

**Insights & Recommendations**:
- 🔴 **Errors** - Critical issues requiring immediate attention
- 🟡 **Warnings** - Performance concerns or high resource usage
- 🔵 **Info** - General information and tips

Example insights:
- "✓ Excellent latency (32ms). Connection performing optimally."
- "🔧 Local development environment. Safe to experiment and test."
- "⚠️ Connected to PRODUCTION. Changes affect live data. Use caution."
- "📊 Found 15 tables with 42,384 total rows."
- "📈 2 large table(s) (>100K rows): compete_team_results, compete_teams"

**Connection Details**:
- Project reference/URL
- PostgreSQL version
- Last update timestamp

#### Auto-Refresh Feature
- Toggle auto-refresh (⚡ button)
- Refreshes every 10 seconds when enabled
- Manual refresh button (🔄)

---

### 3. **Developer Tools Panel**
**Location**: Below environment health  
**File**: `components/dba-dev-tools.tsx`

#### Connection Details
- **Project Ref** - Supabase project identifier
- **Local Port** - Port number (for local instances)
- Copy buttons for quick access

#### Environment Variables
Pre-formatted environment variables with copy buttons:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

#### Quick Commands
One-click copy for common development commands:

**Local Development**:
```bash
# Connect via psql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts

# View logs
supabase logs
```

**Production/Staging**:
```bash
# Connect via psql (remote)
psql "postgresql://postgres:[password]@db.PROJECT_REF.supabase.co:5432/postgres"

# View remote logs
supabase logs --project-ref PROJECT_REF
```

#### API Endpoints Reference
Complete list of available API routes with:
- HTTP method (GET/POST/PUT/DELETE)
- Endpoint path
- Description

Example:
```
GET    /api/admin/health        Health check
GET    /api/admin/quick-stats   Quick statistics
GET    /api/admin/:table        Fetch table data
POST   /api/admin/:table        Create record
PUT    /api/admin/:table        Update record
DELETE /api/admin/:table        Delete record
```

#### Useful Links (Remote only)
Quick access to Supabase dashboard:
- **Dashboard** - Main project dashboard
- **SQL Editor** - Run custom SQL queries
- **Logs** - View PostgreSQL logs

---

## 🎨 Visual Design

### Color Coding
- **Local**: Blue - Safe to experiment
- **Staging**: Yellow - Test thoroughly
- **Production**: Red - Use caution

### Status Indicators
- ✅ Green: Healthy/Good
- ⚠️ Yellow: Warning/Monitor
- ❌ Red: Error/Critical

### Collapsible Sections
All panels are collapsible to save screen space:
- Quick stats: Always visible (compact)
- Environment health: Collapsible with quick stats always visible
- Dev tools: Collapsed by default

---

## 📊 Health Score Calculation

The system calculates an overall health score (0-100):

**Starting Score**: 100

**Deductions**:
- Connection error: -30
- High latency (>200ms): -10
- Very high latency (>500ms): -20 total
- Each error insight: -20
- Each warning insight: -10

**Score Interpretation**:
- 90-100: 🟢 Excellent (Green)
- 70-89: 🟡 Good (Yellow)
- 0-69: 🔴 Needs Attention (Red)

---

## 🚀 Development Workflow

### Typical Usage

1. **Open Admin Page** → `/admin/events`
   - Automatically connects using saved credentials

2. **Check Quick Stats**
   - See data overview at a glance
   - Verify tables have data

3. **Monitor Environment Health**
   - Ensure you're connected to the right environment
   - Check latency and connection status
   - Review insights for any issues

4. **Use Dev Tools** (as needed)
   - Copy connection strings
   - Run quick commands
   - Access Supabase dashboard

5. **Work with Data**
   - Browse/edit/delete records
   - Use pagination for large datasets
   - Search and filter data

---

## 🔧 Technical Details

### API Endpoints

#### Health Check: `/api/admin/health`
**Headers**:
- `x-supabase-url`: Supabase URL
- `x-supabase-key`: Supabase anon key

**Response**:
```json
{
  "connection": {
    "status": "connected",
    "url": "https://...",
    "environment": "local",
    "latency": 42,
    "timestamp": "2025-11-19T..."
  },
  "database": {
    "version": "PostgreSQL 15.x",
    "size": "156 MB",
    "uptime": "2d 14h",
    "maxConnections": 100,
    "activeConnections": 3
  },
  "tables": [...],
  "performance": {
    "queryTime": 12.5,
    "indexEfficiency": 0.87,
    "cacheHitRate": 0.95
  },
  "insights": [...],
  "healthScore": 95
}
```

#### Quick Stats: `/api/admin/quick-stats`
**Headers**: Same as above

**Response**:
```json
{
  "totalEvents": 42,
  "totalTeams": 384,
  "totalMatches": 1247,
  "totalSports": 8,
  "recentRPIRuns": 15,
  "avgTeamsPerEvent": 9.14,
  "avgMatchesPerEvent": 29.69
}
```

### Components

| Component | Purpose | State |
|-----------|---------|-------|
| `DBAQuickStats` | Shows key metrics | Fetches on mount |
| `DBAEnvironmentHealth` | Health monitoring | Auto-refresh option |
| `DBADevTools` | Developer utilities | Collapsible |

---

## 💡 Tips & Best Practices

### For Development
1. **Enable Auto-Refresh** when actively developing
2. **Keep Health Panel Expanded** to monitor changes in real-time
3. **Use Quick Commands** to avoid typing connection strings
4. **Check Latency** if queries seem slow

### For Production
1. **Always verify environment badge** before making changes
2. **Review warnings** before bulk operations
3. **Monitor connection pool** usage during high traffic
4. **Keep Dev Tools collapsed** to avoid accidental exposure

### For Debugging
1. **Check Insights first** for automatic issue detection
2. **Compare stats** before/after operations
3. **Use psql commands** for complex queries
4. **Review table sizes** to identify bloat

---

## 🎯 Future Enhancements (Potential)

- Real-time query monitoring
- Slow query log viewer
- Index usage statistics
- Table-level health scores
- Migration status tracker
- Backup/restore UI
- Performance trending graphs
- Alert threshold configuration

---

## 📝 Notes

- All health data is fetched in real-time from your Supabase instance
- No data is stored or cached between requests
- Some metrics require specific PostgreSQL extensions
- Health checks use minimal database resources
- Auto-refresh adds negligible overhead

---

## 🐛 Troubleshooting

### Health Check Fails
- Verify Supabase credentials
- Check network connectivity
- Ensure RLS policies allow access
- Review browser console for errors

### Missing Stats
- Some metrics require admin privileges
- Local instances may have limited system catalog access
- RLS policies may restrict table access

### High Latency
- Check network connection
- Verify Supabase region proximity
- Review database load
- Consider connection pooling

---

**Last Updated**: 2025-11-19  
**Version**: 1.0.0

