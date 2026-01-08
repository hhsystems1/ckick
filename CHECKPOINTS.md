# Migration Checkpoints - ckick Monaco Fix

## Current Status: 🔴 Not Started

---

## Checkpoint 1: Environment Cleanup 🟡
**Assigned to:** Agent 1 (Cleaner)  
**Estimated time:** 15 minutes  
**Goal:** Remove all confusion, clean slate

### Tasks:
- [ ] Kill any running dev servers
- [ ] Run: `rm -rf .next node_modules .swc`
- [ ] Run: `rm -rf public/_next`
- [ ] Run: `rm package-lock.json`
- [ ] Run: `grep -r "codemirror" src/ --include="*.ts" --include="*.tsx"`
  - If found: Remove ALL codemirror references
- [ ] Run: `npm install`
- [ ] Run: `npm run build` (should succeed)

### Success Criteria:
```bash
# Must pass these tests:
grep -r "codemirror" . --include="*.ts" --include="*.tsx" --include="*.json"
# Output: (nothing found)

npm run build
# Output: Build succeeded
```

### Human Verification Required:
- [ ] I confirm: No CodeMirror references exist
- [ ] I confirm: Build completes without errors
- [ ] I confirm: node_modules installed successfully

**STOP HERE. Do not proceed until human approves.**

---

## Checkpoint 2: Update Dependencies 🟡
**Assigned to:** Agent 2 (Updater)  
**Estimated time:** 5 minutes  
**Goal:** Get Monaco to correct version

### Tasks:
- [ ] Run: `npm install @monaco-editor/react@^4.7.0`
- [ ] Run: `npm install xterm@^5.5.0 xterm-addon-fit@^0.10.0`
- [ ] Verify package.json shows:
  ```json
  "@monaco-editor/react": "^4.7.0",
  "xterm": "^5.5.0"
  ```

### Success Criteria:
- [ ] package.json updated
- [ ] npm install succeeds
- [ ] No peer dependency warnings

### Human Verification Required:
- [ ] I confirm: Dependencies updated
- [ ] I confirm: No error messages

**STOP HERE. Do not proceed until human approves.**

---

## Checkpoint 3: Create Monaco Config Files 🟡
**Assigned to:** Agent 3 (Configurator)  
**Estimated time:** 20 minutes  
**Goal:** Set up Monaco for Next.js

### Tasks:

#### Task 3.1: Create monaco-config.ts
- [ ] Create file: `lib/monaco-config.ts`
- [ ] Content:
```typescript
export const monacoConfig = {
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
};

// Monaco editor options
export const defaultEditorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on' as const,
  theme: 'vs-dark'
};
```

#### Task 3.2: Update next.config.js
- [ ] Backup current next.config.js (copy to next.config.js.backup)
- [ ] Update next.config.js with:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Monaco Editor requires these for browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Optimize Monaco imports
  experimental: {
    optimizePackageImports: ['@monaco-editor/react']
  }
};

module.exports = nextConfig;
```

#### Task 3.3: Create CodeEditor Component
- [ ] Create file: `components/CodeEditor.tsx`
- [ ] Content:
```typescript
'use client';

import dynamic from 'next/dynamic';
import { defaultEditorOptions } from '@/lib/monaco-config';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">Loading Monaco Editor...</div>
      </div>
    )
  }
);

interface CodeEditorProps {
  defaultValue?: string;
  defaultLanguage?: string;
  onChange?: (value: string | undefined) => void;
  theme?: string;
  height?: string;
}

export function CodeEditor({ 
  defaultValue = '// Start coding...',
  defaultLanguage = 'javascript',
  onChange,
  theme = 'vs-dark',
  height = '100vh'
}: CodeEditorProps) {
  return (
    <MonacoEditor
      height={height}
      defaultLanguage={defaultLanguage}
      defaultValue={defaultValue}
      onChange={onChange}
      theme={theme}
      options={defaultEditorOptions}
      beforeMount={(monaco) => {
        // Monaco is ready
        console.log('Monaco Editor loaded successfully');
      }}
      onMount={(editor, monaco) => {
        // Editor is mounted
        console.log('Monaco Editor mounted');
        // Focus editor
        editor.focus();
      }}
    />
  );
}
```

### Success Criteria:
- [ ] `lib/monaco-config.ts` exists
- [ ] `components/CodeEditor.tsx` exists
- [ ] `next.config.js` has webpack config
- [ ] TypeScript check passes: `npm run build`

### Human Verification Required:
- [ ] I confirm: All 3 files created
- [ ] I confirm: Build succeeds with new config
- [ ] I confirm: No TypeScript errors

**STOP HERE. Do not proceed until human approves.**

---

## Checkpoint 4: Integration Test 🟡
**Assigned to:** Agent 4 (Integrator)  
**Estimated time:** 15 minutes  
**Goal:** Wire Monaco into actual page

### Tasks:

#### Task 4.1: Find Current Editor Usage
- [ ] Search for current editor in codebase:
  ```bash
  grep -r "editor" app/ --include="*.tsx" | grep -i "monaco\|codemirror"
  ```
- [ ] Document which file(s) use the editor
- [ ] Note the component path

#### Task 4.2: Update Page to Use New CodeEditor
Example for a page at `app/editor/page.tsx`:
```typescript
import { CodeEditor } from '@/components/CodeEditor';

