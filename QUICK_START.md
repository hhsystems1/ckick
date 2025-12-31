# Rivryn Quick Start Guide

## Development Setup

### 1. Environment Variables
Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get these from Supabase Project Settings > API

### 2. Database Setup
1. Go to your Supabase project's SQL Editor
2. Create a new query and paste the contents of `supabase-migration.sql`
3. Execute the query
4. Verify tables are created: projects, files, task_runs, agent_changes, user_settings

### 3. Install & Run
```bash
npm install
npm run dev
```

Visit: http://localhost:3000

### 4. Test the App

1. **Sign In**
   - Enter any email address
   - Check your email for magic link
   - Click link to sign in

2. **Create a Project**
   - Click the + FAB button
   - Enter project name
   - Select template (Next.js, Node, Python)
   - Click Create
   - You'll be redirected to the editor

3. **Edit Code**
   - Click any file to open in editor
   - Make changes (auto-saves after 1 second)
   - Switch modes with bottom pills

4. **Create Files**
   - Click the + in the Files panel
   - Enter filename
   - New file created

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Auth/home route
│   ├── home/page.tsx         # Home screen
│   ├── editor/[projectId]/   # Editor page
│   ├── api/
│   │   ├── projects/route.ts # Project CRUD
│   │   ├── files/route.ts    # File CRUD
│   │   └── auth/signin/      # Auth endpoint
│   └── auth/callback/        # Magic link callback
├── components/
│   ├── HomeScreen.tsx        # Main home UI
│   ├── CodeEditor.tsx        # CodeMirror wrapper
│   ├── FileExplorer.tsx      # File tree
│   ├── ModeSwitcher.tsx      # Bottom mode selector
│   └── auth/SignInForm.tsx   # Login form
├── screens/
│   └── EditorShell.tsx       # Editor layout
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Client init
│   │   ├── server.ts         # Server init
│   │   └── queries.ts        # DB queries
│   └── utils.ts
└── styles/
    └── globals.css

tailwind.config.ts           # Rivryn color tokens
supabase-migration.sql       # Database schema + RLS
```

## Key Components

### HomeScreen
- Displays recent projects
- New project creation UI
- Sign out button

### EditorShell
- File explorer
- CodeMirror editor
- Mode switcher (Code/Agent/Terminal/Preview)

### CodeEditor
- Syntax highlighting
- Auto-save
- Undo/redo
- Rivryn dark theme

## Color System

All colors defined in `tailwind.config.ts`:

```
Primary: #4FB6A1 (Flow Teal)
Success: #6FAE7A (Moss Pass)
Error: #C97A4A (Iron Clay)
Background: #0E1110
Surface: #1A1F1D
Text: #F4F6F5
```

Use class names directly: `bg-accent`, `text-success`, etc.

## API Endpoints

### POST /api/auth/signin
Sign in with magic link
```json
{ "email": "user@example.com" }
```

### GET /api/projects?userId=xxx
List user projects

### POST /api/projects
Create project
```json
{ "userId": "xxx", "name": "My App", "template": "nextjs" }
```

### GET /api/files?projectId=xxx
List project files

### POST /api/files
Create file
```json
{ "projectId": "xxx", "name": "app.ts", "path": "/app.ts", "content": "" }
```

### PATCH /api/files
Update file
```json
{ "id": "xxx", "content": "new content" }
```

### DELETE /api/files?id=xxx
Delete file

## Deployment

### Vercel
```bash
npm run build
# Deploy via Vercel dashboard or CLI
vercel
```

### Self-Hosted
```bash
npm run build
npm run start
```

Set environment variables before starting.

## Troubleshooting

### "Cannot find module '@codemirror/...'"
Run `npm install` to ensure all dependencies are installed

### "Auth failed" error
- Check Supabase credentials in `.env.local`
- Ensure magic link email is enabled in Supabase Auth settings
- Check RLS policies are enabled

### Files not saving
- Check browser console for errors
- Verify Supabase connection
- Ensure RLS policies allow writes

### Editor looks blank
- Check browser console for JavaScript errors
- Verify CodeMirror is loading (check Network tab)
- Try refresh page

## Next Week Features

- AI Agent chat with diffs
- Apply/undo for code changes
- Task execution (lint, test, build)
- Quality gate preview blocking
- Provider settings (Groq/Claude)

## Architecture Notes

- **Auth**: Supabase magic link only (no passwords)
- **Data**: All user data in Supabase with RLS
- **Editor**: CodeMirror 6 (mobile-optimized)
- **UI**: Tailwind CSS with custom color system
- **Routing**: Next.js App Router
- **Styling**: Mobile-first responsive design

## Support

For issues, check:
1. Browser console (F12 > Console)
2. Network tab (F12 > Network)
3. Supabase dashboard logs
4. `.env.local` configuration
