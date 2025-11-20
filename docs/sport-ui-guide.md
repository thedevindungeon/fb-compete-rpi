# Sport-Specific UI Guide

## Visual Overview of Sport-Specific Features

This guide shows where and how sport-specific information appears in the RPI Calculator UI.

## 1. Page Header - Sport Badge

**Location**: Top of page, next to "RPI Calculator" title

**When Visible**: Only when Supabase data is loaded (not for sample or uploaded data)

```
┌─────────────────────────────────────────────────────────────┐
│ 🧮 RPI Calculator  [⚽ Soccer]  [📊 25] [💾 supabase]      │
│                                         [collapse buttons]   │
└─────────────────────────────────────────────────────────────┘
```

**What it shows**:
- Sport icon (e.g., ⚽, 🏀, ⚾)
- Sport display name (e.g., "Soccer", "Baseball")

**Purpose**: Instantly shows which sport's data you're viewing

---

## 2. Supabase Event Selection - Sport Icons

**Location**: Supabase Connection Panel → Event List

**When Visible**: When browsing events to load

```
┌──────────────────────────────────────────────────────┐
│ Summer Tournament 2025  [⚽]                    →    │
│ 📅 Jun 15, 2025  🏆 42 matches  👥 16 teams          │
├──────────────────────────────────────────────────────┤
│ Basketball League Finals  [🏀]                  →    │
│ 📅 Jul 20, 2025  🏆 28 matches  👥 12 teams          │
├──────────────────────────────────────────────────────┤
│ Fall Baseball Series  [⚾]                      →    │
│ 📅 Sep 10, 2025  🏆 35 matches  👥 20 teams          │
└──────────────────────────────────────────────────────┘
```

**What it shows**:
- Small icon badge next to event name
- Sport-specific icon only (compact)

**Purpose**: Helps identify sport type before loading event data

---

## 3. RPI Coefficients Panel - Sport Configuration Badge

**Location**: Right sidebar, in Coefficients card header

**When Visible**: When sport is detected from Supabase data

```
┌─────────────────────────────────────────────────────┐
│ ⚙️ Coefficients  [⚽ Soccer]              [↻]       │
├─────────────────────────────────────────────────────┤
│ Min Games: [4]    DIFF Interval: [3]                │
│                                                      │
│ ▼ Core Weights                                      │
│   CLWP Coefficient: 0.90                            │
│   OCLWP Coefficient: 0.10                           │
│   OOCLWP Coefficient: 0.10                          │
│                                                      │
│ ▶ Adjustments                                       │
│ ▶ Advanced                                          │
└─────────────────────────────────────────────────────┘
```

**What it shows**:
- Sport icon + name in header
- Sport-specific default coefficients in inputs

**Purpose**: 
- Shows which sport's defaults are active
- Reset button (↻) restores sport-specific defaults
- Provides context for coefficient values

---

## 4. Rankings Table - Dynamic Columns

**Location**: Center content area, main results table

**Behavior**: Columns shown/hidden based on sport configuration

### Standard Sports (Basketball, Soccer, Football, Hockey, Baseball, Lacrosse)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Rank │ Team Name      │ G │ W │ L │ WP   │ CLWP │ OCLWP │ OOCLWP │ DIFF │ RPI │
├──────┼────────────────┼───┼───┼───┼──────┼──────┼───────┼────────┼──────┼─────┤
│  1   │ Panthers Elite │ 6 │ 5 │ 1 │ 0.83 │ 0.75 │ 0.65  │ 0.58   │ 1.2  │ 0.82│
│  2   │ Warriors Pro   │ 5 │ 4 │ 1 │ 0.80 │ 0.70 │ 0.62  │ 0.55   │ 0.8  │ 0.79│
└──────┴────────────────┴───┴───┴───┴──────┴──────┴───────┴────────┴──────┴─────┘
```

**All columns visible**: DIFF column shown

### Volleyball & Pickleball

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Rank │ Team Name      │ G │ W │ L │ WP   │ CLWP │ OCLWP │ OOCLWP │ RPI │
├──────┼────────────────┼───┼───┼───┼──────┼──────┼───────┼────────┼─────┤
│  1   │ Spikers United │ 8 │ 7 │ 1 │ 0.88 │ 0.80 │ 0.72  │ 0.65   │ 0.85│
│  2   │ Net Masters    │ 7 │ 6 │ 1 │ 0.86 │ 0.78 │ 0.70  │ 0.63   │ 0.83│
└──────┴────────────────┴───┴───┴───┴──────┴──────┴───────┴────────┴─────┘
```

