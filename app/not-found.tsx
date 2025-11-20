'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, Database, FileQuestion, Home, ArrowLeft, Search, BookOpen } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()
  const pathname = usePathname()

  const quickLinks = [
    {
      title: 'RPI Calculator',
      description: 'Calculate RPI rankings for your sports data',
      href: '/',
      icon: Calculator,
    },
    {
      title: 'Database ERD',
      description: 'View entity relationship diagram',
      href: '/?tab=erd',
      icon: Database,
    },
    {
      title: 'RPI Formulas',
      description: 'Learn about RPI calculation formulas',
      href: '/?tab=formulas',
      icon: BookOpen,
    },
  ]

  // Parse pathname to provide context-aware suggestions
  const getContextualMessage = () => {
    if (pathname?.includes('/admin')) {
      return {
        title: 'Admin Page Not Found',
        suggestion: 'Looking for database administration? Try accessing the admin interface.',
        adminLink: true,
      }
    }
    if (pathname?.includes('/api')) {
      return {
        title: 'API Endpoint Not Found',
        suggestion: 'This API endpoint doesn\'t exist. Check the API documentation or endpoint URL.',
        adminLink: false,
      }
    }
    return {
      title: 'Page Not Found',
      suggestion: 'The page you\'re looking for doesn\'t exist or may have been moved.',
      adminLink: false,
    }
  }

  const context = getContextualMessage()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-6">
        {/* Main 404 Message */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <FileQuestion className="h-24 w-24 text-muted-foreground/30 mx-auto" />
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold">
              404
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{context.title}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {context.suggestion}
          </p>
          {pathname && (
            <p className="text-xs text-muted-foreground/70 font-mono bg-muted/50 px-3 py-1.5 rounded inline-block">
              Path: {pathname}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.back()} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Navigation
            </CardTitle>
            <CardDescription>
              Jump to commonly used sections of the application
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative overflow-hidden rounded-lg border bg-card p-4 hover:bg-accent hover:border-primary/50 transition-all duration-200"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <link.icon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">{link.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {link.description}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Admin Links (if context suggests admin) */}
        {context.adminLink && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Administration
              </CardTitle>
              <CardDescription>
                Access database tables and management tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/admin/database"
                className="block p-3 rounded-lg border hover:bg-accent hover:border-primary/50 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">Database Tables</h4>
                    <p className="text-xs text-muted-foreground">
                      View and manage all database tables
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                </div>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-sm">Need Help?</h3>
              <p className="text-xs text-muted-foreground max-w-xl mx-auto">
                If you believe this page should exist or you&apos;re experiencing issues, 
                please check your URL or contact the system administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

