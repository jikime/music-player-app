# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.4.2 music streaming application built with React 19, TypeScript, and Tailwind CSS 4. The app uses shadcn/ui components based on Radix UI primitives for a modern, accessible UI.

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
- **Next.js 15.4.2** with App Router (`/src/app/`)
- **React 19.1.0** with TypeScript
- **Tailwind CSS 4** with custom theme variables in `globals.css`
- **shadcn/ui** components in `/src/components/ui/`
- **Radix UI** for accessible primitives (Avatar, ScrollArea, Slider, etc.)

### Key Files and Patterns

1. **Main Application Component**: `src/components/music-streaming-app.tsx`
   - Central component containing all music player functionality
   - Manages state for playlists, playback, and UI interactions
   - Uses mock data for songs, playlists, and user bookmarks

2. **Component Structure**:
   - shadcn/ui components are in `src/components/ui/`
   - Use the `cn()` utility from `src/lib/utils.ts` for className merging
   - Components follow the shadcn/ui pattern with forwardRef and displayName

3. **Styling Approach**:
   - Tailwind CSS 4 with inline theme syntax
   - CSS variables defined in `globals.css` for theming
   - Dark theme with purple/indigo gradients and glassmorphism effects
   - Use oklch color space for color definitions

4. **TypeScript Configuration**:
   - Path alias: `@/*` maps to `./src/*`
   - Strict mode enabled
   - Use proper TypeScript types for all components and functions

## Development Guidelines

1. **Adding New UI Components**:
   - Check if shadcn/ui has the component first
   - Follow existing component patterns in `src/components/ui/`
   - Use Radix UI primitives when building custom components

2. **State Management**:
   - Currently using React useState for local state
   - Main app state is managed in `music-streaming-app.tsx`

3. **Icons**:
   - Use Lucide React icons (already installed)
   - Import icons as needed: `import { Play, Pause, etc } from 'lucide-react'`

4. **Testing**:
   - No test framework currently configured
   - When adding tests, check with user for preferred testing approach

## Current Project State

The application includes:
- Sidebar navigation (Discover, Trending, Streaming)
- Playlist management with create/delete functionality
- Bookmarks/saved songs feature
- Recently played section
- Top 100 Billboard list
- Full music player controls (play/pause, skip, volume, progress)
- Mock data for demonstration purposes