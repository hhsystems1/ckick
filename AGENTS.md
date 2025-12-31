# AGENTS.md - OpenCode Configuration for Ckick

## Project Overview

Ckick is a web-based IDE and project scaffolding platform that allows users to create, edit, and manage code projects directly in the browser. The platform supports multiple project templates (Next.js, Node.js, Python) and features a full-featured code editor with syntax highlighting, file management, and real-time saving.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase (Auth + Database)
- **Code Editor**: CodeMirror 6
- **Package Manager**: npm
- **Compiler**: React Compiler (babel-plugin-react-compiler)

## Project Structure

```
ckick/
├── public/                 # Static assets (SVG icons)
├── src/
│   ├── app/               # Next.js App Router pages and API routes
│   │   ├── api/          # API routes
│   │   │   ├── auth/     # Authentication callbacks
│   │   │   ├── files/    # File operations
│   │   │   └── projects/ # Project CRUD operations
│   │   ├── components/   # App-specific components
│   │   │   ├── layout/   # Layout components (AppShell, TopBar, ModeSwitcher)
│   │   │   └── ui/       # UI components (Badge, Button, Card, IconButton, ProjectRow)
│   │   ├── editor/       # Editor page route
│   │   ├── home/         # Home page
│   │   └── layout.tsx    # Root layout
│   ├── components/        # Shared components
│   │   ├── auth/         # Authentication components (SignIn, SignInForm)
│   │   └── ui/           # Shared UI components
│   ├── screens/           # Screen-level components
│   │   ├── AgentPrompt.tsx
│   │   ├── EditorShell.tsx
│   │   └── Home.tsx
│   ├── lib/              # Utility functions and configurations
│   │   ├── db.ts         # Prisma client singleton
│   │   ├── supabase/     # Supabase client utilities
│   │   │   ├── client.ts # Browser client
│   │   │   ├── server.ts # Server client (with service role)
│   │   │   └── queries.ts # Database queries
│   │   └── utils.ts      # Common utilities (cn, formatDate, formatTimeAgo)
│   ├── types/            # TypeScript type definitions
│   │   └── database.ts   # Database types
│   ├── env.mjs           # Environment variable validation (zod + @t3-oss/env-nextjs)
│   ├── middleware.ts     # Next.js middleware (auth protection)
│   └── styles/
│       └── globals.css   # Global styles
├── prisma/
│   └── schema.prisma     # Prisma schema (User, Project, File models)
├── eslint.config.mjs     # ESLint configuration
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Database Schema

### User
- `id`: UUID primary key
- `email`: Unique email address
- `name`: Optional user name
- `avatar_url`: Optional avatar URL
- `projects`: One-to-many relation with Project
- `created_at`, `updated_at`: Timestamps

### Project
- `id`: UUID primary key
- `name`: Project name
- `description`: Optional description
- `userId`: Foreign key to User
- `user`: Relation to User
- `files`: One-to-many relation with File
- `createdAt`, `updatedAt`: Timestamps

### File
- `id`: UUID primary key
- `path`: File path (unique per project)
- `content`: File content (default empty string)
- `projectId`: Foreign key to Project
- `project`: Relation to Project
- `updatedAt`: Timestamp

## Coding Conventions

### TypeScript
- Use TypeScript for all code
- Prefer interfaces over type aliases for object shapes
- Use explicit return types for functions
- Use `const` for component props interfaces (e.g., `ButtonProps`)
- Use forwardRef for components that need ref forwarding

### Components
- Use functional components with hooks
- Prefix component files with capital letters (e.g., `CodeEditor.tsx`)
- Use the `'use client'` directive for client-side components
- Organize props into an interface named after the component (e.g., `CodeEditorProps`)
- Use forwardRef when ref forwarding is needed

### Styling
- Use Tailwind CSS for all styling
- Use `cn()` utility from `@/lib/utils` for class merging
- Follow the `bg-*`, `text-*`, `border-*` pattern for colors
- Use semantic variant classes (e.g., `hover:bg-primary/90`)

### File Naming
- Component files: PascalCase (e.g., `CodeEditor.tsx`)
- Utility files: camelCase (e.g., `utils.ts`)
- Route files: kebab-case for dynamic routes (e.g., `[projectId]/page.tsx`)

### Import Patterns
- Use `@/` alias for imports from `src/` directory
- Use absolute imports (no relative paths beyond component files)
- Group imports: external → internal → components/ui

### API Routes
- Use Next.js App Router API routes (`src/app/api/`)
- Use `NextRequest` and `NextResponse` types
- Always handle errors with try/catch and return appropriate error responses
- Log errors with context: `console.error('METHOD /path:', error)`

### Environment Variables
- All environment variables are validated in `src/env.mjs` using zod
- Server-only variables in `server` object
- Client-exposed variables in `client` object
- Use `z.string().optional()` for optional vars
- Use `z.string().url()` for URLs
- Never expose sensitive keys to client (use `NEXT_PUBLIC_` prefix only for safe vars)

### State Management
- Use React hooks (useState, useEffect, useCallback, useRef)
- Use `useCallback` for callback functions passed to child components
- Use `useRef` for mutable values that don't trigger re-renders

### CodeMirror Editor
- Use `@codemirror/` packages for editor functionality
- Custom themes follow the "Rivryn" dark theme pattern
- Language extensions for JS/TS, Python, Markdown, HTML, JSON
- Autosave with 1-second debounce after changes

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Database Commands

```bash
npx prisma generate    # Generate Prisma client
npx prisma db push     # Push schema to database
npx prisma studio      # Open Prisma Studio
```

## Key Files Reference

- **Editor**: `src/components/CodeEditor.tsx` - CodeMirror-based editor with language detection
- **Project API**: `src/app/api/projects/route.ts` - GET/POST project endpoints with templates
- **File API**: `src/app/api/files/route.ts` - File operations
- **Supabase Auth**: `src/lib/supabase/` - Client/server Supabase setup
- **Env Validation**: `src/env.mjs` - All environment variable definitions
- **Database Types**: `src/types/database.ts` - Generated from Prisma

## Common Patterns

### Client Component Pattern
```typescript
'use client'

import { useState, useCallback } from 'react'

export function ComponentName() {
  const [state, setState] = useState(initialValue)
  const handleAction = useCallback(() => { /* ... */ }, [deps])
  return <div>...</div>
}
```

### API Error Handling
```typescript
try {
  // operation
  return NextResponse.json(data)
} catch (error) {
  console.error('METHOD /endpoint:', error)
  return NextResponse.json({ error: 'User-friendly message' }, { status: 500 })
}
```

### Tailwind Class Merging
```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  "base classes",
  {
    "conditional classes": condition,
  },
  className
)} />
```

## Development Workflow

1. Create feature branches from main
2. Run `npm run lint` before committing
3. Test changes with `npm run dev`
4. Build with `npm run build` to catch production issues

## Notes

- The project uses the React Compiler for experimental optimizations
- Supabase auth is handled via `@supabase/ssr` for SSR compatibility
- All Supabase client creation uses the factory pattern from `createClient()`
- The editor supports multiple templates (nextjs, node, python)
- File paths in the database are unique per project (`@@unique([projectId, path])`)
