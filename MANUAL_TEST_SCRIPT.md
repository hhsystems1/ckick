# RivRyn Editor - Manual Testing Script

**Test Date**: _____________
**Tester**: _____________
**Device**: _____________
**Browser**: _____________
**Screen Size**: _____________

---

## Pre-Test Setup

- [ ] Clear browser cache and cookies
- [ ] Open browser DevTools (F12)
- [ ] Open Console tab (watch for errors)
- [ ] Open Network tab (watch for failed requests)
- [ ] Navigate to: http://localhost:3000 (or deployed URL)

---

## Test 1: Initial Load & Authentication

**Expected**: App loads without errors, user can sign in

| Step | Action | Expected Result | ✅/❌ | Notes |
|------|--------|----------------|------|-------|
| 1.1 | Load homepage | Page loads in < 3 seconds |  |  |
| 1.2 | Check console | No red errors |  |  |
| 1.3 | Check network | No 404s or 500s |  |  |
| 1.4 | Sign in (if needed) | Redirects to /home |  |  |
| 1.5 | Check console after auth | No errors |  |  |

**Pass Criteria**: All steps ✅

---

## Test 2: Project Navigation

**Expected**: User can access existing project or create new one

| Step | Action | Expected Result | ✅/❌ | Notes |
|------|--------|----------------|------|-------|
| 2.1 | View project list | Projects visible |  |  |
| 2.2 | Click on test project | Navigates to /editor/[id] |  |  |
| 2.3 | Check URL | Contains valid project ID |  |  |
| 2.4 | Check header | Shows project name |  |  |
| 2.5 | Check header | Shows file count |  |  |

**Pass Criteria**: All steps ✅

---

## Test 3: Code Tab - Empty State

**Expected**: Helpful guidance when no files exist

| Step | Action | Expected Result | ✅/❌ | Notes |
|------|--------|----------------|------|-------|
| 3.1 | Click "Code" tab | Code tab activates |  |  |
| 3.2 | View empty state | See folder icon (64px) |  |  |
| 3.3 | Read message | Says "No File Selected" or "Create your first file" |  |  |
| 3.4 | Check button | Shows "Create First File" or "Browse Files" |  |  |
| 3.5 | Check hint (if no files) | Shows "Tap the Files tab below, then tap the + button" |  |  |
| 3.6 | Button is tappable | Button has good hit area (min 44x44px) |  |  |

**Pass Criteria**: All steps ✅

---

## Test 4: Files Tab - File Creation

**Expected**: User can create a new file with validation and feedback

| Step | Action | Expected Result | ✅/❌ | Notes |
|------|--------|----------------|------|-------|
| 4.1 | Click "Files" tab | Files tab activates |  |  |
| 4.2 | Click "+" button | File creation form appears |  |  |
| 4.3 | Check form design | Has border, label "New File", highlighted |  |  |
| 4.4 | Check input field | Font size is 16px (no zoom on iOS) |  |  |
| 4.5 | Check input field | Placeholder shows "index.ts" |  |  |
| 4.6 | Focus input | Keyboard appears (mobile) / cursor active |  |  |
| 4.7 | Leave empty, click Create | Button is disabled OR shows error |  |  |
| 4.8 | Type "../test.js" | Should show "Invalid file name" alert |  |  |
| 4.9 | Type "//test.js" | Should show "Invalid file name" alert |  |  |
| 4.10 | Type "test.js" | Input accepts it |  |  |
| 4.11 | Click Create button | Button shows loading spinner |  |  |
| 4.12 | Wait | Button text changes to "Creating..." |  |  |
| 4.13 | File creates | Form closes |  |  |
| 4.14 | Check file list | "test.js" appears |  |  |
| 4.15 | Check navigation | Auto-switches to Code tab |  |  |
| 4.16 | Check console | No errors |  |  |

**Mobile Specific**:
| 4.17 | Check Cancel button | Visible and tappable |  |  |
| 4.18 | Press ESC key | Form closes (desktop) |  |  |
| 4.19 | Press Enter in input | Submits form |  |  |

**Error Handling**:
| 4.20 | Simulate API failure | Shows error alert with message |  |  |
| 4.21 | After error | Form stays open for retry |  |  |

**Pass Criteria**: All applicable steps ✅

---

## Test 5: Code Tab - Monaco Editor (Desktop)

**Expected**: Editor renders and functions correctly on desktop

