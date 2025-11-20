# Changelog

Project evolution and completed features for the RPI Calculator.

## Overview

This document tracks major features, enhancements, and fixes implemented in the project.

---

## 2025-01-19 - Documentation Reorganization

### Added
- ✅ **Comprehensive Documentation Index** (`docs/INDEX.md`)
- ✅ **Getting Started Guide** (`docs/getting-started.md`)
- ✅ **RPI Formula Explanation** (`docs/rpi-formula.md`)
- ✅ **Scripts & Tools Guide** (`docs/scripts-and-tools.md`)
- ✅ **This Changelog**
- ✅ **Troubleshooting Guide**

### Changed
- 📝 Consolidated duplicate documentation
- 📝 Removed root-level completion docs
- 📝 Organized all docs into `docs/` folder with clear navigation

### Purpose
Clean, navigable documentation structure with no duplicate information.

---

## 2025-01-19 - RPI Historical Calculations

### Added
- ✅ **Database Schema** for tracking calculations over time
  - `rpi_calculation_runs` - Metadata (coefficients, timestamp, stats)
  - `rpi_results` - Compact team rankings storage
- ✅ **Views** for easy querying
  - `v_latest_rpi_by_event` - Most recent calculations
  - `v_rpi_history` - Complete history with trends
- ✅ **Functions** for data management
  - `compare_rpi_runs()` - Compare two calculations
  - `cleanup_old_rpi_calculations()` - Data retention
- ✅ **Auto-cleanup Trigger** - Keeps last 20 calculations per event
- ✅ **TypeScript API** (`lib/rpi-history.ts`)
  - `saveRPICalculation()` - Save results
  - `getRPICalculationHistory()` - Get history
  - `getLatestRPIResults()` - Latest rankings
  - `compareRPIRuns()` - Compare runs
- ✅ **UI Component** (`SaveRPICalculationButton`)
  - Modal with history view
  - Optional notes field
  - Success/error feedback

### Storage Efficiency
- **Ultra-compact schema**: ~50 bytes per team per calculation
- **100 teams, 20 calculations**: Only ~104 KB
- **1,000 teams, 100 calculations**: Only ~5 MB
- Composite primary keys (no wasted ID columns)
- Precise DECIMAL sizing
- SMALLINT for small numbers

### Use Cases
- Track rankings throughout multi-day tournaments
- Compare different coefficient formulas
- Audit trail for tournament decisions
- Trend analysis over time

**Documentation**: [RPI Historical Calculations](rpi-historical-calculations.md)

---

## 2025-01-19 - Sport-Specific RPI Configuration

### Added
- ✅ **Sport Configuration System** (`lib/sport-config.ts`)
  - 8 sports with unique defaults
  - NCAA-compliant formulas
  - Custom formulas (Basketball, Football)
- ✅ **Sport Detection** from Supabase data
- ✅ **Sport Badges** in UI
  - Page header
  - Coefficients panel
  - Event selection list
- ✅ **Dynamic Table Columns** based on sport
  - Hide DIFF for Volleyball/Pickleball (less relevant)
  - Future: Hide domination where not applicable
- ✅ **Sport-Aware Reset** - Resets to sport-specific defaults
- ✅ **Comprehensive Tests** (`tests/sport-config.test.ts`)
  - 21 tests, all passing
  - Coefficient validation
  - Table column rules
  - Helper functions

### Sport Configurations

| Sport | Formula | DIFF Weight | Key Feature |
|-------|---------|-------------|-------------|
| ⚾ Baseball | NCAA 25-50-25 | 0.05 | Low DIFF (runs less indicative) |
| ⚽ Soccer | NCAA 25-50-25 | 0.08 | Tie handling, defensive penalty |
| 🏈 Football | Custom 35-40-25 | 0.15 | Highest DIFF (point spread crucial) |
| 🏐 Volleyball | NCAA 25-50-25 | 0.03 | Very low DIFF (set-based) |
| 🏀 Basketball | Custom 90-10-10 | 0.10 | Your record matters most |
| 🏒 Hockey | Similar to Soccer | 0.08 | Goal-based, ties possible |
| 🥍 Lacrosse | Hybrid 30-45-25 | 0.10 | Balanced approach |
| 🏓 Pickleball | Similar to Volleyball | 0.02 | Lowest DIFF (game-based) |

