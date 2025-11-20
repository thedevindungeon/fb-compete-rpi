# Database Admin Interface

## Overview

A compact, intuitive CRUD interface for managing database records directly from the UI. Accessible only when connected to Supabase.

## Features

### ✅ Full CRUD Operations
- **Create**: Add new records
- **Read**: Browse and search records
- **Update**: Edit existing records
- **Delete**: Remove records with confirmation

### ✅ Multi-Table Support
- Events (public.events)
- Teams (fb_compete.teams)
- Sports (fb_compete.sports)
- Easily extensible for more tables

### ✅ Compact, Intuitive UI
- Tab-based table selection
- Real-time search/filter
- Inline edit/delete actions
- Modal dialogs for forms
- Minimal, clean design

## Access

### From Supabase Connection Modal

1. Connect to Supabase
2. Click the **"Admin"** button (blue, next to "Change" and "Disconnect")
3. Opens in new tab with credentials passed via URL params

### Direct URL

```
http://localhost:3000/admin/database?url=YOUR_URL&key=YOUR_KEY
```

Or let it auto-load from localStorage if you're already connected.

## Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back    Database Admin                       [Badge: DB]  │
├─────────────────────────────────────────────────────────────┤
│  [Events] [Teams] [Sports]                  🔍 Search  [+ Add]│
├─────────────────────────────────────────────────────────────┤
│  ID │ Name          │ Date       │ ... │ Actions           │
│  1  │ Event Name    │ 2025-01-01 │ ... │ [Edit] [Delete]   │
│  2  │ Another Event │ 2025-02-01 │ ... │ [Edit] [Delete]   │
├─────────────────────────────────────────────────────────────┤
│  Showing 10 of 32 records                      [Refresh]     │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Create New Record

1. Select table tab (Events, Teams, Sports)
2. Click **"+ Add New"** button
3. Fill in the form
4. Click **"Save"**

Required fields are marked with a red asterisk (*).

### Edit Record

1. Find the record in the table
2. Click the **Edit** (pencil) button
3. Modify fields
4. Click **"Save"**

Read-only fields (like ID) are shown but cannot be edited.

### Delete Record

1. Find the record in the table
2. Click the **Delete** (trash) button
3. Confirm deletion in the dialog
4. Record is permanently removed

⚠️ **Warning**: Deletion is permanent and cannot be undone!

### Search Records

1. Type in the search box (top right)
2. Results filter automatically
3. Clear search to see all records

Search looks in key columns (e.g., name fields).

## Table Configurations

### Events Table

- **Schema**: `public.events`
- **Columns**: ID, Name, Start Date, End Date
- **Search**: By name
- **Editable**: All except ID

### Teams Table

- **Schema**: `fb_compete.teams`
- **Columns**: ID, Name, Sport ID
- **Search**: By name
- **Editable**: All except ID
- **Select**: Sport dropdown

### Sports Table

- **Schema**: `fb_compete.sports`
- **Columns**: ID, Name, Display Name, Icon, Slug, Active
- **Search**: By name or display name
- **Editable**: All except ID
- **Boolean**: Active (Yes/No dropdown)

## Adding More Tables

Edit `/app/admin/database/page.tsx` and add to `TABLE_CONFIGS`:

```typescript
{
  name: 'my_table',
  displayName: 'My Table',
  schema: 'fb_compete',
  primaryKey: 'id',
  searchColumns: ['name'],
  columns: [
    { 
      name: 'id', 
      displayName: 'ID', 
      type: 'number', 
      editable: false 
    },
    { 
      name: 'name', 
      displayName: 'Name', 
      type: 'text', 
      required: true 
    },
    // Add more columns...
  ],
}
```

### Column Types

- `text`: String input
- `number`: Number input
- `date`: Date/time picker
- `boolean`: Yes/No dropdown
- `select`: Custom dropdown (provide options)

### Column Options

```typescript
{
  name: 'column_name',
  displayName: 'Display Name',
  type: 'text' | 'number' | 'date' | 'boolean' | 'select',
  required: true,        // Red asterisk, validation
  editable: false,       // Show but don't allow editing
  options: [             // For 'select' type
    { value: 1, label: 'Option 1' },
    { value: 2, label: 'Option 2' },
  ]
}
```

## Security Considerations

### ⚠️ Important

