# RPI Calculator

A Next.js application for calculating **Rating Percentage Index (RPI)** for sports tournaments with sport-specific formulas, historical tracking, and database management.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Open http://localhost:3000
```

## ✨ Key Features

- ✅ **Sport-Specific RPI** - NCAA-compliant formulas for 8+ sports
- ✅ **Real-time Calculations** - Adjust coefficients and see instant updates
- ✅ **Historical Tracking** - Save and compare calculations over time
- ✅ **Database Admin** - Manage events, teams, and sports via UI
- ✅ **Supabase Integration** - Connect to live tournament data
- ✅ **Sample Data Generator** - Create synthetic datasets for testing
- ✅ **Export to CSV/JSON** - Download results for analysis
- ✅ **Responsive Design** - Works on mobile, tablet, and desktop

## 📖 Documentation

**Complete documentation is available in the [`docs/`](docs/) folder.**

### Quick Links

- **[Getting Started](docs/getting-started.md)** - Installation and usage
- **[RPI Formula Explained](docs/rpi-formula.md)** - Understanding the calculations
- **[Sport-Specific RPI](docs/sport-specific-rpi.md)** - Sport configurations
- **[Database Admin](docs/database-admin-interface.md)** - Data management UI
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions

**[📚 Full Documentation Index →](docs/INDEX.md)**

## 🏀 Supported Sports

| Sport | Formula | DIFF Weight |
|-------|---------|-------------|
| ⚾ Baseball | NCAA 25-50-25 | 0.05 |
| ⚽ Soccer | NCAA 25-50-25 | 0.08 |
| 🏈 Football | Custom 35-40-25 | 0.15 |
| 🏐 Volleyball | NCAA 25-50-25 | 0.03 |
| 🏀 Basketball | Custom 90-10-10 | 0.10 |
| 🏒 Hockey | 25-50-25 | 0.08 |
| 🥍 Lacrosse | Hybrid 30-45-25 | 0.10 |
| 🏓 Pickleball | 25-50-25 | 0.02 |

See: [NCAA Formula Compliance](docs/ncaa-formula-compliance.md)

## 🛠️ Technology Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **TanStack Query** - Data management
- **Supabase** - PostgreSQL database
- **Vitest** - Testing framework
- **Bun** - Package manager

## 📝 Development Commands

```bash
# Development
bun dev              # Start dev server
bun run build        # Build for production
bun start            # Start production server

# Testing
bun test             # Run tests in watch mode
bun test:run         # Run tests once
bun test:coverage    # Run with coverage

# Linting
bun run lint         # Run ESLint

# Scripts
npm run analyze-sports          # Analyze sport ID assignments
npm run fix-sports              # Auto-fix sport IDs
npm run fix-sports:interactive  # Manual sport assignment
```

## 🎯 Quick Usage

### 1. Load Data

**Sample Data** (fastest):
```
Click "Load Sample Data" → See 10 basketball teams
```

**Generate Dataset** (for testing):
```
Click "Generate Dataset" → Select sport → Configure size → Generate
```

**Connect to Supabase** (for live data):
```
Enter URL & Key → Select Event → Load Data
```

### 2. Adjust Coefficients

```
Open "RPI Coefficients" panel → Adjust values → See instant updates
```

### 3. Export Results

```
Click "Export CSV" or "Export JSON" → Save to disk
```

See: [Getting Started Guide](docs/getting-started.md)

## 📂 Project Structure

```
rpi/
├── app/                    # Next.js app router
│   ├── admin/database/     # Database admin interface
│   └── page.tsx            # Main RPI calculator
├── components/             # React components
│   └── ui/                 # Shadcn UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Core logic & utilities
│   ├── rpi-calculator.ts   # RPI calculation engine
│   ├── sport-config.ts     # Sport-specific configs
│   └── rpi-history.ts      # Historical tracking
├── tests/                  # Vitest test suites
├── docs/                   # 📚 Complete documentation
├── scripts/                # Maintenance scripts
└── migrations/             # Database migrations
```

## 🤝 Contributing

This is an internal tool. For contributions:
1. Write tests for new features
2. Follow TDD approach
3. Update documentation in `docs/`
4. Run `bun test` before submitting

## 📄 License

MIT

## 📞 Support

- **Documentation**: [docs/INDEX.md](docs/INDEX.md)
- **Issues**: Check [Troubleshooting Guide](docs/troubleshooting.md)
- **Questions**: Contact development team

---

**Version**: 1.0.0 | **Last Updated**: 2025-01-19
