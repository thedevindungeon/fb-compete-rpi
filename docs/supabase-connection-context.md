# Supabase Connection Context System

## Overview

The Supabase Connection Context ensures that database connection details (URL, anon key, selected event) are consistently available throughout the entire application, from the main connection panel to the admin interface.

## Architecture

### Context Provider

**File**: `contexts/supabase-connection-context.tsx`

The context provider wraps the entire application and manages:
- Supabase URL
- Supabase anon key
- Selected event ID
- Selected event name
- Connection timestamp

### Storage Strategy

The context uses a **three-tier storage system**:

1. **React Context** - In-memory state for immediate access
2. **localStorage** - Persistent storage that survives page refreshes
3. **URL Parameters** - For explicit connection sharing (opens in new tab)

## Implementation

### 1. Provider Setup

The provider is added to the root layout:

```tsx
// app/layout.tsx
<SupabaseConnectionProvider>
  <TooltipProvider>
    {children}
  </TooltipProvider>
</SupabaseConnectionProvider>
```

### 2. Using the Context

Any component can access the connection state:

```tsx
import { useSupabaseConnection } from '@/contexts/supabase-connection-context'

function MyComponent() {
  const { url, key, eventId, eventName, isConnected } = useSupabaseConnection()
  
  // Use the connection details...
}
```

### 3. Setting the Connection

When a user connects in the main panel:

```tsx
const { setConnection } = useSupabaseConnection()

// Save connection with optional event details
setConnection(supabaseUrl, supabaseKey, eventId, eventName)
```

### 4. Updating the Event

When a user selects a different event:

```tsx
const { updateEvent } = useSupabaseConnection()

// Update just the event while keeping the same connection
updateEvent(eventId, eventName)
```

### 5. Clearing the Connection

When disconnecting:

```tsx
const { clearConnection } = useSupabaseConnection()

// Clear all connection data
clearConnection()
```

## Data Flow

### Connection Flow

```
User enters credentials in SupabaseConnectionPanel
    ↓
saveConnection() called
    ↓
Updates localStorage + Context
    ↓
Context available app-wide
    ↓
Admin page can access via useSupabaseConnection()
```

### Event Selection Flow

```
User selects event in SupabaseConnectionPanel
    ↓
handleEventSelect() called
    ↓
updateEvent() updates context
    ↓
Context available app-wide
    ↓
Admin page shows selected event badge
```

### Page Navigation Flow

```
User clicks "Admin" button in connection panel
    ↓
Opens /admin/events?url=...&key=... in new tab
    ↓
Admin page loads and checks:
  1. URL parameters (highest priority)
  2. Context state (from provider)
  3. localStorage (fallback)
    ↓
Whichever is available first is used
    ↓
Context is updated with URL params if present
```

## Cross-Tab Synchronization

The context listens for `storage` events to detect changes in other tabs:

```tsx
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      // Update context from localStorage change
      // This syncs state across tabs!
    }
  }
  
  window.addEventListener('storage', handleStorageChange)
}, [])
```

**Benefits**:
- Connect in one tab, automatically available in others
- Disconnect in one tab, all tabs reflect the change
- Select event in one tab, all tabs see the selection

## Connection State Lifetime

### Automatic Expiry

Connections expire after **7 days** to ensure:
- Stale credentials don't linger
- Security best practice
- Users reconnect with fresh tokens

### Manual Clear

Users can manually disconnect:
- "Disconnect" button in connection panel
- Clears both localStorage and context
- Resets app to initial state

## Component Integration

### SupabaseConnectionPanel

**Location**: Main page
**Responsibilities**:
- Collect connection credentials
- Test connection
- Save to context on success
- Update context when event selected
- Clear context on disconnect

**Key Methods**:
```tsx
saveConnection(url, key, eventId, eventName) // After successful connection
updateEvent(eventId, eventName)             // When event selected
clearConnection()                            // On disconnect
```

### AdminTablePage

**Location**: `/admin/[table]`
**Responsibilities**:
- Read connection from context
- Fallback to URL params
- Display current event badge
- Use credentials for API calls

