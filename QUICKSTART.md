# Quick Start: Fix Monaco in ckick

**Goal:** Get Monaco Editor working in your ckick Next.js app in ~60 minutes

---

## Before You Start

### ✅ Prerequisites Checklist
- [ ] Both repos open in Windsurf (CodeCanvas and ckick)
- [ ] Terminal open in ckick directory
- [ ] No dev server currently running
- [ ] Git status clean (commit any current work first)

### 📁 Files You Need
Transfer these 3 files to your **ckick** repository:
1. `REPO_ANALYSIS.md` - Explains the problem and solution
2. `CHECKPOINTS.md` - Step-by-step tasks with verification
3. `AGENT_PROMPTS.md` - Exact prompts for Windsurf

---

## The 60-Minute Plan

| Time | Agent | What Happens | Your Action |
|------|-------|--------------|-------------|
| 0-15 min | Agent 1 | Clean environment | Verify no CodeMirror |
| 15-20 min | Agent 2 | Update deps | Verify package.json |
| 20-40 min | Agent 3 | Create configs | Verify 3 files exist |
| 40-55 min | Agent 4 | Wire Monaco | Verify build |
| 55-60 min | You + Agent 5 | Test browser | Verify Monaco works |
| 60-70 min | Agent 6 | Document | Done! 🎉 |

---

## Step-by-Step Execution

### Step 1: Add Files to ckick Repo (2 min)

In your **ckick** repo root, create:
```bash
cd /path/to/ckick

# Create these files (content from Claude)
# - REPO_ANALYSIS.md
# - CHECKPOINTS.md
# - AGENT_PROMPTS.md
```

### Step 2: Start Agent 1 (15 min)

1. **Open Windsurf Cascade:** Cmd/Ctrl+Shift+P → "Cascade"
2. **Copy from AGENT_PROMPTS.md:** The "Agent 1: Environment Cleaner" prompt
3. **Paste into Cascade**
4. **Watch it work**
5. **When it stops:** Check that:
   - Build succeeded
   - No CodeMirror found in grep
   - node_modules installed

**If good:** Type "Proceed" and move to Step 3  
**If bad:** Read error, fix, try again

---

### Step 3: Start Agent 2 (5 min)

1. **Close previous Cascade** (clears context)
2. **Open new Cascade**
3. **Copy from AGENT_PROMPTS.md:** The "Agent 2: Dependency Updater" prompt
4. **Paste into Cascade**
5. **When it stops:** Check package.json shows:
   ```json
   "@monaco-editor/react": "^4.7.0"
   ```

**If good:** Proceed to Step 4  
**If bad:** Check npm errors, try again

---

### Step 4: Start Agent 3 (20 min)

1. **Close Cascade, open new one**
2. **Copy from AGENT_PROMPTS.md:** The "Agent 3: Configuration Creator" prompt
3. **Paste into Cascade**
4. **When it stops:** Verify files exist:
   ```bash
   ls lib/monaco-config.ts
   ls components/CodeEditor.tsx
   ls next.config.js.backup
   ```
5. **Check build:** Should succeed with no errors

**If good:** Proceed to Step 5  
**If bad:** Check which file is missing, ask agent to create it

---

### Step 5: Start Agent 4 (15 min)

1. **Close Cascade, open new one**
2. **Copy from AGENT_PROMPTS.md:** The "Agent 4: Integrator" prompt
3. **Paste into Cascade**
4. **When it stops:** Check:
   - Your editor page now imports `CodeEditor`
   - Build succeeds
   - No import errors

**If good:** Proceed to Step 6 (THE MOMENT OF TRUTH)

---

### Step 6: Browser Test - YOU DO THIS (5 min)

1. **Close Cascade, open new one**
2. **Copy from AGENT_PROMPTS.md:** The "Agent 5: Tester" prompt
3. **Agent starts dev server**
4. **When server ready:**
   - Open browser to http://localhost:3000
   - Navigate to your editor page
   - **LOOK FOR MONACO EDITOR** (dark theme, line numbers)

#### ✅ Success Looks Like:
- Monaco editor visible
- Can click into it
- Can type code
- Syntax highlighting works
- Console says "Monaco Editor loaded successfully"
- **NO CodeMirror visible**

