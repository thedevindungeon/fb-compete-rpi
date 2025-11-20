import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type ColumnMetadata = {
  name: string
  displayName: string
  type: 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'select' | 'json'
  required: boolean
  editable: boolean
  primaryKey: boolean
  foreignKey?: {
    table: string
    column: string
    displayColumn?: string
  }
}

type TableMetadata = {
  table: string
  displayName: string
  schema: string
  primaryKey: string
  searchableColumns: string[]
  columns: ColumnMetadata[]
}

// Table metadata configurations
const METADATA: Record<string, TableMetadata> = {
  events: {
    table: 'compete_event_details',
    displayName: 'Events',
    schema: 'fb_compete',
    primaryKey: 'event_id',
    searchableColumns: ['internal_description', 'city', 'state'],
    columns: [
      { name: 'event_id', displayName: 'Event ID', type: 'number', required: true, editable: false, primaryKey: true },
      { name: 'internal_description', displayName: 'Description', type: 'text', required: false, editable: true, primaryKey: false },
      { name: 'status', displayName: 'Status', type: 'text', required: true, editable: true, primaryKey: false },
      { name: 'visibility', displayName: 'Visibility', type: 'text', required: true, editable: true, primaryKey: false },
      { name: 'city', displayName: 'City', type: 'text', required: true, editable: true, primaryKey: false },
      { name: 'state', displayName: 'State', type: 'text', required: true, editable: true, primaryKey: false },
      { name: 'sport_id', displayName: 'Sport ID', type: 'number', required: false, editable: true, primaryKey: false },
      { name: 'created_at', displayName: 'Created At', type: 'datetime', required: false, editable: false, primaryKey: false },
      { name: 'updated_at', displayName: 'Updated At', type: 'datetime', required: false, editable: false, primaryKey: false },
    ],
  },
  teams: {
    table: 'teams',
    displayName: 'Teams',
    schema: 'fb_compete',
    primaryKey: 'id',
    searchableColumns: ['name'],
    columns: [
      { name: 'id', displayName: 'ID', type: 'number', required: true, editable: false, primaryKey: true },
      { name: 'name', displayName: 'Team Name', type: 'text', required: true, editable: true, primaryKey: false },
      { name: 'sport_id', displayName: 'Sport ID', type: 'number', required: false, editable: true, primaryKey: false },
      { name: 'gender', displayName: 'Gender', type: 'text', required: false, editable: true, primaryKey: false },
      { name: 'origin', displayName: 'Origin', type: 'text', required: false, editable: true, primaryKey: false },
      { name: 'created_at', displayName: 'Created At', type: 'datetime', required: false, editable: false, primaryKey: false },
    ],
  },
  sports: {
    table: 'sports',
    displayName: 'Sports',
    schema: 'fb_compete',
    primaryKey: 'id',
    searchableColumns: ['name', 'display_name'],
    columns: [
      { name: 'id', displayName: 'ID', type: 'number', required: true, editable: false, primaryKey: true },
      { name: 'name', displayName: 'Internal Name', type: 'text', required: true, editable: true, primaryKey: false },
      { name: 'display_name', displayName: 'Display Name', type: 'text', required: true, editable: true, primaryKey: false },
      { name: 'icon', displayName: 'Icon', type: 'text', required: false, editable: true, primaryKey: false },
      { name: 'slug', displayName: 'Slug', type: 'text', required: false, editable: true, primaryKey: false },
      { name: 'is_active', displayName: 'Active', type: 'boolean', required: false, editable: true, primaryKey: false },
      { name: 'sort_order', displayName: 'Sort Order', type: 'number', required: false, editable: true, primaryKey: false },
    ],
  },
  matches: {
    table: 'match',
    displayName: 'Matches',
    schema: 'fb_compete',
    primaryKey: 'id',
    searchableColumns: [],
    columns: [
      { name: 'id', displayName: 'Match ID', type: 'text', required: true, editable: false, primaryKey: true },
      { name: 'event_id', displayName: 'Event ID', type: 'number', required: true, editable: true, primaryKey: false },
      { name: 'status', displayName: 'Status', type: 'text', required: false, editable: true, primaryKey: false },
      { name: 'published', displayName: 'Published', type: 'boolean', required: false, editable: true, primaryKey: false },
      { name: 'created_at', displayName: 'Created At', type: 'datetime', required: false, editable: false, primaryKey: false },
    ],
  },
  rpi: {
    table: 'team_rpi',
    displayName: 'Team RPI Values',
    schema: 'fb_compete',
    primaryKey: 'id',
    searchableColumns: [],
    columns: [
      { name: 'id', displayName: 'ID', type: 'number', required: true, editable: false, primaryKey: true },
      { name: 'team_id', displayName: 'Team ID', type: 'number', required: true, editable: false, primaryKey: false },
      { name: 'sport_id', displayName: 'Sport ID', type: 'number', required: true, editable: false, primaryKey: false },
      { name: 'value', displayName: 'RPI Value', type: 'number', required: true, editable: false, primaryKey: false },
      { name: 'generated_at', displayName: 'Generated At', type: 'datetime', required: true, editable: false, primaryKey: false },
      { name: 'active', displayName: 'Active', type: 'boolean', required: true, editable: false, primaryKey: false },
      { name: 'created_at', displayName: 'Created At', type: 'datetime', required: false, editable: false, primaryKey: false },
      { name: 'updated_at', displayName: 'Updated At', type: 'datetime', required: false, editable: false, primaryKey: false },
      { name: 'deleted_at', displayName: 'Deleted At', type: 'datetime', required: false, editable: false, primaryKey: false },
    ],
  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params
    console.log('[Metadata] Requested table:', table)
    console.log('[Metadata] Available tables:', Object.keys(METADATA))
    
    const metadata = METADATA[table]
    
    if (!metadata) {
      console.error('[Metadata] Table not found:', table)
      return NextResponse.json(
        { error: `Invalid table name: ${table}. Available: ${Object.keys(METADATA).join(', ')}` },
        { status: 400 }
      )
    }
    
    console.log('[Metadata] Found metadata for:', table, metadata.displayName)
    
    // Fetch foreign key options if needed
    const url = request.headers.get('x-supabase-url')
    const key = request.headers.get('x-supabase-key')
    
    if (url && key) {
      const supabase = createClient(url, key)
      
      // Fetch options for select fields with foreign keys
      for (const column of metadata.columns) {
        if (column.type === 'select' && column.foreignKey) {
          const { data } = await supabase
            .schema('fb_compete')
            .from(column.foreignKey.table)
            .select(`${column.foreignKey.column}, ${column.foreignKey.displayColumn || 'name'}`)
            .limit(100)
          
          if (data) {
            ;(column as any).options = data.map((item: any) => ({
              value: item[column.foreignKey!.column],
              label: item[column.foreignKey!.displayColumn || 'name'],
            }))
          }
        }
      }
    }
    
    console.log('[Metadata] Returning metadata with', metadata.columns.length, 'columns')
    return NextResponse.json({ metadata })
  } catch (error) {
    console.error('[Metadata] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

