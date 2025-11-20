# RPI Calculator Documentation

Complete documentation for the RPI Calculator application.

## 📚 Table of Contents

### Getting Started
- [**Quick Start Guide**](getting-started.md) - Installation, running, and basic usage
- [**RPI Formula Explained**](rpi-formula.md) - Understanding RPI calculations

### Core Features
- [**Sport-Specific RPI**](sport-specific-rpi.md) - Sport configurations and coefficients
- [**Sport UI Guide**](sport-ui-guide.md) - Visual guide to sport-specific features
- [**NCAA Formula Compliance**](ncaa-formula-compliance.md) - Official NCAA formulas by sport

### Database Features
- [**Database Admin Interface**](database-admin-interface.md) - CRUD interface for managing data
- [**Sports Database Structure**](database-sports-structure.md) - Sport configuration in database
- [**RPI Historical Tracking**](rpi-historical-calculations.md) - Save and compare calculations

### Advanced Features
- [**Generate Dataset**](generate-dataset-sport-selection.md) - Create synthetic test data
- [**Scripts & Tools**](scripts-and-tools.md) - Maintenance scripts and utilities

### Reference
- [**Changelog**](changelog.md) - Project evolution and completed features
- [**Troubleshooting**](troubleshooting.md) - Common issues and solutions

---

## Quick Links

### Common Tasks

**Setting Up**
1. [Install dependencies](getting-started.md#installation)
2. [Run dev server](getting-started.md#development)
3. [Connect to Supabase](getting-started.md#connecting-to-supabase)

**Using RPI**
1. [Load sample data](getting-started.md#loading-data)
2. [Adjust coefficients](sport-specific-rpi.md#coefficient-variations-by-sport)
3. [Export results](getting-started.md#exporting-results)

**Database Management**
1. [Access admin interface](database-admin-interface.md#access)
2. [Manage sports configuration](database-sports-structure.md#updating-sport-configuration)
3. [View historical calculations](rpi-historical-calculations.md#typescript-api)

**Maintenance**
1. [Fix sport IDs](scripts-and-tools.md#sport-id-fixer)
2. [Generate test data](generate-dataset-sport-selection.md)
3. [Run database migrations](database-sports-structure.md#migrations)

---

## Project Overview

### What is this?

A Next.js application for calculating **Rating Percentage Index (RPI)** for sports tournaments with:

✅ Real-time calculations with configurable coefficients  
✅ Sport-specific formulas (Baseball, Soccer, Football, Basketball, etc.)  
✅ Supabase integration for live tournament data  
✅ Historical calculation tracking and comparison  
✅ Database admin interface for data management  
✅ Export to CSV for analysis  

### Technology Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, Shadcn UI
- **State**: TanStack Query
- **Database**: Supabase (PostgreSQL)
- **Testing**: Vitest
- **Package Manager**: Bun

### Key Features

1. **Sport-Specific RPI** - NCAA-compliant formulas for 8+ sports
2. **Live Data** - Connect to Supabase for real tournament data
3. **Historical Tracking** - Save and compare calculations over time
4. **Admin Interface** - Manage events, teams, and sports via UI
5. **Flexible Coefficients** - Adjust formulas in real-time
6. **Sample Data** - Generate synthetic datasets for testing

---

## Documentation Structure

```
docs/
├── INDEX.md (this file)           # Main navigation hub
├── getting-started.md             # Installation and quick start
├── rpi-formula.md                 # RPI calculation explained
├── sport-specific-rpi.md          # Sport configurations
├── sport-ui-guide.md              # Visual UI guide
├── ncaa-formula-compliance.md     # NCAA formulas
├── database-admin-interface.md    # CRUD interface
├── database-sports-structure.md   # Sports DB schema
├── rpi-historical-calculations.md # Historical tracking
├── generate-dataset-sport-selection.md  # Dataset generator
├── scripts-and-tools.md           # Maintenance scripts
├── changelog.md                   # Project history
└── troubleshooting.md             # Problem solving
```

---

## Contributing

This is an internal tool, but contributions are welcome:

1. Write tests for new features
2. Update documentation
3. Follow existing code patterns
4. Run tests before submitting: `bun test`

---

## Support

For questions or issues:
1. Check [Troubleshooting](troubleshooting.md)
2. Review relevant documentation section
3. Check code comments in source files
4. Contact the development team

---

**Last Updated**: 2025-01-19  
**Version**: 1.0.0

