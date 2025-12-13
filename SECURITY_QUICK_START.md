# Security Quick Start Guide

## TL;DR - Get Secure in 5 Minutes

### Current Status
Your app currently uses **password-based auth** (VITE_APP_PASSWORD). This works but is not secure for production.

### Quick Migration to Secure Auth

#### Option A: Keep Using (Not Recommended for Production)
```bash
# Current setup - works but not secure
VITE_APP_PASSWORD=your-secure-password

# Features you have:
✓ Rate limiting (5 attempts → 15min lockout)
✓ Session expiration (24 hours)
✓ Encrypted API keys in localStorage
✓ Security event logging

# What's missing:
✗ No multi-user support
✗ Password in environment (visible)
✗ No proper session management
```

#### Option B: Migrate to Supabase Auth (5 minutes)
```bash
# Step 1: Create user in Supabase (30 seconds)
# → Dashboard → Authentication → Add User
# → Email: you@tellproductions.com
# → Password: [your secure password]

# Step 2: Run RLS policies (1 minute)
# → Dashboard → SQL Editor
# → Paste supabase-rls-policies.sql
# → Click Run

# Step 3: Migrate data (30 seconds)
# → Copy your user UUID from step 1
# → In SQL Editor:
UPDATE quotes SET user_id = 'YOUR_UUID' WHERE user_id IS NULL;
UPDATE clients SET user_id = 'YOUR_UUID' WHERE user_id IS NULL;
UPDATE rate_cards SET user_id = 'YOUR_UUID' WHERE user_id IS NULL;
UPDATE settings SET user_id = 'YOUR_UUID' WHERE user_id IS NULL;

# Step 4: Update .env.local (10 seconds)
# → Remove: VITE_APP_PASSWORD=your-secure-password
# → Keep: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Step 5: Test (1 minute)
# → Clear browser localStorage
# → Reload app
# → Login with email + password
# → Done!

# Features you now have:
✓ Email/password authentication
✓ Secure session tokens (encrypted)
✓ Auto token refresh
✓ Multi-user support
✓ Row-level security (data isolation)
✓ Password reset capability
✓ Rate limiting + session expiration
✓ Encrypted API keys
```

## What's Been Secured

### 1. Authentication
**Before:**
- Single password in .env file
- Anyone with .env can login
- No session management

**After:**
- Email + password per user
- Encrypted session tokens
- 24-hour auto-expiring sessions
- Rate limiting (5 attempts max)
- 15-minute lockout on failure

### 2. API Keys
**Before:**
- Stored plain text in localStorage
- Visible in browser DevTools

**After:**
- Encrypted with device-specific key
- Still visible if debugged (client-side limit)
- Security warnings when saving

**Production Recommendation:**
Move to backend proxy:
```
Browser → Your Backend → AI APIs
         (stores keys)    (OpenAI/Anthropic)
```

### 3. Bank Details
**Before:**
- Plain text in localStorage

**After:**
- Encrypted account numbers
- Encrypted SWIFT codes
- Redacted in exports

### 4. Database Access
**Before:**
- Wide open (anyone can query)
- No user isolation

**After:**
- Row Level Security enabled
- Users only see their own data
- Auto user_id assignment

## Security Features

### Automatic Protection
These work automatically after migration:

1. **Rate Limiting**
   - 5 failed login attempts
   - 15-minute lockout
   - Visual countdown timer

2. **Session Management**
   - 24-hour expiration
   - Auto-refresh on activity
   - Secure token storage

3. **Data Encryption**
   - API keys encrypted
   - Bank details encrypted
   - Settings export sanitized

4. **Event Logging**
   - Login/logout tracked
   - Failed attempts logged
   - API key changes logged

### Manual Configuration
Optional security enhancements:

1. **Multi-Factor Authentication**
   - Enable in Supabase Dashboard
   - Authentication → Settings → MFA

2. **Password Reset**
   - Configure email templates
   - Set redirect URLs

3. **Audit Logging**
   - Enable audit_log table
   - Track all data changes

## Common Questions

### Q: Do I have to migrate now?
**A:** No, password auth still works. But it's not secure for production.

### Q: Will migration break anything?
**A:** No. The app detects Supabase Auth automatically and falls back to password if needed.

### Q: Can I switch back if needed?
**A:** Yes. Just add VITE_APP_PASSWORD back to .env.local.

### Q: Are API keys secure now?
**A:** More secure (encrypted), but still client-side. For full security, use a backend proxy.

### Q: What if I forget my password?
**A:** With Supabase Auth, you can use password reset. With password auth, you need to check .env.local.

### Q: How do I add more users?
**A:** Supabase Dashboard → Authentication → Users → Add User

### Q: Will this slow down my app?
**A:** No. Encryption adds <5ms. No noticeable impact.

## Quick Tests

### Test 1: Verify Encryption Works
```javascript
// Open browser console
localStorage.getItem('tell_settings')
// Should see encrypted gibberish, not plain API keys
```

### Test 2: Verify Rate Limiting
```
1. Logout
2. Try 5 wrong passwords
3. Should lock for 15 minutes
4. Timer counts down
```

### Test 3: Verify Session Expiration
```
1. Login
2. Wait 24 hours
3. Reload page
4. Should ask for login again
```

### Test 4: Verify RLS Works
```sql
-- In Supabase SQL Editor
-- Try to query another user's data
SELECT * FROM quotes WHERE user_id != auth.uid();
-- Should return empty (blocked by RLS)
```

## Files to Review

### User Documentation
- `SECURITY.md` - Complete security guide
- `SECURITY_DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment

### Developer Documentation
- `SECURITY_IMPLEMENTATION_SUMMARY.md` - Technical details
- `supabase-rls-policies.sql` - Database security
- `.env.example` - Configuration guide

### Code Files
- `/src/utils/encryption.js` - Encryption utilities
- `/src/store/authStore.js` - Authentication logic
- `/src/store/settingsStore.js` - Encrypted settings
- `/src/lib/supabase.js` - Supabase client config

## Getting Help

### Issues?
1. Check browser console for errors
2. Review `SECURITY.md` troubleshooting section
3. Check Supabase logs in dashboard

### Security Concerns?
1. Review `SECURITY.md` for best practices
2. Check implementation in code files
3. Test with deployment checklist

### Want More Security?
See `SECURITY.md` section: "Production Checklist"
- Backend proxy for API keys
- MFA setup
- Advanced monitoring
- Penetration testing

## Next Steps

### Immediate (Required)
1. [ ] Decide: Keep password auth or migrate to Supabase
2. [ ] If migrating: Follow "Option B" above
3. [ ] Test login functionality
4. [ ] Verify data access works

### Soon (Recommended)
1. [ ] Review all documentation
2. [ ] Test rate limiting
3. [ ] Configure monitoring
4. [ ] Set up backups

### Eventually (Best Practice)
1. [ ] Implement backend proxy for API keys
2. [ ] Enable MFA
3. [ ] Regular security audits
4. [ ] Penetration testing

---

**Need Help?** Review the detailed guides:
- Quick fixes: This file
- Deployment: `SECURITY_DEPLOYMENT_CHECKLIST.md`
- Deep dive: `SECURITY.md`
- Technical: `SECURITY_IMPLEMENTATION_SUMMARY.md`
