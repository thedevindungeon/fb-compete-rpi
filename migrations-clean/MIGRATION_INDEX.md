# RPI Migrations - Documentation Index

This is the complete index of all migration-related documentation for the RPI calculator.

---

## Quick Access

- 🚀 **Start here:** [`../QUICK_START.md`](../QUICK_START.md)
- 📊 **Summary:** [`../MIGRATION_SUMMARY.md`](../MIGRATION_SUMMARY.md)
- 🔧 **Technical details:** [`../MIGRATION_PACKAGING.md`](../MIGRATION_PACKAGING.md)

---

## Migration Sets

### Clean Migrations (This Directory)
**Use for:** Standalone RPI installations, new databases

📂 **Location:** `migrations-clean/`

**Files:**
1. `01_create_sports_table.sql` - Creates sports table with 8 sports and full RPI config
2. `02_create_team_rpi_table.sql` - Creates historical RPI storage
3. `03_create_rpi_calculation_history.sql` - Creates advanced calculation tracking
4. `README.md` - Complete guide for clean migrations

**Documentation:**
- [README.md](./README.md) - Full guide with dependencies, verification, troubleshooting

---

### Integration Migrations
**Use for:** Adding RPI to existing compete database

📂 **Location:** `../migrations-integration/`

**Files:**
1. `01_add_rpi_config_to_sports.sql` - Enhances existing sports table
2. `02_populate_rpi_config.sql` - Populates sports with RPI config
3. `03_create_team_rpi_table.sql` - Creates historical RPI storage
4. `04_create_rpi_calculation_history.sql` - Creates advanced calculation tracking
5. `README.md` - Complete guide for integration migrations

**Documentation:**
- [../migrations-integration/README.md](../migrations-integration/README.md) - Full integration guide

---

## Rollback

📂 **Location:** `../rollback/`

**Files:**
1. `rollback_all_rpi.sql` - Complete rollback script (with safety options)
2. `README.md` - Rollback guide with safety best practices

**Documentation:**
- [../rollback/README.md](../rollback/README.md) - Complete rollback guide

---

## Overview Documentation

### Quick Start Guide
📄 **File:** [`../QUICK_START.md`](../QUICK_START.md)

**Contains:**
- TL;DR for both migration sets
- Quick commands for standalone and integration
- Quick verification queries
- Common troubleshooting

**Read this if:** You just want to get started quickly

---

### Migration Summary
📄 **File:** [`../MIGRATION_SUMMARY.md`](../MIGRATION_SUMMARY.md)

**Contains:**
- Executive summary of what was done
- Before/after comparison
- Complete file inventory
- Success metrics
- Next steps

**Read this if:** You want a high-level overview

---

### Migration Packaging
📄 **File:** [`../MIGRATION_PACKAGING.md`](../MIGRATION_PACKAGING.md)

**Contains:**
- Detailed technical analysis
- Complete migration comparison
- Dependency graphs
- What's RPI-specific vs not
- Future maintenance guide
- Q&A section

**Read this if:** You need deep technical understanding

---

### Original Analysis
📄 **File:** [`../docs/migration-analysis.md`](../docs/migration-analysis.md)

**Contains:**
- Original analysis of compete repo migrations
- Compete vs RPI repo comparison
- Conflict identification
- Initial recommendations

**Read this if:** You want to understand the original problem and analysis

---

## Related Project Documentation

### RPI Formula
📄 **File:** [`../docs/rpi-formula.md`](../docs/rpi-formula.md)
- How RPI calculation works
- NCAA compliance details
- Sport-specific variations

### Sports Configuration
📄 **File:** [`../docs/sport-config.md`](../docs/sport-config.md) (if exists)
- Sport-specific RPI settings
- Coefficient explanations
- When to use which formula

### Database Structure
📄 **File:** [`../docs/database-sports-structure.md`](../docs/database-sports-structure.md)
- Complete schema documentation
- Table relationships
- Index strategy

---

## File Tree

