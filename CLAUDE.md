# CLAUDE.md
必ず日本語で回答してください。
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Care Connect is a web application for searching and browsing disability welfare service facilities in Tokyo. Users can search facilities by name, district, service type, and availability status.

## Commands

### Development
```bash
npm run dev          # Start development server at localhost:3000
npm run build        # Build production bundle
npm start            # Start production server
npm run lint         # Run ESLint
```

### Data Import
```bash
node scripts/import-wamnet-data.js    # Import facility data from wamnet.csv to Supabase
```

## Technology Stack

- **Framework**: Next.js 15 (Pages Router) with React 19 and TypeScript
- **Database & Auth**: Supabase (PostgreSQL with RLS, authentication)
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form with Zod validation
- **UI Libraries**: Framer Motion (animations), Lucide React (icons), react-hot-toast (notifications)
- **Maps**: Leaflet + React-Leaflet
- **Charts**: Chart.js + React-Chartjs-2

## Architecture

### Client-Side vs Server-Side Supabase

The project uses **two different Supabase initialization patterns**:

1. **Client-side** (`lib/supabase/client.ts`): Uses `@supabase/ssr` `createBrowserClient` for browser components
2. **Server-side** (`lib/supabase/server.ts`): Empty/minimal - check `utils/supabase/middleware.ts` for actual server implementation
3. **Middleware** (`utils/supabase/middleware.ts`): Uses `@supabase/ssr` `createServerClient` with cookie handling

**Important**: The middleware uses `.delete()` for cookie removal, not `.set()` with empty values.

### Authentication Flow

- Two user types: `'user'` (service users) and `'facility'` (facility operators)
- User type stored in Supabase `user_metadata.user_type`
- Separate login pages: `/auth/userlogin` and `/auth/facilitylogin`
- Middleware redirects authenticated users away from login pages to `/`
- Profile data stored in `profiles` table, linked to auth users

### Data Model

Key tables (defined in `types/database.ts`):
- `profiles`: Base user profile (user_type, email, full_name, phone_number, district)
- `user_profiles`: Extended info for service users (age, disability_types, guardian info)
- `facilities`: Facility information (name, address, district, coordinates, contact)
- `services`: Service definitions (name, category, description)
- `facility_services`: Join table linking facilities to services with availability status
- `bookmarks`: User bookmarks for facilities
- `messages`: DM system between users and facilities

### Search Architecture

The main search endpoint `/api/search/facilities.ts` has **two modes**:

1. **Bookmark mode**: When `facility_ids` param provided, returns specific facilities by ID array
   - Used for displaying bookmarked facilities
   - Preserves order of provided IDs
   - No pagination

2. **Search mode**: Uses Supabase RPC function `search_facilities_with_filters`
   - Filters: query text, district, service_ids array, availability_only boolean
   - Returns facilities with nested services data
   - Includes pagination metadata

The RPC function handles complex filtering logic on the database side.

### Directory Structure

```
lib/                    # Shared utilities, external service clients
├── supabase/          # Supabase client initialization (client, server, types)
├── auth/              # Authentication helpers
└── services/          # Business logic services

utils/                 # Utility functions
└── supabase/          # Server-side Supabase middleware

components/            # React components
├── search/            # Search-related components (FacilityCard, SearchResults)
├── auth/              # Authentication UI
├── forms/             # Form components
├── messaging/         # DM system components
└── ui/                # Reusable UI primitives

pages/                 # Next.js pages (Pages Router)
├── index.tsx          # Main search page
├── auth/              # Authentication pages (userlogin, facilitylogin, register)
├── api/               # API routes
│   ├── search/        # Search endpoints
│   ├── facilities/    # Facility CRUD
│   ├── bookmarks/     # Bookmark management
│   └── messages/      # Messaging endpoints
└── dashboard.tsx      # User dashboard

types/                 # TypeScript type definitions
├── database.ts        # Database schema types, service categories, Tokyo districts
└── auth.ts            # Auth-related types

hooks/                 # Custom React hooks
├── use-Auth.ts        # Authentication state management
└── useDevice.ts       # Device detection

scripts/               # Utility scripts
└── import-wamnet-data.js  # CSV data import to Supabase
```

### Tokyo Districts

All Tokyo districts (23 wards, cities, towns, villages, islands) are defined as TypeScript enums in `types/database.ts`. Use the `TokyoDistrict` type for district fields and the `T_DISTRICTS` array for iteration.

### Service Categories

Defined in `types/database.ts`:
- 訪問系サービス (Visit-based services)
- 日中活動系サービス (Day activity services)
- 施設系サービス (Facility services)
- 居住系サービス (Residential services)
- 訓練系・就労系サービス (Training/employment services)
- 障害児通所系サービス (Children's day services)
- 障害児入所系サービス (Children's residential services)
- 相談系サービス (Consultation services)

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Warning**: The README.md contains actual credentials. These should be rotated and removed from documentation in production.

## Build Configuration

- ESLint errors are ignored during builds (`eslint.ignoreDuringBuilds: true`)
- TypeScript errors are ignored during builds (`typescript.ignoreBuildErrors: true`)
- Remote images from `picsum.photos` are allowed

## Important Implementation Details

### Nested Data Fetching

When fetching facilities, services are nested using Supabase's relationship syntax:
```typescript
.select(`
  *,
  services:facility_services(
    *,
    service:services(*)
  )
`)
```

### Form Validation

Forms use React Hook Form with Zod schemas. Registration forms have separate schemas for user and facility types.

### Middleware Cookie Handling

The middleware in `utils/supabase/middleware.ts` must use `.delete()` for removing cookies, not `.set()` with empty values, to be compatible with Next.js 15.

### API Routes

- Use Service Role key for admin operations (search, data fetching)
- Use anon key for user-scoped operations
- Always validate user authentication for protected endpoints
