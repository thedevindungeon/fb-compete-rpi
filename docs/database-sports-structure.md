# Sports Database Structure

## Overview

The sports configuration has been moved from hardcoded TypeScript to a professional database structure. This provides:
- ✅ **Centralized Configuration**: All sport settings in one place
- ✅ **Separated Concerns**: Emoji icons stored separately for flexibility
- ✅ **Robust Structure**: Foreign key constraints ensure data integrity
- ✅ **Easy Updates**: Modify sport settings via SQL without code changes
- ✅ **Backward Compatible**: Falls back to hardcoded config if DB unavailable

## Database Structure

### Core Table: `fb_compete.sports`

```sql
CREATE TABLE fb_compete.sports (
  id INTEGER PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  icon VARCHAR(10),  -- Emoji stored separately!
  slug VARCHAR(50) UNIQUE,
  
  -- RPI Configuration
  default_clwp_coeff DECIMAL(4,3) DEFAULT 0.250,
  default_oclwp_coeff DECIMAL(4,3) DEFAULT 0.500,
  default_ooclwp_coeff DECIMAL(4,3) DEFAULT 0.250,
  default_diff_coeff DECIMAL(4,3) DEFAULT 0.100,
  default_domination_coeff DECIMAL(4,3) DEFAULT 1.000,
  default_clgw_step DECIMAL(4,3) DEFAULT 0.050,
  default_clgl_step DECIMAL(4,3) DEFAULT 0.100,
  default_min_games INTEGER DEFAULT 3,
  default_diff_interval INTEGER DEFAULT 10,
  
  -- Scoring Terminology
  points_term VARCHAR(20) DEFAULT 'points',
  score_term VARCHAR(20) DEFAULT 'score',
  
  -- Display Configuration
  show_diff BOOLEAN DEFAULT TRUE,
  show_domination BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### View: `fb_compete.v_events_with_sport`

Convenient view that joins events with their sport configuration:

```sql
SELECT * FROM fb_compete.v_events_with_sport
WHERE sport_id = 5  -- Basketball
LIMIT 1;
```

Returns everything you need: event info + sport config + icon.

## Sport IDs

| ID | Sport | Icon | Name | RPI Formula |
|----|-------|------|------|-------------|
| 1 | Baseball | ⚾ | `baseball` | 25-50-25 (NCAA) |
| 2 | Soccer | ⚽ | `soccer` | 25-50-25 (NCAA) |
| 3 | Football | 🏈 | `football` | 35-40-25 (Custom) |
| 4 | Volleyball | 🏐 | `volleyball` | 25-50-25 (NCAA) |
| 5 | Basketball | 🏀 | `basketball` | 90-10-10 (Custom) |
| 6 | Hockey | 🏒 | `hockey` | 25-50-25 |
| 7 | Lacrosse | 🥍 | `lacrosse` | 30-45-25 (Hybrid) |
| 8 | Pickleball | 🏓 | `pickleball` | 25-50-25 |

## Why Icons are Separate

**Problem**: Emojis in code can cause encoding issues, git diffs, and rendering problems.

**Solution**: Store icon in separate column:
- Easy to update without touching coefficients
- Can swap to image URLs later if needed
- Better for internationalization
- Cleaner code separation

## Usage in Code

### TypeScript Hook

```typescript
import { useSports, useSport } from '@/hooks/use-sports'

// Get all sports
const { data: sports } = useSports(supabaseUrl, supabaseKey)

// Get single sport
const { data: sport } = useSport(sportId, supabaseUrl, supabaseKey)
```

### Fallback Strategy

1. Try to fetch from database
2. If DB unavailable, use hardcoded config from `lib/sport-config.ts`
3. Never breaks even if DB is down

### Component Example

```typescript
const { data: sports, isLoading } = useSports(supabaseUrl, supabaseKey)

if (isLoading) return <Loading />

return sports?.map(sport => (
  <div key={sport.id}>
    <span>{sport.icon}</span> {sport.display_name}
  </div>
))
```

## Updating Sport Configuration

### Via SQL

```sql
-- Update Basketball RPI formula
UPDATE fb_compete.sports
SET 
  default_clwp_coeff = 0.85,
  default_oclwp_coeff = 0.15,
  description = 'Updated formula for 2025 season'
WHERE id = 5;
```

### Via Supabase Studio

1. Open: http://127.0.0.1:54323
2. Navigate to: Table Editor → fb_compete → sports
3. Edit any row
4. Changes reflect immediately in app

## Migrations

Applied migrations:
1. `20250119100001_alter_sports_table_add_columns.sql` - Add new columns
2. `20250119100002_populate_sports_data.sql` - Populate with data
3. `20250119100003_create_sports_view.sql` - Create convenience view

## Data Integrity

- ✅ Foreign key from `compete_event_details.sport_id` → `sports.id`
- ✅ Cannot delete sports if events reference them
- ✅ Unique constraints on `name` and `slug`
- ✅ Auto-update `updated_at` on changes

## Benefits

1. **Professional**: Industry-standard database structure
2. **Maintainable**: Update without code changes
3. **Flexible**: Icons separate from logic
4. **Scalable**: Easy to add new sports
5. **Auditable**: Tracks when sports were modified
6. **Safe**: Foreign keys prevent orphaned data

## Example Queries

### Get all active sports with their events count

```sql
SELECT 
  s.id,
  s.display_name,
  s.icon,
  COUNT(ced.event_id) as event_count
FROM fb_compete.sports s
LEFT JOIN fb_compete.compete_event_details ced ON s.id = ced.sport_id
WHERE s.is_active = true
GROUP BY s.id, s.display_name, s.icon
ORDER BY s.sort_order;
```

### Find events missing sport assignment

```sql
SELECT e.id, e.name
FROM public.events e
LEFT JOIN fb_compete.compete_event_details ced ON e.id = ced.event_id
WHERE ced.sport_id IS NULL;
```

### Get sport configuration for specific event

```sql
SELECT *
FROM fb_compete.v_events_with_sport
WHERE event_id = 31;
```

## Notes

- Icon column allows NULL for future flexibility (e.g., custom icons)
- RPI coefficients use DECIMAL(4,3) for precise calculations
- `slug` field enables SEO-friendly URLs
- `sort_order` controls display order in UI
- Descriptions document the rationale for each formula

