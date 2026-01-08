# Agent Execution Guide

This file contains exact prompts to use for each agent in Windsurf or Claude Code.

---

## How to Use This Guide

1. **Copy the prompt** for Agent 1
2. **Paste into Windsurf Cascade** (or new Claude Code session)
3. **Wait for agent to complete** and STOP
4. **You verify** the checkpoint
5. **If good:** Copy prompt for Agent 2
6. **Repeat** until all checkpoints done

---

## Agent 1: Environment Cleaner

**Copy this entire prompt into Windsurf:**

```
You are Agent 1: Environment Cleaner

Your job: Execute Checkpoint 1 from CHECKPOINTS.md

Read the file CHECKPOINTS.md in this repository.

Execute ONLY the tasks under "Checkpoint 1: Environment Cleanup"

Specifically:
1. Run command: rm -rf .next node_modules .swc
2. Run command: rm -rf public/_next
3. Run command: rm package-lock.json
4. Run command: grep -r "codemirror" . --include="*.ts" --include="*.tsx" --include="*.json"
5. If grep finds anything: Show me what you found and ask how to proceed
6. Run command: npm install
7. Run command: npm run build

After completing these tasks:
- Show me the output of each command
- Mark checkboxes in CHECKPOINTS.md as complete
- STOP and say: "Checkpoint 1 complete. Please verify build succeeded and no CodeMirror found before proceeding to Checkpoint 2."

Do NOT proceed to Checkpoint 2.
Do NOT create any files yet.
Do NOT modify code yet.

Begin.
```

---

## Agent 2: Dependency Updater

**After you verify Checkpoint 1, copy this:**

```
You are Agent 2: Dependency Updater

Your job: Execute Checkpoint 2 from CHECKPOINTS.md

Read CHECKPOINTS.md in this repository.

Execute ONLY the tasks under "Checkpoint 2: Update Dependencies"

Specifically:
1. Run: npm install @monaco-editor/react@^4.7.0
2. Run: npm install xterm@^5.5.0 xterm-addon-fit@^0.10.0
3. Show me the updated dependencies from package.json
4. Verify no peer dependency warnings

After completing:
- Show me package.json dependencies section
- Mark Checkpoint 2 checkboxes complete
- STOP and say: "Checkpoint 2 complete. Please verify dependencies updated correctly before proceeding to Checkpoint 3."

Do NOT proceed to Checkpoint 3.
Do NOT create config files yet.

Begin.
```

---

## Agent 3: Configuration Creator

**After you verify Checkpoint 2, copy this:**

```
You are Agent 3: Configuration Creator

Your job: Execute Checkpoint 3 from CHECKPOINTS.md

Read CHECKPOINTS.md in this repository.

Execute ONLY the tasks under "Checkpoint 3: Create Monaco Config Files"

You must create exactly 3 files with the exact code specified in Checkpoint 3:

1. lib/monaco-config.ts
2. Update next.config.js (make backup first as next.config.js.backup)
3. components/CodeEditor.tsx

Use the EXACT code provided in CHECKPOINTS.md for each file.

After creating all 3 files:
- Show me the path of each created file
- Run: npm run build
- Show build output
- Mark Checkpoint 3 checkboxes complete
- STOP and say: "Checkpoint 3 complete. Please verify all 3 files exist and build succeeds before proceeding to Checkpoint 4."

Do NOT proceed to Checkpoint 4.
Do NOT modify other files.

Begin.
```

---

## Agent 4: Integrator

**After you verify Checkpoint 3, copy this:**

```
You are Agent 4: Integrator

Your job: Execute Checkpoint 4 from CHECKPOINTS.md

Read CHECKPOINTS.md in this repository.

Execute ONLY the tasks under "Checkpoint 4: Integration Test"

Specifically:
1. Find where the editor is currently used:
   - Search app/ directory for editor usage
   - Search components/ directory
   - Show me which files use the old editor

2. Update the page/component to use the NEW CodeEditor:
   - Import from: '@/components/CodeEditor'
   - Remove old editor imports
   - Use the example code from Checkpoint 4

3. Run: npm run build
4. Show build output

After completing:
- Show me which file(s) you modified
- Show me the new import statement
- Show build status
- Mark Checkpoint 4 checkboxes complete
- STOP and say: "Checkpoint 4 complete. Please verify build succeeds before proceeding to Checkpoint 5 (browser test)."

Do NOT start the dev server.
Do NOT add features.

Begin.
```

---