### Benefits
- ✅ Realistic sport-specific calculations
- ✅ NCAA compliance for applicable sports
- ✅ Better demo/training capabilities
- ✅ Context-aware UI

**Documentation**: 
- [Sport-Specific RPI](sport-specific-rpi.md)
- [Sport UI Guide](sport-ui-guide.md)
- [NCAA Formula Compliance](ncaa-formula-compliance.md)

---

## 2025-01-19 - Database Admin Interface

### Added
- ✅ **Compact CRUD Interface** (`/app/admin/database/page.tsx`)
  - Events management
  - Teams management
  - Sports management
- ✅ **Access from Supabase Modal** - "Admin" button
- ✅ **Features**
  - Tab-based table switching
  - Real-time search/filter
  - Inline edit/delete actions
  - Modal dialogs for forms
  - Confirmation dialogs
  - Success/error feedback
- ✅ **Compact Design**
  - Dense tables (small padding)
  - Inline actions (no extra rows)
  - Truncated text (max 200px)
  - Minimal spacing

### Security
- Uses anon key (limited by RLS)
- No authentication (development only)
- Production recommendations included

### Performance
- Only loads active tab data
- Limits to 100 records per fetch
- Client-side search (no server calls)
- Minimal re-renders

**Documentation**: [Database Admin Interface](database-admin-interface.md)

---

## 2025-01-19 - Database Sports Structure

### Added
- ✅ **Professional Database Schema** for sports
  - Moved from hardcoded TypeScript to database
  - `fb_compete.sports` table with 8 sports
  - RPI coefficients stored per sport
  - Display configuration (icons separated!)
  - Scoring terminology
- ✅ **Database View** (`v_events_with_sport`)
  - Easy querying of events with sport config
- ✅ **Foreign Key Constraints**
  - `compete_event_details.sport_id` → `sports.id`
  - Prevents orphaned data
- ✅ **TypeScript Hook** (`hooks/use-sports.ts`)
  - Fetch sports from database
  - Fallback to hardcoded config if DB unavailable
- ✅ **Migrations**
  - `20250119100001_alter_sports_table_add_columns.sql`
  - `20250119100002_populate_sports_data.sql`
  - `20250119100003_create_sports_view.sql`

### Why Icons are Separate
- Easier updates
- Better git diffs
- No encoding issues
- Future flexibility (can use image URLs)

### Benefits
- ✅ Professional structure
- ✅ Easy maintenance (update via SQL)
- ✅ Flexible (icons separate from logic)
- ✅ Robust (foreign keys ensure integrity)
- ✅ Backward compatible (fallback to code)

**Documentation**: [Database Sports Structure](database-sports-structure.md)

---

## 2025-01-19 - Generate Dataset Sport Selection

### Added
- ✅ **Sport Selector** in Generate Dataset UI
  - Dropdown with all 8 sports
  - Sport icon + name display
  - Defaults to Basketball
- ✅ **Sport Context Persistence**
  - Sport badges appear after generation
  - Sport-specific coefficients applied
  - Sport-specific table columns

### Benefits
- ✅ Realistic testing without Supabase
- ✅ Demo sport-specific formulas
- ✅ Generate sport-appropriate data
- ✅ Quick exploration for new users

**Documentation**: [Generate Dataset Sport Selection](generate-dataset-sport-selection.md)

---

## 2025-01-19 - Sport ID Fixes

### Added
- ✅ **Analysis Script** (`analyze-sport-ids.ts`)
  - Detect incorrect sport IDs
  - Dry run (no changes)
- ✅ **Auto-Fix Script** (`fix-sport-ids.ts`)
  - Detect sport from event name keywords
  - Update database with confirmation
- ✅ **Interactive Fixer** (`interactive-sport-fixer.ts`)
  - Manual sport assignment for generic names
