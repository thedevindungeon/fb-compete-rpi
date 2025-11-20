import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Table configurations with schema info, actual table names, and primary keys
const TABLE_CONFIG: Record<string, { schema: string; tableName: string; primaryKey: string; allowedOperations: string[] }> = {
  events: { schema: 'fb_compete', tableName: 'compete_event_details', primaryKey: 'event_id', allowedOperations: ['GET', 'POST', 'PUT', 'DELETE'] },
  teams: { schema: 'fb_compete', tableName: 'teams', primaryKey: 'id', allowedOperations: ['GET', 'POST', 'PUT', 'DELETE'] },
  sports: { schema: 'fb_compete', tableName: 'sports', primaryKey: 'id', allowedOperations: ['GET', 'POST', 'PUT', 'DELETE'] },
  matches: { schema: 'fb_compete', tableName: 'match', primaryKey: 'id', allowedOperations: ['GET', 'POST', 'PUT', 'DELETE'] },
  rpi: { schema: 'fb_compete', tableName: 'team_rpi', primaryKey: 'id', allowedOperations: ['GET', 'DELETE'] },
}

// Helper to get Supabase client from request
function getSupabaseFromRequest(request: NextRequest) {
  const url = request.headers.get('x-supabase-url')
  const key = request.headers.get('x-supabase-key')
  
  if (!url || !key) {
    throw new Error('Missing Supabase credentials in headers')
  }
  
  return createClient(url, key)
}

// GET: Fetch records from table
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params
    const config = TABLE_CONFIG[table]
    
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid table name' },
        { status: 400 }
      )
    }
    
    if (!config.allowedOperations.includes('GET')) {
      return NextResponse.json(
        { error: 'Operation not allowed' },
        { status: 403 }
      )
    }
    
    const supabase = getSupabaseFromRequest(request)
    const { searchParams } = new URL(request.url)
    
    console.log('[Admin API] GET request for table:', table)
    console.log('[Admin API] Using config:', config)
    
    // Build query using actual table name with count
    let query = supabase
      .schema(config.schema)
      .from(config.tableName)
      .select('*', { count: 'exact' })
    
    // Apply filters
    const search = searchParams.get('search')
    const searchColumn = searchParams.get('searchColumn')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const orderBy = searchParams.get('orderBy') || config.primaryKey
    const orderDirection = (searchParams.get('orderDirection') || 'asc') as 'asc' | 'desc'
    
    if (search && searchColumn) {
      query = query.ilike(searchColumn, `%${search}%`)
    }
    
    // Apply pagination and sorting
    query = query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1)
    
    console.log('[Admin API] Executing query...')
    const { data, error, count } = await query
    
    if (error) {
      console.error('[Admin API] Query error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      )
    }
    
    console.log('[Admin API] Query successful, rows:', data?.length, 'total:', count)
    
    return NextResponse.json({
      data,
      pagination: {
        total: count || data?.length || 0,
        offset,
        limit,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST: Create new record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params
    const config = TABLE_CONFIG[table]
    
    if (!config || !config.allowedOperations.includes('POST')) {
      return NextResponse.json(
        { error: 'Operation not allowed' },
        { status: 403 }
      )
    }
    
    const supabase = getSupabaseFromRequest(request)
    const body = await request.json()
    
    const { data, error } = await supabase
      .schema(config.schema)
      .from(config.tableName)
      .insert(body)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT: Update record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params
    const config = TABLE_CONFIG[table]
    
    if (!config || !config.allowedOperations.includes('PUT')) {
      return NextResponse.json(
        { error: 'Operation not allowed' },
        { status: 403 }
      )
    }
    
    const supabase = getSupabaseFromRequest(request)
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .schema(config.schema)
      .from(config.tableName)
      .update(updateData)
      .eq(config.primaryKey, id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params
    const config = TABLE_CONFIG[table]
    
    if (!config || !config.allowedOperations.includes('DELETE')) {
      return NextResponse.json(
        { error: 'Operation not allowed' },
        { status: 403 }
      )
    }
    
    const supabase = getSupabaseFromRequest(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .schema(config.schema)
      .from(config.tableName)
      .delete()
      .eq(config.primaryKey, id)
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