## Agent 5: Tester (Partial - Human completes)

**After you verify Checkpoint 4, copy this:**

```
You are Agent 5: Tester

Your job: Start the dev server for human testing

Read CHECKPOINTS.md in this repository.

Execute ONLY Task 5.1 under "Checkpoint 5: Browser Verification"

Specifically:
1. Run: npm run dev
2. Wait for "Ready" message
3. Show me the URL (should be http://localhost:3000)

After dev server starts:
- Confirm server is running
- Show me the URL
- STOP and say: "Dev server running at [URL]. 

HUMAN: Please complete Checkpoint 5 browser verification:
- Open browser to [URL]
- Navigate to the editor page
- Complete Tasks 5.2 through 5.5 in CHECKPOINTS.md
- Verify Monaco renders and works
- Check console for 'Monaco Editor loaded successfully'
- Confirm when Monaco is working."

Do NOT proceed further.
Wait for human confirmation that Monaco works.

Begin.
```

---

## Agent 6: Documenter

**After you confirm Monaco works in browser, copy this:**

```
You are Agent 6: Documenter

Your job: Execute Checkpoint 6 from CHECKPOINTS.md

Read CHECKPOINTS.md in this repository.

Create a file: MIGRATION_COMPLETE.md

Include in this file:
1. Summary of what was changed
2. List of files created:
   - lib/monaco-config.ts
   - components/CodeEditor.tsx
   - next.config.js (modified)
   - [any page files modified]

3. How to use the new CodeEditor component:
   - Import statement
   - Basic usage example
   - Available props

4. What was fixed:
   - Monaco now works in Next.js
   - Web workers configured
   - SSR disabled properly
   - No more CodeMirror

5. Next steps (suggestions for future work)

After creating MIGRATION_COMPLETE.md:
- Show me the file contents
- Ask: "Ready to commit changes to git?"
- If I say yes: Run git commands from Checkpoint 6
- Mark Checkpoint 6 complete
- Say: "Migration complete! 🎉"

Begin.
```

---

## Quick Reference: Agent Sequence

```
Agent 1 (Cleaner) 
    ↓ [You verify clean build]
Agent 2 (Updater)
    ↓ [You verify dependencies]
Agent 3 (Configurator)
    ↓ [You verify files created]
Agent 4 (Integrator)
    ↓ [You verify build]
Agent 5 (Tester) → YOU test in browser
    ↓ [You confirm Monaco works]
Agent 6 (Documenter)
    ↓ [Migration complete]
```

---

## Tips for Smooth Execution

### In Windsurf:
- Use **Cascade mode** (Cmd/Ctrl+Shift+P → "Cascade")
- Paste one agent prompt at a time
- Let agent complete fully before verifying
- Close Cascade between agents (clears context)

### In Claude Code:
- Start new session for each agent
- Make sure it reads CHECKPOINTS.md first
- Watch terminal output carefully
- Stop if you see errors

### Between Agents:
- Actually verify each checkpoint
- Don't skip verification steps
- Test the specific success criteria
- If something's wrong: STOP and fix before next agent

---

## What to Do If Something Breaks

**If Agent gets confused:**
- STOP the agent
- Close Cascade/session
- Verify what checkpoint was completed
- Start fresh with next agent prompt

**If build fails:**
- Read the error message carefully
- Check CHECKPOINTS.md for that step
- Fix the specific error
- Re-run the agent for that checkpoint

**If Monaco doesn't work in browser:**
- Check Checkpoint 5 troubleshooting section
- Try hard refresh
- Clear .next cache
- Check browser console
- Report specific error to me

**If you need to rollback:**
- Use "Emergency Rollback" section in CHECKPOINTS.md
- Restore from backup
- Start over from Checkpoint 1

---

## Success Indicators

You'll know it's working when:

✅ Checkpoint 1: Clean build, no CodeMirror
✅ Checkpoint 2: Monaco 4.7.0 in package.json
✅ Checkpoint 3: 3 new files created, build succeeds
✅ Checkpoint 4: Editor page updated, imports CodeEditor
✅ Checkpoint 5: Monaco visible in browser, can type
✅ Checkpoint 6: Documentation complete

---

## Ready to Start?

1. Make sure both repos are open in Windsurf
2. Make sure you're in the **ckick** repo directory
3. Copy the **Agent 1 prompt** above
4. Paste into Windsurf Cascade
5. Watch it work
6. Verify Checkpoint 1
7. Move to Agent 2

**Start now with Agent 1!**
