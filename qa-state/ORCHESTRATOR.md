# ProductionOS QA Orchestrator - Resume Instructions

If you are a NEW Claude instance reading this, your mission is to continue autonomous QA testing.

## Quick Resume

1. Read `/Users/tom/quote/qa-state/state.json` to see current progress
2. Check which views have status "completed", "in-progress", or "pending"
3. Read the latest file in `/Users/tom/quote/qa-state/reports/` for context
4. Resume from `current_view` and `current_section`
5. Continue the testing protocol

## Critical Information

### Target Application
- URL: https://productionos.io
- Login: tom@tell.so / Thanks!69
- Codebase: /Users/tom/quote/src

### Dev-Browser Server

Check if running:
```bash
curl http://localhost:9222 2>/dev/null && echo "Server running" || echo "Server not running"
```

Start if needed:
```bash
cd /Users/tom/.claude/plugins/cache/dev-browser-marketplace/dev-browser/45c3e37c9bdd/skills/dev-browser && ./server.sh &
```

### Safety Rules - NEVER VIOLATE

1. NEVER click "Delete Account"
2. NEVER click Google/Microsoft OAuth buttons
3. NEVER remove working features when fixing
4. NEVER make changes without git commits
5. ALWAYS save state after every action
6. ALWAYS screenshot sections, not full pages

### State File Locations

- state.json: Current progress and checkpoint
- screenshots/: All captured screenshots
- issues/: All logged issues (JSON files)
- fixes/: Documentation of applied fixes
- reports/: Hourly progress reports

### View Status Meanings

- pending: Not yet tested
- in-progress: Currently being tested
- completed: All sections tested
- blocked: Cannot proceed (login issue, etc.)

### Issue Severity Levels

- critical: App crashes, data loss, security holes
- high: Major feature broken, bad calculations
- medium: UI bugs, minor UX issues
- low: Cosmetic, nice-to-have improvements

### Git Workflow for Fixes

Before any fix:
```bash
cd /Users/tom/quote && git status
```

After successful fix:
```bash
cd /Users/tom/quote && git add -A && git commit -m "QA-AUTO: {description}"
```

If fix breaks something:
```bash
cd /Users/tom/quote && git checkout -- .
```

## Testing Order (Priority)

1. dashboard (verify app loads)
2. clients (core CRM)
3. opportunities (sales pipeline)
4. quotes (list view)
5. editor (CRITICAL - quote builder)
6. rate-card (pricing data)
7. projects (project management)
8. crew (team management)
9. call-sheets (production documents)
10. invoices (billing)
11. expenses (financials)
12. calendar (scheduling)
13. task-board (task management)
14. email (communications)
15. settings (configuration)
16. ... remaining views

## Recovery Scenarios

### If login failed:
- Check if dev-browser server is running
- Clear browser cookies: close and reopen page
- Try login again with exact credentials

### If state.json corrupted:
- Check git log for recent activity
- Review screenshots folder for progress evidence
- Rebuild state from folder evidence
- Continue from last known view

### If browser crashed:
- Restart dev-browser server
- Reload the page from last known URL
- Continue testing

## Time Tracking

- Started at: Check state.json started_at
- Target: 10 hours from start
- Generate hourly reports
- Generate final report at completion

## Contact

This is autonomous. No human will respond.
If you encounter an unrecoverable error, log it and continue with next view.

---

Read MASTER_PROMPT.md for full testing protocol.