| Step | Action | Expected Result | ✅/❌ | Notes |
|------|--------|----------------|------|-------|
| 5.1 | View code tab with file | Monaco editor visible |  |  |
| 5.2 | Check background | Dark theme (#0E1110) |  |  |
| 5.3 | Check for red line | NO red line below header |  |  |
| 5.4 | Check line numbers | Visible on left side |  |  |
| 5.5 | Check syntax highlighting | Works for file type |  |  |
| 5.6 | Click in editor | Cursor appears |  |  |
| 5.7 | Type some code | Characters appear instantly (< 100ms lag) |  |  |
| 5.8 | Check auto-save | After 1 second of no typing, network request fires |  |  |
| 5.9 | Press Cmd+S (Mac) or Ctrl+S (Win/Linux) | Saves immediately |  |  |
| 5.10 | Scroll editor | Smooth scrolling |  |  |
| 5.11 | Select text | Selection highlighting works |  |  |
| 5.12 | Copy/paste | Works correctly |  |  |
| 5.13 | Check scrollbar | Visible and functional |  |  |
| 5.14 | Check font size | 14px |  |  |

**Pass Criteria**: All steps ✅

---

## Test 6: Code Tab - Monaco Editor (Mobile)

**Expected**: Mobile-optimized experience with Start Typing button

| Step | Action | Expected Result | ✅/❌ | Notes |
|------|--------|----------------|------|-------|
| 6.1 | Open file on mobile | Monaco editor loads |  |  |
| 6.2 | Check Start Typing button | Big button overlay appears |  |  |
| 6.3 | Check button position | Centered, NOT under navbar |  |  |
| 6.4 | Check button design | Teal/green (#4FB6A1), keyboard icon, clear text |  |  |
| 6.5 | Check backdrop | Dark overlay (80% opacity) behind button |  |  |
| 6.6 | Tap Start Typing button | Button disappears |  |  |
| 6.7 | After tap | Editor focuses |  |  |
| 6.8 | After tap | Mobile keyboard appears |  |  |
| 6.9 | Type in editor | Characters appear |  |  |
| 6.10 | Check font size | 16px (prevents zoom) |  |  |
| 6.11 | Type continuously | Start button stays hidden |  |  |
| 6.12 | Check top-right corner | Save button visible (floating, round) |  |  |
| 6.13 | Start typing | "Saving..." indicator appears |  |  |
| 6.14 | Wait 1 second | Indicator changes to "Saved ✓" |  |  |
| 6.15 | Wait 2 more seconds | Indicator disappears |  |  |
| 6.16 | Tap save button | Saves immediately, shows "Saved ✓" |  |  |
| 6.17 | Scroll editor | Smooth, no lag |  |  |
| 6.18 | Check padding | Extra padding at top and bottom for mobile |  |  |
| 6.19 | Select text | Selection works with touch |  |  |
| 6.20 | Check scrollbar | Smaller (8px) for mobile |  |  |

**Pass Criteria**: All steps ✅

---

## Test 7: File Operations

**Expected**: CRUD operations work correctly

| Step | Action | Expected Result | ✅/❌ | Notes |
|------|--------|----------------|------|-------|
| 7.1 | Create second file | Works same as Test 4 |  |  |
| 7.2 | Switch between files | Click file in list, editor updates |  |  |
| 7.3 | Check file switching speed | < 500ms |  |  |
| 7.4 | Edit both files | Changes save independently |  |  |
| 7.5 | Long-press file (mobile) or right-click (desktop) | Context menu appears OR rename mode activates |  |  |
| 7.6 | Rename file | Input appears, can edit name |  |  |
| 7.7 | Save renamed file | Name updates in list |  |  |
| 7.8 | Select file | Delete button appears (X icon) |  |  |
| 7.9 | Click delete button | File removed from list |  |  |
| 7.10 | Check editor | Shows empty state if no files left |  |  |

**Pass Criteria**: All steps ✅

---

## Test 8: Navigation Between Tabs

**Expected**: All tabs are accessible and remember state

| Step | Action | Expected Result | ✅/❌ | Notes |
|------|--------|----------------|------|-------|
| 8.1 | Click Files tab | Files tab opens, file list visible |  |  |
| 8.2 | Click Code tab | Code tab opens, editor visible |  |  |
| 8.3 | Click Terminal tab | Terminal tab opens |  |  |
| 8.4 | Check Terminal UI | (Describe what you see) |  |  |
| 8.5 | Click Agent tab | Agent tab opens |  |  |
| 8.6 | Check Agent UI | (Describe what you see) |  |  |
| 8.7 | Click Deploy tab | Deploy tab opens |  |  |
| 8.8 | Check Deploy UI | (Describe what you see) |  |  |
| 8.9 | Click Preview tab | Preview tab opens |  |  |
| 8.10 | Check Preview UI | (Describe what you see) |  |  |
| 8.11 | Return to Code tab | Previous file still selected |  |  |
| 8.12 | Check active tab indicator | Currently selected tab highlighted |  |  |

**Pass Criteria**: All tabs accessible, no crashes

---

## Test 9: Responsive Design

**Expected**: Layout adapts to different screen sizes

| Screen Size | Actions | Expected Result | ✅/❌ | Notes |
|-------------|---------|----------------|------|-------|
| **Mobile (< 768px)** | Resize to 375px width | Mobile UI shows |  |  |
|  | Check bottom nav | 5 tabs visible with icons |  |  |
|  | Check Start button | Shows in Code tab |  |  |
|  | Check save button | Floating round button |  |  |
|  | Tap navigation buttons | Good hit areas, no misclicks |  |  |
| **Tablet (768px - 1024px)** | Resize to 768px | Layout adjusts |  |  |
|  | Check if mobile UI | Should show desktop UI at 768px+ |  |  |
| **Desktop (> 1024px)** | Resize to 1920px | Full desktop layout |  |  |
|  | Check Start button | Should NOT appear |  |  |
|  | Check save button | Should NOT appear (auto-save only) |  |  |

**Pass Criteria**: Layouts appropriate for each size

---

## Test 10: Error Scenarios

**Expected**: Graceful error handling with user feedback

| Scenario | How to Test | Expected Result | ✅/❌ | Notes |
|----------|-------------|----------------|------|-------|
| **Network offline** | Disable network, try to save | Error message shown |  |  |
|  |  | Can retry after reconnecting |  |  |
| **401 Auth error** | Clear auth token, refresh | Redirects to login |  |  |
| **403 Permission error** | Try to access other user's project | Error message or redirect |  |  |
| **500 Server error** | (Hard to simulate) | Error message with retry option |  |  |
| **Monaco load failure** | Block Monaco CDN | Shows error, not blank screen |  |  |

**Pass Criteria**: No unhandled errors, users always know what happened

---

## Test 11: Performance

**Expected**: Fast, responsive experience

| Metric | How to Measure | Target | Actual | ✅/❌ |
|--------|----------------|--------|--------|------|
| **Time to Interactive** | DevTools Lighthouse | < 3s on mobile |  |  |
| **First Contentful Paint** | DevTools Lighthouse | < 1.5s |  |  |
| **Typing Latency** | Type fast, observe lag | < 100ms |  |  |
| **File Switch Time** | Time between click and editor update | < 500ms |  |  |
| **Save Operation** | Time from trigger to completion | < 1s |  |  |
| **Bundle Size** | DevTools Network tab, initial load | < 500kb (gzipped) |  |  |
| **Memory Usage** | DevTools Memory tab, after 30 min use | No leaks |  |  |

**Pass Criteria**: All metrics at or better than targets

---

## Test 12: Cross-Browser Compatibility

**Expected**: Works on all major browsers

| Browser | Version | Test Result | Issues Found |
|---------|---------|-------------|--------------|
| Chrome (Desktop) |  | ✅/❌ |  |
| Firefox (Desktop) |  | ✅/❌ |  |
| Safari (Desktop) |  | ✅/❌ |  |
| Edge (Desktop) |  | ✅/❌ |  |
| Chrome (Mobile) |  | ✅/❌ |  |
| Safari (iOS) |  | ✅/❌ |  |
| Firefox (Mobile) |  | ✅/❌ |  |

**Pass Criteria**: Core functionality works on all browsers

---

## Console Error Check

**Throughout testing, monitor console for errors**

| Tab/Action | Console Errors | Network Errors | Notes |
|------------|----------------|----------------|-------|
| Initial load |  |  |  |
| Files tab |  |  |  |
| Create file |  |  |  |
| Code tab |  |  |  |
| Type in editor |  |  |  |
| Save file |  |  |  |
| Terminal tab |  |  |  |
| Agent tab |  |  |  |
| Deploy tab |  |  |  |
| Preview tab |  |  |  |

**Pass Criteria**: No red errors (warnings OK)

---

## Overall Test Results

**Tests Passed**: ___ / 12
**Critical Issues Found**: ___
**High Priority Issues Found**: ___
**Medium Priority Issues Found**: ___
**Low Priority Issues Found**: ___

### Critical Issues (Blockers)
1.
2.
3.

### High Priority Issues
1.
2.
3.

### Medium Priority Issues
1.
2.
3.

### Low Priority Issues / Nice to Have
1.
2.
3.

---

## Sign-Off

**Tester Signature**: ____________________
**Date**: ____________________

**Ready for Production**: YES / NO

**If NO, blocking issues**:
-
-

**Recommended Next Steps**:
1.
2.
3.

---

## Notes & Observations

(Use this space for any additional comments, screenshots, or observations)