This admin interface uses the **anon key** which has limited permissions based on your RLS policies. 

**Best Practices**:

1. **RLS Policies**: Ensure proper Row Level Security policies are in place
2. **Development Only**: Use only in development/testing environments
3. **Service Role**: For production admin, use service role key (not anon)
4. **Authentication**: Add authentication layer for production use
5. **Audit Logging**: Consider logging all admin actions

### Adding Authentication

For production, wrap the page in auth:

```typescript
// Add to page.tsx
import { useSession } from 'next-auth/react'

export default function DatabaseAdminPage() {
  const { data: session } = useSession()
  
  if (!session || !session.user.isAdmin) {
    return <div>Unauthorized</div>
  }
  
  // ... rest of component
}
```

## Performance

### Optimizations Applied

- ✅ Lazy loading (only active tab data)
- ✅ Pagination (100 records per fetch)
- ✅ Client-side search (no server round-trips)
- ✅ Optimistic UI updates
- ✅ Minimal re-renders

### Large Datasets

For tables with >1000 records, consider:

1. **Server-side search**: Move filtering to database
2. **Pagination**: Add page controls
3. **Virtual scrolling**: Render only visible rows
4. **Lazy loading**: Load on scroll

## Troubleshooting

### "No Database Connection"

- Make sure you're connected to Supabase first
- Check that URL and key are in localStorage or URL params

### "Failed to fetch"

- Check RLS policies allow SELECT
- Verify schema/table names are correct
- Check Supabase connection is active

### "Failed to save"

- Check RLS policies allow INSERT/UPDATE
- Verify all required fields are filled
- Check data types match expectations

### "Failed to delete"

- Check RLS policies allow DELETE
- Verify no foreign key constraints prevent deletion
- Check if record is referenced by other tables

## Future Enhancements

Potential additions:

- [ ] Bulk operations (import/export CSV)
- [ ] Advanced filtering (date ranges, multiple fields)
- [ ] Sorting by columns
- [ ] Column visibility toggle
- [ ] Relationship navigation (click FK to view related record)
- [ ] Audit log view
- [ ] Form validation
- [ ] Data export (JSON, CSV)
- [ ] Keyboard shortcuts
- [ ] Dark mode specific styling

## Code Structure

```
/app/admin/database/
  └── page.tsx           # Main admin page

Key Components:
  - DatabaseAdminPage    # Main component
  - TABLE_CONFIGS        # Table definitions
  - Edit Dialog          # Create/edit modal
  - Delete Dialog        # Confirmation modal
```

### Key State

```typescript
selectedTable: TableName    // Active tab
data: any[]                 // Table records
editItem: any               // Item being edited
deleteItem: any             // Item to delete
searchQuery: string         // Search filter
```

### Key Functions

```typescript
fetchData()          // Load records from DB
handleEdit(item)     // Open edit dialog
handleCreate()       // Open create dialog
handleSave()         // Save changes
handleDelete(item)   // Confirm delete
confirmDelete()      // Execute delete
```

## Keyboard Shortcuts (Future)

Planned shortcuts:

- `Cmd/Ctrl + K`: Focus search
- `Cmd/Ctrl + N`: New record
- `Esc`: Close dialog
- `Cmd/Ctrl + Enter`: Save form
- `Tab 1-5`: Switch tables

## Design Philosophy

### Compact

- Minimal padding
- Dense tables
- Small buttons
- Efficient spacing

### Intuitive

- Tab-based navigation
- Clear action buttons
- Confirmation dialogs
- Success/error feedback

### Professional

- Consistent styling
- Loading states
- Error handling
- Accessible (ARIA labels)

## Examples

### Edit Event Name

1. Click **Events** tab
2. Find event in list
3. Click **Edit** button
4. Change "Tournament 2024" to "Championship 2025"
5. Click **Save**
6. ✅ Updated!

### Add New Team

1. Click **Teams** tab
2. Click **+ Add New**
3. Enter name: "Phoenix Rising"
4. Select sport: "Soccer"
5. Click **Save**
6. ✅ Team created!

### Delete Sport

1. Click **Sports** tab
2. Find "Pickleball" 
3. Click **Delete**
4. Confirm: "Are you sure?"
5. Click **Delete**
6. ✅ Removed!

---

**Result**: Compact, professional CRUD interface for quick database management! 🎉