```
rpi/
├── QUICK_START.md                      ← Start here!
├── MIGRATION_SUMMARY.md                ← High-level overview
├── MIGRATION_PACKAGING.md              ← Technical details
│
├── migrations/                         ← Legacy (for reference)
│   ├── 20250119000000_create_team_rpi_table.sql
│   ├── 20250119100000_create_sports_table.sql
│   ├── 20250119100001_alter_sports_table_add_columns.sql
│   ├── 20250119100002_populate_sports_data.sql
│   ├── 20250119100003_create_sports_view.sql
│   └── 20250119110000_create_rpi_calculation_history.sql
│
├── migrations-clean/                   ← Use for standalone
│   ├── 01_create_sports_table.sql
│   ├── 02_create_team_rpi_table.sql
│   ├── 03_create_rpi_calculation_history.sql
│   ├── README.md                       ← Clean migrations guide
│   └── MIGRATION_INDEX.md             ← This file
│
├── migrations-integration/             ← Use for compete
│   ├── 01_add_rpi_config_to_sports.sql
│   ├── 02_populate_rpi_config.sql
│   ├── 03_create_team_rpi_table.sql
│   ├── 04_create_rpi_calculation_history.sql
│   └── README.md                       ← Integration guide
│
├── rollback/                           ← Use to undo
│   ├── rollback_all_rpi.sql
│   └── README.md                       ← Rollback guide
│
└── docs/                               ← Project documentation
    ├── migration-analysis.md           ← Original analysis
    ├── rpi-formula.md
    ├── database-sports-structure.md
    └── ...
```

---

## Reading Order

### For First-Time Users

1. [`../QUICK_START.md`](../QUICK_START.md) - Get oriented
2. [`README.md`](./README.md) or [`../migrations-integration/README.md`](../migrations-integration/README.md) - Depending on your use case
3. [`../MIGRATION_SUMMARY.md`](../MIGRATION_SUMMARY.md) - Understand what was done
4. [`../rollback/README.md`](../rollback/README.md) - Know how to undo if needed

### For Technical Deep Dive

1. [`../docs/migration-analysis.md`](../docs/migration-analysis.md) - Original problem
2. [`../MIGRATION_PACKAGING.md`](../MIGRATION_PACKAGING.md) - Solution details
3. [`README.md`](./README.md) - Clean migration implementation
4. [`../migrations-integration/README.md`](../migrations-integration/README.md) - Integration implementation

### For Maintenance

1. [`../MIGRATION_PACKAGING.md`](../MIGRATION_PACKAGING.md) - See "Future Maintenance" section
2. [`README.md`](./README.md) - Understand current structure
3. Migration files themselves - See the SQL with comments

---

## Common Tasks

### I want to run migrations on a new database
→ Read: [`QUICK_START.md`](../QUICK_START.md) + [`README.md`](./README.md)
→ Use: `migrations-clean/`

### I want to add RPI to compete repo
→ Read: [`QUICK_START.md`](../QUICK_START.md) + [`../migrations-integration/README.md`](../migrations-integration/README.md)
→ Use: `migrations-integration/`

### I need to rollback migrations
→ Read: [`../rollback/README.md`](../rollback/README.md)
→ Use: `rollback/rollback_all_rpi.sql`

### I need to understand what changed
→ Read: [`../MIGRATION_SUMMARY.md`](../MIGRATION_SUMMARY.md)

### I need technical details
→ Read: [`../MIGRATION_PACKAGING.md`](../MIGRATION_PACKAGING.md)

### I need to add a new sport
→ Read: [`../MIGRATION_PACKAGING.md`](../MIGRATION_PACKAGING.md) - "Future Maintenance" section

### I need to modify RPI coefficients
→ Read: [`../MIGRATION_PACKAGING.md`](../MIGRATION_PACKAGING.md) - "Future Maintenance" section

---

## Documentation Standards

All migration documentation follows these standards:

1. **Clear purpose statement** at the top
2. **Use case identification** (who should use this)
3. **Prerequisites listed** explicitly
4. **Step-by-step instructions** with code examples
5. **Verification queries** to confirm success
6. **Troubleshooting section** for common issues
7. **Rollback instructions** when applicable

---

## Getting Help

If you can't find what you need:

1. Check this index for the right document
2. Use Ctrl+F to search within documents
3. Check the troubleshooting sections
4. Review the Q&A in [`MIGRATION_PACKAGING.md`](../MIGRATION_PACKAGING.md)

---

## Contributing

When adding new migrations or documentation:

1. Follow existing file naming conventions
2. Include comprehensive comments in SQL
3. Update this index with new files
4. Update relevant README files
5. Test on clean database before committing

---

**Last Updated:** 2025-11-20
**Version:** 1.0
**Maintainer:** RPI Calculator Team

