# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Modern music streaming application built with Next.js 15.4.2, React 19, TypeScript, and Supabase. Features authentication, playlist management, real-time music playback, and responsive design with a dark theme interface.

## Essential Commands

```bash
# Development
npm run dev        # Start development server on http://localhost:3000

# Production
npm run build      # Build for production
npm start          # Start production server

# Code Quality
npm run lint       # Run ESLint checks
```

## Architecture

### Tech Stack
- **Next.js 15.4.2** with App Router and React 19.1.0
- **TypeScript** with strict mode and path alias `@/*` → `./src/*`
- **Supabase** for backend (PostgreSQL database, authentication)
- **NextAuth.js** for authentication with email/password and Google OAuth
- **Zustand** for global state management
- **React Query** for server state management
- **Tailwind CSS 4** with custom theme variables and oklch color space
- **shadcn/ui** components based on Radix UI primitives
- **React Player** and **Wavesurfer.js** for audio playback

### Key Architecture Patterns

#### Authentication & Authorization
- JWT-based authentication with NextAuth.js
- Middleware-based route protection (`src/middleware.ts`)
- Protected routes: `/`, `/playlist/*`, `/trending`, and all `/api/*` except auth endpoints
- User data isolation via `user_id` foreign keys (no RLS)

#### State Management Architecture
- **Zustand Store** (`src/lib/store.ts`): Central music player state, songs, playlists, bookmarks
- **React Query**: Server state caching and synchronization
- **Player State**: Includes queue management, playlist context, shuffle/repeat modes

#### Database Schema
Core tables: `users`, `songs`, `playlists`, `playlist_songs`, `bookmarks`, `trending_snapshots`, `trending_rankings`

#### Responsive Design
- **Mobile Hook**: `src/hooks/use-mobile.ts` with 768px breakpoint
- **Mobile-first**: Responsive design with mobile considerations

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages (signin, signup)
│   ├── (protected)/       # Protected routes with layout
│   └── api/               # API routes (songs, playlists, bookmarks, trending)
├── components/
│   ├── layout/           # Sidebar, header, navigation components
│   ├── ui/               # shadcn/ui components
│   ├── songs/            # Music player, song management
│   └── playlist/         # Playlist creation/management
├── lib/                  # Core utilities
│   ├── store.ts         # Zustand store (central state management)
│   ├── api.ts           # API client functions
│   ├── supabase.ts      # Supabase client configuration
│   └── auth.ts          # NextAuth configuration
├── hooks/               # Custom React hooks including use-mobile.ts
└── types/               # TypeScript type definitions
```

## Development Guidelines

### Working with State
- **Music Store**: Use `useMusicStore()` for player state, songs, playlists, bookmarks
- **Player Context**: The store manages playlist playbook context and queue behavior
- **API Integration**: Store methods handle API calls and state updates automatically

### Responsive Development
- Use `useIsMobile()` hook from `src/hooks/use-mobile.ts` for responsive logic
- Mobile breakpoint: 768px (matches Tailwind's `md:` breakpoint)
- Apply mobile-specific layouts and interactions using the hook

### Component Patterns
- Follow shadcn/ui patterns with forwardRef and displayName
- Use `cn()` utility from `src/lib/utils.ts` for className merging
- Import Lucide React icons as needed
- Apply Tailwind CSS 4 with inline theme syntax

### API Development
- Protected endpoints require authentication via middleware
- Use server-side session validation in API routes
- Follow RESTful patterns for CRUD operations
- Handle user data isolation with `user_id` filtering

### Authentication Flow
1. Middleware checks JWT tokens for protected routes
2. Unauthenticated users redirected to `/signin`
3. API routes validate sessions using `getServerSession`
4. User data filtered by authenticated user's `user_id`

## Environment Requirements

Required environment variables:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GOOGLE_CLIENT_ID=your-google-client-id (optional)
GOOGLE_CLIENT_SECRET=your-google-client-secret (optional)
```

## Development Workflow

### Git and Issue Management
- Always create a meaningful git commit with a clear description of changes
- When completing a task:
  - Create a descriptive git commit explaining the work done
  - Generate a corresponding GitHub issue to track the work
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.