#### ❌ If You Don't See Monaco:
- Hard refresh: Cmd/Ctrl + Shift + R
- Check console for errors
- Check Network tab for 404s
- Clear .next: `rm -rf .next` then restart dev
- Try incognito window

**When Monaco works:** Proceed to Step 7

---

### Step 7: Document & Finish (10 min)

1. **Close Cascade, open new one**
2. **Copy from AGENT_PROMPTS.md:** The "Agent 6: Documenter" prompt
3. **Agent creates MIGRATION_COMPLETE.md**
4. **Review the doc**
5. **Commit changes:**
   ```bash
   git add .
   git commit -m "Fix: Configure Monaco Editor for Next.js"
   ```

**🎉 DONE! Monaco is working!**

---

## Troubleshooting

### Monaco Still Shows CodeMirror

**Likely cause:** Browser cache

**Fix:**
```bash
# 1. Stop dev server (Ctrl+C)
# 2. Clear build
rm -rf .next
# 3. Clear browser cache or use incognito
# 4. Restart
npm run dev
```

---

### Build Fails at Checkpoint 3

**Likely cause:** TypeScript path errors

**Fix:**
- Check `tsconfig.json` has:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./*"]
      }
    }
  }
  ```

---

### Import Error: Cannot Find '@/lib/monaco-config'

**Likely cause:** File in wrong location

**Fix:**
```bash
# Verify file exists
ls lib/monaco-config.ts

# If not, create it per CHECKPOINTS.md Checkpoint 3
```

---

### Monaco Loads But Can't Type

**Likely cause:** Editor not focused

**Fix:** Already handled in CodeEditor.tsx with `editor.focus()` in onMount

---

### "Module not found: Can't resolve 'fs'"

**Likely cause:** Next.js webpack config missing

**Fix:** 
- Check next.config.js has the webpack fallback config
- See CHECKPOINTS.md Checkpoint 3 Task 3.2

---

## What You'll Have After Success

```
ckick/
├── lib/
│   └── monaco-config.ts          ← NEW
├── components/
│   └── CodeEditor.tsx             ← NEW
├── next.config.js                 ← MODIFIED
├── package.json                   ← UPDATED
├── MIGRATION_COMPLETE.md          ← NEW
└── [your editor page]             ← MODIFIED to use CodeEditor
```

---

## How to Use Your New CodeEditor

After migration, anywhere you need Monaco:

```typescript
import { CodeEditor } from '@/components/CodeEditor';

export default function MyPage() {
  return (
    <CodeEditor 
      defaultLanguage="typescript"
      defaultValue="console.log('Hello');"
      onChange={(value) => console.log(value)}
      theme="vs-dark"
      height="500px"
    />
  );
}
```

---

## Why This Works

**The Problem:**
- Next.js doesn't bundle Monaco web workers by default
- CodeCanvas uses Vite (which does)
- Can't just copy CodeCanvas code to Next.js

**The Solution:**
- Disable SSR for Monaco (dynamic import)
- Configure webpack to exclude Node.js modules
- Use CDN for Monaco workers
- Create proper Next.js wrapper component

**The Process:**
- Agents do one task at a time
- You verify each step
- No going in circles
- Clear success criteria

---

## Next Steps After Monaco Works

1. **Add file tree** (if you want one)
2. **Integrate with Supabase** for saving files
3. **Add terminal** (you have xterm installed)
4. **Port other ckick features** one at a time
5. **Consider CodeCanvas layout** (resizable panels)

But do these AFTER Monaco works. One thing at a time.

---

## Ready?

**Right now:**
1. Copy REPO_ANALYSIS.md, CHECKPOINTS.md, and AGENT_PROMPTS.md to your ckick repo
2. Open Windsurf in ckick directory
3. Start with Agent 1 prompt
4. Follow the checkpoints
5. Post back when Monaco renders!

**You got this! 💪**

The agent system will keep you from going in circles because:
- ✅ Each agent has ONE job
- ✅ You verify before next step
- ✅ Clear stop points
- ✅ Documented success criteria

No more "ready for deployment" after simple tasks. Real checkpoints. Real progress.

**Start now. See Monaco working in 60 minutes.** ⏱️