**Priority Order**:
1. URL parameters (explicit, highest priority)
2. Context state (from provider)
3. localStorage (fallback, shouldn't be needed)

## Visual Indicators

### Connection Panel

- **Auto-connected** badge when restoring from localStorage
- **Connected** status when successfully connected
- **Event name** shown in selection preview

### Admin Page

- **Project ref** badge in header (e.g., "xyz.supabase.co")
- **Event name** badge when an event is selected
- **Event name** in subtitle text
- **Environment badge** (Local/Staging/Production)

Example:
```
┌─────────────────────────────────────────┐
│ [← Back]  Database Admin                │
│           fb_compete.events              │
│           • Event: Soccer Tournament     │
│                                          │
│                    [Soccer Tournament]   │
│                    [xyz.supabase.co]     │
└─────────────────────────────────────────┘
```

## Benefits

### For Users

✅ **Seamless Experience** - Connect once, works everywhere  
✅ **Persistent State** - Survives page refreshes  
✅ **Cross-Tab Sync** - Changes sync across browser tabs  
✅ **Visual Feedback** - Always know what's connected  
✅ **Easy Navigation** - Jump between main app and admin  

### For Developers

✅ **Single Source of Truth** - No duplicate state management  
✅ **Type-Safe** - Full TypeScript support  
✅ **Easy to Use** - Simple hook-based API  
✅ **Automatic Cleanup** - Handles expiry and clearing  
✅ **Debug Friendly** - Clear data flow  

## API Reference

### Context Type

```typescript
type SupabaseConnectionContextType = {
  url: string | null
  key: string | null
  eventId: number | null
  eventName: string | null
  isConnected: boolean
  setConnection: (url: string, key: string, eventId?: number | null, eventName?: string | null) => void
  clearConnection: () => void
  updateEvent: (eventId: number, eventName: string) => void
}
```

### Storage Format

```typescript
type SupabaseConnectionState = {
  url: string
  key: string
  eventId: number | null
  eventName: string | null
  timestamp: number
}
```

Stored in localStorage as:
```json
{
  "url": "https://xyz.supabase.co",
  "key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "eventId": 42,
  "eventName": "Soccer Tournament",
  "timestamp": 1732032000000
}
```

## Error Handling

### Connection Failures

If connection restoration fails on page load:
1. Context clears the stored state
2. User is prompted to reconnect
3. Error message explains the issue

### Expired Connections

If stored connection is > 7 days old:
1. Automatically cleared from storage
2. Context remains empty
3. User must reconnect

### Missing Context

If component tries to use context outside provider:
```
Error: useSupabaseConnection must be used within a SupabaseConnectionProvider
```

**Solution**: Ensure the provider wraps the component tree in `app/layout.tsx`

## Testing the Context

### Manual Testing Steps

1. **Connect** in main panel
   - ✅ Connection saved
   - ✅ Can navigate to admin
   - ✅ Admin shows connection

2. **Select Event** in main panel
   - ✅ Event saved to context
   - ✅ Admin shows event badge

3. **Refresh Page**
   - ✅ Connection persists
   - ✅ Event persists

4. **Open New Tab**
   - ✅ Connection available
   - ✅ Event available

5. **Disconnect**
   - ✅ All tabs clear
   - ✅ Admin prompts to connect

6. **Open Admin Directly**
   - ✅ Uses stored connection
   - ✅ Shows event if selected

## Troubleshooting

### Connection not persisting

**Problem**: Connection clears on refresh  
**Causes**:
- Browser localStorage disabled
- Private/incognito mode
- Browser clearing storage

**Solution**: Check browser settings, use normal mode

### Cross-tab not syncing

**Problem**: Changes in one tab don't reflect in others  
**Causes**:
- Different origins (http vs https)
- localStorage not shared

**Solution**: Ensure same protocol and domain

### Admin page shows "No Connection"

**Problem**: Admin can't access connection  
**Causes**:
- Opened directly without connecting first
- Connection expired
- localStorage cleared

**Solution**: 
1. Go to main page
2. Connect to Supabase
3. Return to admin page

---

**Last Updated**: 2025-11-19  
**Version**: 1.0.0

