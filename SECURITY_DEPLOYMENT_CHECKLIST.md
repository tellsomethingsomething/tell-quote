# Security Deployment Checklist

## Pre-Deployment Setup

### 1. Supabase Configuration

- [ ] **Create Supabase User Account**
  - Go to Supabase Dashboard: https://supabase.com/dashboard
  - Navigate to: Authentication → Users
  - Click "Add User"
  - Email: your-email@tellproductions.com
  - Password: [Create a strong password]
  - Save the user UUID (you'll need it for migration)

- [ ] **Enable Email Authentication**
  - Go to: Authentication → Providers
  - Enable "Email" provider
  - Configure email templates (optional)
  - Set redirect URLs if needed

- [ ] **Apply Row Level Security Policies**
  ```bash
  # In Supabase SQL Editor:
  # 1. Copy contents of supabase-rls-policies.sql
  # 2. Paste into SQL Editor
  # 3. Click "Run"
  ```

- [ ] **Migrate Existing Data**
  ```sql
  -- Replace 'YOUR_USER_ID' with the UUID from step 1
  UPDATE quotes SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
  UPDATE clients SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
  UPDATE rate_cards SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
  UPDATE rate_card_sections SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
  UPDATE settings SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
  ```

### 2. Environment Configuration

- [ ] **Update .env.local**
  ```bash
  # Keep these:
  VITE_SUPABASE_URL=https://deitlnfumugxcbxqqivk.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

  # REMOVE or comment out this line for production:
  # VITE_APP_PASSWORD=your-secure-password
  ```

- [ ] **Verify Environment Variables**
  ```bash
  # Check that only Supabase vars are set
  cat .env.local
  ```

### 3. Local Testing

- [ ] **Clear Browser Data**
  - Open DevTools (F12)
  - Application → Storage → Clear site data
  - Or manually: localStorage → Clear all

- [ ] **Test Login**
  - Reload app
  - Should show email + password fields (Supabase mode)
  - Login with the email/password from step 1
  - Should successfully authenticate

- [ ] **Verify Data Access**
  - Check that all quotes are visible
  - Check that all clients are visible
  - Create a new quote (should auto-assign user_id)

- [ ] **Test Encryption**
  - Go to Settings → AI Settings
  - Enter test API key
  - Check localStorage in DevTools
  - Verify keys are encrypted (not plain text)

- [ ] **Test Rate Limiting**
  - Logout
  - Try 5 incorrect passwords
  - Verify account locks for 15 minutes
  - Wait for countdown and verify unlock

### 4. Production Deployment

#### For Vercel:

- [ ] **Set Environment Variables**
  - Go to: Vercel Dashboard → Project → Settings → Environment Variables
  - Add: `VITE_SUPABASE_URL`
  - Add: `VITE_SUPABASE_ANON_KEY`
  - Do NOT add `VITE_APP_PASSWORD`

- [ ] **Deploy**
  ```bash
  npm run build
  # Or push to git (auto-deploys on Vercel)
  ```

- [ ] **Test Production**
  - Visit production URL
  - Test login with email/password
  - Verify data access
  - Check console for errors

#### For GitHub Pages:

- [ ] **Build with Environment**
  ```bash
  # Set env vars in GitHub Actions secrets
  # Or build locally with .env.local
  npm run build
  npm run deploy
  ```

- [ ] **Test Production**
  - Visit GitHub Pages URL
  - Test authentication
  - Verify functionality

## Post-Deployment Verification

### Security Tests

- [ ] **Authentication Tests**
  - [ ] Login with correct credentials (should work)
  - [ ] Login with wrong password (should fail)
  - [ ] Rate limiting (5 failed attempts → lockout)
  - [ ] Session persistence (reload page, still logged in)
  - [ ] Session expiration (check after 24+ hours)
  - [ ] Logout (clears session)

- [ ] **Data Isolation Tests**
  - [ ] Create second user in Supabase
  - [ ] Login as second user
  - [ ] Verify they can't see first user's data
  - [ ] Create new quote as second user
  - [ ] Switch back to first user
  - [ ] Verify isolation works both ways

- [ ] **Encryption Tests**
  - [ ] Save API key in settings
  - [ ] Check localStorage (should be encrypted)
  - [ ] Reload page (should decrypt correctly)
  - [ ] Export settings (should redact keys)

- [ ] **Database Security Tests**
  - [ ] Try direct database query without auth (should fail)
  - [ ] Try accessing other user's data (should return empty)
  - [ ] Verify RLS policies are active

### Performance Tests

- [ ] **Page Load Speed**
  - Should be similar to before (encryption is fast)
  - No noticeable lag

- [ ] **Login Speed**
  - Should take 300-500ms for legacy mode
  - Should take 500-1000ms for Supabase mode

- [ ] **Data Loading**
  - No impact on data fetch times
  - RLS adds minimal overhead

## Monitoring Setup

### Enable Logging

- [ ] **Browser Console Logging**
  - Open DevTools in production
  - Check for security events in console
  - Should see `[SECURITY]` log entries

- [ ] **Supabase Logs**
  - Go to: Supabase → Logs
  - Monitor authentication events
  - Watch for failed login attempts

- [ ] **Error Tracking (Optional)**
  - Set up Sentry or similar
  - Monitor for encryption errors
  - Track authentication failures

### Set Up Alerts

- [ ] **Failed Login Alerts**
  - Monitor Supabase logs
  - Alert on >10 failed attempts/hour
  - Alert on account lockouts

- [ ] **Database Alerts**
  - Monitor database usage
  - Alert on unusual query patterns
  - Alert on RLS policy violations

## Maintenance Schedule

### Daily
- [ ] Check for failed login attempts
- [ ] Monitor error logs

### Weekly
- [ ] Review active sessions
- [ ] Check for suspicious activity
- [ ] Verify backups are running

### Monthly
- [ ] Review user access list
- [ ] Audit API key usage
- [ ] Check for outdated sessions
- [ ] Review security logs

### Quarterly
- [ ] Rotate API keys
- [ ] Update dependencies
- [ ] Security audit
- [ ] Review RLS policies

## Rollback Plan

If issues occur after deployment:

### Emergency Rollback

1. **Re-enable Password Auth**
   ```bash
   # Add back to .env.local:
   VITE_APP_PASSWORD=your-secure-password
   ```

2. **Redeploy**
   ```bash
   npm run build
   # Deploy via Vercel or GitHub Pages
   ```

3. **Verify Access**
   - Login with password should work
   - Data should be accessible

### Data Recovery

1. **Supabase Backups**
   - Go to: Supabase → Database → Backups
   - Restore from last known good backup

2. **Local Backups**
   - If you exported settings, import them back
   - Restore from git history if needed

## Security Contacts

### Report Security Issues
- Email: [Your Security Contact]
- Create private GitHub issue
- Supabase support: support@supabase.io

### Emergency Contacts
- Supabase Status: https://status.supabase.com
- Supabase Support: Dashboard → Help

## Documentation

### For Team Members
- Share `SECURITY.md` for overview
- Share this checklist for deployment
- Share `.env.example` for configuration

### For Future Reference
- Keep `SECURITY_IMPLEMENTATION_SUMMARY.md` for technical details
- Document any custom changes
- Maintain incident log

## Final Checks

- [ ] All team members trained on new auth system
- [ ] Emergency contacts documented
- [ ] Rollback plan tested
- [ ] Monitoring configured
- [ ] Backups verified
- [ ] Documentation updated
- [ ] Security contacts shared

---

## Success Criteria

Deployment is successful when:
- ✅ Users can login with email/password
- ✅ Rate limiting works (5 attempts → lockout)
- ✅ Data is properly isolated per user
- ✅ API keys are encrypted in storage
- ✅ Sessions expire after 24 hours
- ✅ No security warnings in console
- ✅ All RLS policies are active
- ✅ Monitoring is operational

---

**Date Prepared:** 2025-12-13
**Version:** 1.0
**Status:** Ready for Production
