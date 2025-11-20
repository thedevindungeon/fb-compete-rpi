'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Database,
  Edit,
  Trash2,
  Plus,
  Search,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import DBAEnvironmentHealth from '@/components/dba-environment-health'
import DBAQuickStats from '@/components/dba-quick-stats'
import DBADevTools from '@/components/dba-dev-tools'
import { useSupabaseConnection } from '@/contexts/supabase-connection-context'

type ColumnMetadata = {
  name: string
  displayName: string
  type: string
  required: boolean
  editable: boolean
  primaryKey: boolean
  foreignKey?: {
    table: string
    column: string
    displayColumn?: string
  }
  options?: Array<{ value: string | number; label: string }>
}

type TableMetadata = {
  table: string
  displayName: string
  schema: string
  primaryKey: string
  searchableColumns: string[]
  columns: ColumnMetadata[]
}

const TABLES = [
  { slug: 'events', name: 'Events', icon: '📅' },
  { slug: 'teams', name: 'Teams', icon: '👥' },
  { slug: 'sports', name: 'Sports', icon: '⚽' },
  { slug: 'matches', name: 'Matches', icon: '🏆' },
  { slug: 'rpi', name: 'RPI Results', icon: '📊' },
]

export default function AdminTablePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const table = params.table as string
  const connectionContext = useSupabaseConnection()

  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [metadata, setMetadata] = useState<TableMetadata | null>(null)
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  // Dialogs
  const [editDialog, setEditDialog] = useState(false)
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null)
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create')
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Record<string, unknown> | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load credentials - prioritize URL params, then context, then localStorage fallback
  useEffect(() => {
    const urlParam = searchParams.get('url')
    const keyParam = searchParams.get('key')

    if (urlParam && keyParam) {
      // URL parameters take priority (when opening from connection panel)
      setSupabaseUrl(urlParam)
      setSupabaseKey(keyParam)
      // Also update the context so it's available app-wide
      connectionContext.setConnection(urlParam, keyParam)
    } else if (connectionContext.url && connectionContext.key) {
      // Use context if available
      setSupabaseUrl(connectionContext.url)
      setSupabaseKey(connectionContext.key)
    } else {
      // Fallback to localStorage (shouldn't be needed with context, but just in case)
      try {
        const stored = localStorage.getItem('supabase-connection-state')
        if (stored) {
          const parsed = JSON.parse(stored)
          setSupabaseUrl(parsed.url)
          setSupabaseKey(parsed.key)
        }
      } catch {}
    }
  }, [searchParams, connectionContext])

  // Fetch metadata
  useEffect(() => {
    if (supabaseUrl && supabaseKey && table) {
      fetchMetadata()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, supabaseUrl, supabaseKey])

  // Fetch data when metadata loads or page/pageSize changes
  useEffect(() => {
    if (metadata) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata, page, pageSize, searchQuery])

  // Reset to page 1 when pageSize changes
  useEffect(() => {
    setPage(1)
  }, [pageSize])

  const fetchMetadata = async () => {
    try {
      const response = await fetch(`/api/admin/${table}/metadata`, {
        headers: {
          'x-supabase-url': supabaseUrl,
          'x-supabase-key': supabaseKey,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch metadata')

      const result = await response.json()
      setMetadata(result.metadata)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metadata')
    }
  }

  const fetchData = async () => {
    if (!metadata) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((page - 1) * pageSize).toString(),
        orderBy: metadata.primaryKey,
        orderDirection: 'asc',
      })

      if (searchQuery && metadata.searchableColumns.length > 0) {
        params.append('search', searchQuery)
        params.append('searchColumn', metadata.searchableColumns[0])
      }

      const response = await fetch(`/api/admin/${table}?${params}`, {
        headers: {
          'x-supabase-url': supabaseUrl,
          'x-supabase-key': supabaseKey,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch data')

      const result = await response.json()
      setData(result.data || [])
      setTotalRecords(result.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!metadata || !editItem) return

    setSaving(true)
    setError(null)

    try {
      const url = `/api/admin/${table}${editMode === 'edit' ? '' : ''}`
      const method = editMode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-supabase-url': supabaseUrl,
          'x-supabase-key': supabaseKey,
        },
        body: JSON.stringify(editItem),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save')
      }

      setEditDialog(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!metadata || !deleteItem) return

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/${table}?id=${deleteItem[metadata.primaryKey]}`,
        {
          method: 'DELETE',
          headers: {
            'x-supabase-url': supabaseUrl,
            'x-supabase-key': supabaseKey,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete')
      }

      setDeleteDialog(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const formatValue = (value: unknown, type: string) => {
    if (value === null || value === undefined) return '-'
    if (type === 'datetime' || type === 'date') {
      return new Date(value as string | number | Date).toLocaleString()
    }
    if (type === 'boolean') return value ? '✓' : '✗'
    return String(value)
  }

  const handleCreate = () => {
    const newItem: Record<string, unknown> = {}
    metadata?.columns.forEach(col => {
      if (!col.primaryKey) {
        if (col.type === 'boolean') newItem[col.name] = false
        else if (col.type === 'number') newItem[col.name] = null
        else newItem[col.name] = ''
      }
    })
    setEditItem(newItem)
    setEditMode('create')
    setEditDialog(true)
  }

  const handleEdit = (item: Record<string, unknown>) => {
    setEditItem({ ...item })
    setEditMode('edit')
    setEditDialog(true)
  }

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">No Database Connection</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please connect to Supabase first
                </p>
                <Link href="/">
                  <Button size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go to Main Page
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalPages = Math.ceil(totalRecords / pageSize)
  
  // Detect environment
  const environment = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')
    ? 'local'
    : supabaseUrl.includes('staging')
    ? 'staging'
    : 'production'

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Database className="h-5 w-5" />
              {metadata?.displayName || 'Database Admin'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {metadata?.schema}.{metadata?.table}
              {connectionContext.eventName && (
                <span className="ml-2">
                  • Event: <span className="font-medium">{connectionContext.eventName}</span>
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connectionContext.eventName && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {connectionContext.eventName}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {supabaseUrl.split('//')[1]?.split('.')[0]}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-3">
        <DBAQuickStats supabaseUrl={supabaseUrl} supabaseKey={supabaseKey} />
      </div>

      {/* Environment Health */}
      <div className="mb-3">
        <DBAEnvironmentHealth
          supabaseUrl={supabaseUrl}
          supabaseKey={supabaseKey}
          onRefresh={() => {
            if (metadata) fetchData()
          }}
        />
      </div>

      {/* Developer Tools */}
      <div className="mb-4">
        <DBADevTools
          supabaseUrl={supabaseUrl}
          supabaseKey={supabaseKey}
          environment={environment}
        />
      </div>

      {/* Table Navigation */}
      <div className="flex items-center gap-2 mb-4">
        {TABLES.map(t => (
          <Button
            key={t.slug}
            variant={table === t.slug ? 'default' : 'outline'}
            size="sm"
            onClick={() => router.push(`/admin/${t.slug}?url=${encodeURIComponent(supabaseUrl)}&key=${encodeURIComponent(supabaseKey)}`)}
            className="h-8"
          >
            <span className="mr-1.5">{t.icon}</span>
            {t.name}
          </Button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button onClick={handleCreate} size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-1.5" />
          Add New
        </Button>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border-b">
              <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No records found</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      {metadata?.columns.slice(0, 6).map(col => (
                        <TableHead key={col.name} className="h-9 text-xs">
                          {col.displayName}
                        </TableHead>
                      ))}
                      <TableHead className="w-[80px] h-9 text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map(item => (
                      <TableRow key={String(item[metadata?.primaryKey || 'id'])}>
                        {metadata?.columns.slice(0, 6).map(col => (
                          <TableCell key={col.name} className="py-2 text-xs max-w-[200px] truncate">
                            {formatValue(item[col.name], col.type)}
                          </TableCell>
                        ))}
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeleteItem(item)
                                setDeleteDialog(true)
                              }}
                              className="h-6 w-6 p-0 text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between p-2 border-t bg-muted/50">
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">
                Showing {totalRecords > 0 ? ((page - 1) * pageSize) + 1 : 0} - {Math.min(page * pageSize, totalRecords)} of {totalRecords}
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={pageSize.toString()}
                  onValueChange={(v) => setPageSize(parseInt(v))}
                >
                  <SelectTrigger className="h-7 w-[80px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                    <SelectItem value="200">200 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Page</span>
                  <Select
                    value={page.toString()}
                    onValueChange={(v) => setPage(parseInt(v))}
                  >
                    <SelectTrigger className="h-7 w-[70px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                          <SelectItem key={p} value={p.toString()}>
                            {p}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">of {totalPages}</span>
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="h-7 px-2"
                  title="First page"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <ChevronLeft className="h-3 w-3 -ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-7 px-2"
                  title="Previous page"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-7 px-2"
                  title="Next page"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="h-7 px-2"
                  title="Last page"
                >
                  <ChevronRight className="h-3 w-3" />
                  <ChevronRight className="h-3 w-3 -ml-2" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editMode === 'create' ? 'Create' : 'Edit'} {metadata?.displayName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editMode === 'create' ? 'Add a new record' : 'Update record details'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(85vh-180px)]">
            <div className="space-y-4 py-3 pr-3">
              {/* Primary Key (Read-only in edit mode) */}
              {editMode === 'edit' && metadata?.columns.filter(col => col.primaryKey).map(col => (
                <div key={col.name} className="pb-3 border-b">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-300">#</span>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">{col.displayName}</Label>
                      <p className="text-[10px] text-muted-foreground">Primary identifier (read-only)</p>
                    </div>
                  </div>
                  <div className="ml-8">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{String(editItem?.[col.name] ?? '')}</code>
                  </div>
                </div>
              ))}

              {/* Group fields by category */}
              {(() => {
                const editableColumns = metadata?.columns.filter(col => col.editable && !col.primaryKey) || []
                
                // Categorize fields
                const basicFields = editableColumns.filter(col => 
                  ['name', 'internal_description', 'description', 'status', 'visibility', 'gender', 'origin', 'display_name', 'icon', 'slug'].includes(col.name)
                )
                const locationFields = editableColumns.filter(col => 
                  ['city', 'state', 'country'].includes(col.name)
                )
                const relationFields = editableColumns.filter(col => 
                  col.name.endsWith('_id') || col.type === 'select'
                )
                const configFields = editableColumns.filter(col => 
                  ['is_active', 'published', 'sort_order', 'show_diff', 'show_domination'].includes(col.name) || col.name.startsWith('default_')
                )
                const metaFields = editableColumns.filter(col => 
                  !basicFields.includes(col) && !locationFields.includes(col) && !relationFields.includes(col) && !configFields.includes(col)
                )

                const renderField = (col: ColumnMetadata) => (
                  <div key={col.name} className="space-y-1.5">
                    <Label htmlFor={col.name} className="text-xs font-medium flex items-center gap-1">
                      {col.displayName}
                      {col.required && <span className="text-red-500">*</span>}
                      {col.name.endsWith('_id') && <span className="text-[10px] text-muted-foreground">(ID)</span>}
                    </Label>
                    {col.type === 'boolean' ? (
                      <Select
                        value={String(editItem?.[col.name] ?? false)}
                        onValueChange={(v) => setEditItem({ ...editItem, [col.name]: v === 'true' })}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">✓ Yes</SelectItem>
                          <SelectItem value="false">✗ No</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : col.type === 'select' && col.options ? (
                      <Select
                        value={String(editItem?.[col.name] ?? '')}
                        onValueChange={(v) => setEditItem({ ...editItem, [col.name]: parseInt(v) || v })}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {col.options?.map((opt) => (
                            <SelectItem key={opt.value} value={String(opt.value)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={col.name}
                        type={col.type === 'number' ? 'number' : col.type === 'datetime' ? 'datetime-local' : 'text'}
                        value={String(editItem?.[col.name] ?? '')}
                        onChange={(e) => setEditItem({
                          ...editItem,
                          [col.name]: col.type === 'number' ? (e.target.value ? parseFloat(e.target.value) : null) : e.target.value
                        })}
                        className="h-9 text-xs"
                        placeholder={col.required ? 'Required' : 'Optional'}
                      />
                    )}
                  </div>
                )

                return (
                  <>
                    {/* Basic Information */}
                    {basicFields.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">📝</span>
                          </div>
                          <h3 className="text-xs font-semibold">Basic Information</h3>
                        </div>
                        <div className="ml-8 space-y-3">
                          {basicFields.map(renderField)}
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    {locationFields.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">📍</span>
                          </div>
                          <h3 className="text-xs font-semibold">Location</h3>
                        </div>
                        <div className="ml-8 grid grid-cols-2 gap-3">
                          {locationFields.map(renderField)}
                        </div>
                      </div>
                    )}

                    {/* Relationships */}
                    {relationFields.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">🔗</span>
                          </div>
                          <h3 className="text-xs font-semibold">Relationships</h3>
                        </div>
                        <div className="ml-8 space-y-3">
                          {relationFields.map(renderField)}
                        </div>
                      </div>
                    )}

                    {/* Configuration */}
                    {configFields.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-teal-100 dark:bg-teal-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">⚙️</span>
                          </div>
                          <h3 className="text-xs font-semibold">Configuration</h3>
                        </div>
                        <div className="ml-8 grid grid-cols-2 gap-3">
                          {configFields.map(renderField)}
                        </div>
                      </div>
                    )}

                    {/* Other Fields */}
                    {metaFields.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">📋</span>
                          </div>
                          <h3 className="text-xs font-semibold">Additional Details</h3>
                        </div>
                        <div className="ml-8 space-y-3">
                          {metaFields.map(renderField)}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)} disabled={saving} size="sm">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Save className="h-3 w-3 mr-1.5" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Confirm Delete</DialogTitle>
            <DialogDescription className="text-xs">
              This action cannot be undone. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} disabled={deleting} size="sm">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} size="sm">
              {deleting ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1.5" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