- ✅ **Match Pattern Detection** (`detect-sport-from-matches.ts`)
  - Analyze scoring patterns to detect sport

### Issues Fixed
- ✅ Event 31: "Soccer Showcase" was Football → Fixed to Soccer
- ✅ 15 events with generic names identified for review
- ✅ Scripts created for future maintenance

### Lessons Learned
- Many events have intentionally generic names
- Sport is encoded in event structure/numbering, not name
- Always verify before auto-fixing

**Documentation**: [Scripts & Tools](scripts-and-tools.md)

---

## Earlier - Core RPI Calculator

### Initial Implementation
- ✅ **Next.js 16** with App Router
- ✅ **TypeScript** for type safety
- ✅ **RPI Calculation Engine** (`lib/rpi-calculator.ts`)
  - CLWP (Competitive Level Winning Percentage)
  - OCLWP (Opponent CLWP)
  - OOCLWP (Opponent's Opponent CLWP)
  - DIFF (Points Differential)
  - Domination bonus for 8+ win streaks
- ✅ **Responsive UI**
  - Tailwind CSS v4
  - Shadcn UI components
  - Mobile-friendly layout
- ✅ **Data Management**
  - Sample data (10 teams)
  - Supabase integration
  - TanStack Query for caching
  - JSON file upload
- ✅ **Export Functionality**
  - CSV export
  - JSON export
- ✅ **Comprehensive Testing**
  - Vitest configuration
  - 30+ tests, 100% passing
  - TDD approach

**Documentation**: [Getting Started](getting-started.md), [RPI Formula](rpi-formula.md)

---

## Version History

| Version | Date | Key Features |
|---------|------|--------------|
| **1.0.0** | 2025-01-19 | Complete documentation, historical tracking, sport-specific RPI, database admin |
| **0.9.0** | 2025-01-18 | Sport configuration database migration |
| **0.8.0** | 2025-01-17 | Generate dataset with sport selection |
| **0.7.0** | 2025-01-16 | Sport-specific RPI configurations |
| **0.6.0** | 2025-01-15 | Database admin interface |
| **0.5.0** | 2025-01-14 | Large dataset generation |
| **0.4.0** | 2025-01-13 | Supabase integration |
| **0.3.0** | 2025-01-12 | Export functionality |
| **0.2.0** | 2025-01-11 | Coefficient adjustment UI |
| **0.1.0** | 2025-01-10 | Core RPI calculator |

---

## Roadmap

### In Progress
- [ ] Documentation website (separate from app)
- [ ] Dark mode optimization
- [ ] Mobile UX improvements

### Planned Features
- [ ] Chart visualizations (team trends, RPI distribution)
- [ ] Head-to-head comparison view
- [ ] What-if scenarios (predict impact of future games)
- [ ] Bulk data import (CSV)
- [ ] Advanced filtering (by division, region, etc.)
- [ ] Scheduled auto-calculations
- [ ] Email notifications for rank changes
- [ ] Multi-tenant support
- [ ] Custom branding per organization

### Performance Enhancements
- [ ] Virtual scrolling for 1000+ teams
- [ ] Web Workers for calculations
- [ ] Service Worker for offline support
- [ ] Memoization optimization
- [ ] Progressive data loading

### Database Improvements
- [ ] Audit logging
- [ ] User authentication
- [ ] Role-based permissions
- [ ] Multi-event comparison queries
- [ ] Historical trend analysis functions

---

## Breaking Changes

None yet! The application maintains backward compatibility:
- ✅ Sample data still works
- ✅ JSON uploads still work
- ✅ Existing Supabase connections work
- ✅ Coefficient overrides work
- ✅ Falls back to hardcoded configs if DB unavailable

---

## Contributors

Internal development team.

---

## Acknowledgments

- **NCAA** - RPI formula standards
- **Shadcn UI** - Component library
- **Supabase** - Database platform
- **Vercel** - Next.js framework
- **TanStack** - Query library

---

**Last Updated**: 2025-01-19  
**Current Version**: 1.0.0