**DIFF column hidden**: Set-based scoring makes DIFF less relevant
**Domination column hidden**: (future implementation) Less relevant for these sports

**Purpose**: Optimizes table for sport-specific metrics that matter

---

## 5. Reset Behavior - Sport-Aware

**Location**: Coefficients Panel → Reset button (↻)

**Sample Data**:
```
Click Reset → Toast: "Reset - default defaults restored"
Coefficients → Generic defaults (no sport context)
```

**Supabase Soccer Data**:
```
Click Reset → Toast: "Reset - Soccer defaults restored"
Coefficients → Soccer-specific defaults:
  - CLWP: 0.90
  - DIFF Coeff: 0.12
  - Domination: 0.88
  - Min Games: 4
  - DIFF Interval: 3
```

**Supabase Football Data**:
```
Click Reset → Toast: "Reset - Football defaults restored"
Coefficients → Football-specific defaults:
  - CLWP: 0.85
  - OCLWP: 0.15
  - DIFF Coeff: 0.15 (highest!)
  - Min Games: 3 (lowest!)
  - DIFF Interval: 14
```

**Purpose**: Ensures reset always returns to appropriate defaults for the sport

---

## 6. Sport Detection Flow

```
┌─────────────────────────────────────────────────────────┐
│                    START: Load Data                      │
└────────────────────────┬────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
      Sample Data              Supabase Data
            │                         │
            │                         ├─ Fetch event details
            │                         ├─ Extract sport_id
            │                         ├─ getSportConfig(sport_id)
            │                         │
      Default Config            Sport-Specific Config
            │                         │
            └────────────┬────────────┘
                         │
           ┌─────────────┴──────────────┐
           │                            │
     Display Generic UI        Display Sport-Specific UI
     - No sport badge          - Sport badge in header
     - Generic defaults        - Sport icon in coefficients
     - All columns shown       - Dynamic columns
     - Generic reset           - Sport-specific reset
           │                            │
           └─────────────┬──────────────┘
                         │
                   RPI Calculated
                         │
                 Results Displayed
```

---

## 7. Sport Comparison Example

### Loading Basketball Event

1. **Connect to Supabase** → Select event → See 🏀 icon
2. **Load data** → Header shows "[🏀 Basketball]"
3. **Coefficients panel** → Shows "[🏀 Basketball]" badge
4. **Table** → All columns visible (DIFF shown)
5. **Reset defaults** → "Basketball defaults restored"
   - DIFF Coeff: 0.10
   - DIFF Interval: 10 points
   - Min Games: 4

### Loading Volleyball Event

1. **Connect to Supabase** → Select event → See 🏐 icon
2. **Load data** → Header shows "[🏐 Volleyball]"
3. **Coefficients panel** → Shows "[🏐 Volleyball]" badge
4. **Table** → DIFF column hidden (less relevant for sets)
5. **Reset defaults** → "Volleyball defaults restored"
   - DIFF Coeff: 0.06 (lowest!)
   - DIFF Interval: 5 points
   - Min Games: 5
   - CLWP: 0.92 (highest!)

---

## 8. User Override Behavior

**Scenario**: User manually adjusts coefficients

```
1. Load Soccer data (sport detected: ⚽)
   → Active coefficients: Soccer defaults

2. User changes DIFF Coeff from 0.12 to 0.20
   → Active coefficients: User override (Soccer base + manual change)

3. User clicks Reset (↻)
   → Active coefficients: Soccer defaults restored (0.12)
   → Toast: "Reset - Soccer defaults restored"

4. User clicks "Clear Selection" on team
   → Active coefficients: Still Soccer defaults (sport doesn't change)
```

**Key Point**: Sport context persists throughout session unless data source changes

---

## 9. Responsive Design

All sport badges and icons are designed to be compact and non-intrusive:
- **Icons**: Single emoji character (⚽, 🏀, etc.)
- **Badges**: Small, `h-4` height, minimal padding
- **Colors**: Match existing UI theme (outline variant)
- **Position**: Inline with existing elements, no layout shift

---

## 10. Accessibility

- **Icons**: Always paired with text label (not standalone)
- **Tooltips**: Reset button shows sport name in tooltip
- **Screen readers**: Badge content is readable text
- **Color contrast**: Uses system theme colors (light/dark mode compatible)

---

## Summary

The sport-specific UI is designed to be:
1. **Subtle**: Doesn't dominate the interface
2. **Informative**: Clear indication of active sport
3. **Contextual**: Only shows when relevant (Supabase data)
4. **Consistent**: Uses existing UI components and patterns
5. **Helpful**: Provides context for coefficient values and table columns