export default function EditorPage() {
  return (
    <div className="h-screen w-full">
      <CodeEditor 
        defaultLanguage="typescript"
        defaultValue="// Monaco is working!"
      />
    </div>
  );
}
```

- [ ] Update the page/component
- [ ] Remove old editor imports
- [ ] Save file

#### Task 4.3: Test Build
- [ ] Run: `npm run build`
- [ ] Check for errors
- [ ] Fix any import path issues

### Success Criteria:
- [ ] Build succeeds
- [ ] No import errors
- [ ] No TypeScript errors
- [ ] Page imports CodeEditor correctly

### Human Verification Required:
- [ ] I confirm: Build succeeds
- [ ] I confirm: Ready to test in browser

**STOP HERE. Do not proceed until human approves.**

---

## Checkpoint 5: Browser Verification 🟡
**Assigned to:** Agent 5 (Tester) + HUMAN  
**Estimated time:** 10 minutes  
**Goal:** Confirm Monaco renders in browser

### Tasks:

#### Task 5.1: Start Dev Server
- [ ] Run: `npm run dev`
- [ ] Wait for "Ready" message
- [ ] Note the URL (usually http://localhost:3000)

#### Task 5.2: Open Browser (HUMAN DOES THIS)
- [ ] Open browser to dev server URL
- [ ] Navigate to page with editor
- [ ] Wait for page to load

#### Task 5.3: Visual Checks (HUMAN DOES THIS)
- [ ] Can see Monaco editor (dark theme)
- [ ] Can see line numbers on left
- [ ] Can see code (or placeholder text)
- [ ] NO CodeMirror visible anywhere

#### Task 5.4: Interaction Test (HUMAN DOES THIS)
- [ ] Click into editor area
- [ ] Type some code
- [ ] Code appears as you type
- [ ] Syntax highlighting works

#### Task 5.5: Console Check (HUMAN DOES THIS)
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab
- [ ] Look for: "Monaco Editor loaded successfully"
- [ ] Verify: NO errors about workers
- [ ] Verify: NO 404s for Monaco files

### Success Criteria:
```
✅ Monaco editor visible
✅ Can type in editor
✅ Syntax highlighting works
✅ No console errors
✅ No CodeMirror visible
✅ Console shows "Monaco Editor loaded successfully"
```

### If ANY checks fail:

**Common Issue 1: Blank screen**
- Solution: Hard refresh (Cmd/Ctrl + Shift + R)
- Check: Network tab for 404s

**Common Issue 2: Console errors about workers**
- Solution: Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run dev`

**Common Issue 3: Still see CodeMirror**
- Solution: Clear browser cache
- Try incognito window

### Human Final Verification:
- [ ] ✅ Monaco editor is fully working
- [ ] ✅ I can code in it
- [ ] ✅ No issues detected

**IF ALL CHECKS PASS: MIGRATION COMPLETE! 🎉**

---

## Checkpoint 6: Cleanup & Documentation 🟡
**Assigned to:** Agent 6 (Documenter)  
**Estimated time:** 10 minutes  
**Goal:** Document what was done

### Tasks:
- [ ] Create `MIGRATION_COMPLETE.md` with:
  - What was changed
  - Files created
  - Files modified
  - How to use CodeEditor component
  - Known issues (if any)
- [ ] Delete backup files (if any)
- [ ] Commit changes to git:
  ```bash
  git add .
  git commit -m "Fix: Configure Monaco Editor for Next.js"
  ```

### Human Verification:
- [ ] I have read MIGRATION_COMPLETE.md
- [ ] I understand the changes
- [ ] Changes are committed

**PROJECT COMPLETE! 🚀**

---

## Emergency Rollback

If things break badly:

```bash
# 1. Restore next.config.js
cp next.config.js.backup next.config.js

# 2. Revert dependencies
git checkout package.json package-lock.json

# 3. Clean and reinstall
rm -rf node_modules .next
npm install

# 4. Restart dev server
npm run dev
```

Then consult REPO_ANALYSIS.md to see what went wrong.

---

## Agent Instructions

**CRITICAL RULES:**
1. Complete ONE checkpoint at a time
2. STOP after each checkpoint completion
3. Wait for human approval before next checkpoint
4. If error occurs: STOP and report, don't try to fix
5. Never skip checkpoints
6. Never combine checkpoints

**After completing your checkpoint, say:**
> "Checkpoint [N] complete. Verification required. Please review checklist above and confirm before I proceed to Checkpoint [N+1]."
