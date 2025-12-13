# Security Documentation

## Overview

This document describes the security measures implemented in the Tell Quote application and provides guidance for secure deployment and usage.

## Security Features Implemented

### 1. Authentication System

#### Current Implementation
- **Dual Mode**: Supports both Supabase Auth (recommended) and legacy password-based auth
- **Session Management**: 24-hour session expiration with automatic extension on user activity
- **Rate Limiting**: 5 failed login attempts before 15-minute lockout
- **Session Validation**: Automatic session validation on page load and periodic checks

#### Supabase Auth (Recommended)
- Email/password authentication with secure token management
- PKCE flow for enhanced security
- Automatic token refresh
- Encrypted session storage

#### Legacy Mode (Deprecated)
- Simple password-based auth using `VITE_APP_PASSWORD`
- Should be migrated to Supabase Auth
- Maintained for backward compatibility

### 2. Data Encryption

#### Client-Side Encryption (`/src/utils/encryption.js`)
- **Purpose**: Protect sensitive data in localStorage
- **Method**: XOR cipher with SHA-256 key derivation
- **Encrypted Fields**:
  - AI API keys (Anthropic, OpenAI)
  - Bank account numbers
  - SWIFT codes

#### Encryption Details
```javascript
// Encrypted fields:
- aiSettings.anthropicKey
- aiSettings.openaiKey
- bankDetails.accountNumber
- bankDetails.swiftCode
```

#### Important Limitations
- Client-side encryption provides **obfuscation, not military-grade security**
- Can be reverse-engineered by determined attackers
- Best practice: Move API keys to a backend proxy
- Current implementation is defense-in-depth, not foolproof

### 3. Row Level Security (RLS)

#### Database Security
- All Supabase tables have RLS enabled
- Users can only access their own data
- Policies enforce user_id matching auth.uid()

#### Setup Instructions
1. Run `supabase-rls-policies.sql` in Supabase SQL Editor
2. Create user accounts via Supabase Auth Dashboard
3. Migrate existing data to first user
4. Remove `VITE_APP_PASSWORD` from environment

#### RLS Policy Structure
```sql
-- Example policy
CREATE POLICY "Users can view own quotes"
ON quotes FOR SELECT
USING (auth.uid() = user_id);
```

### 4. Security Logging

#### Event Logging
All security events are logged to console:
- Login success/failure
- Session creation/expiration
- Rate limit violations
- API key updates
- Settings changes

#### Log Format
```javascript
logSecurityEvent('event_name', { details })
```

#### Events Tracked
- `login_success` - Successful authentication
- `login_failed` - Failed login attempt
- `account_locked` - Rate limit triggered
- `session_expired` - Session timeout
- `api_keys_updated` - API key changes
- `bank_details_updated` - Bank info changes

### 5. API Key Protection

#### Current Implementation
- Keys stored encrypted in localStorage
- Keys encrypted before saving to Supabase
- Validation of key format (sk-ant-, sk-)
- Security warnings when keys are exposed
- Keys redacted in settings export

#### Security Warnings
The app displays console warnings when:
- Invalid API key format detected
- API keys stored client-side
- Keys exposed in localStorage

#### Best Practice Recommendations
```
⚠️ PRODUCTION RECOMMENDATION ⚠️

For production deployments, implement a backend proxy:

1. Create a backend service (Node.js/Python/Go)
2. Store API keys server-side only
3. Client calls backend, backend calls AI APIs
4. Never expose keys to browser

Example architecture:
Browser → Backend Proxy → AI API
         (stores keys)
```

## Migration Guide

### From Password Auth to Supabase Auth

#### Step 1: Set up Supabase
```bash
# Already done if you have Supabase configured
# Check .env.local for:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Step 2: Create User Account
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. Save the user ID

#### Step 3: Migrate Data
```sql
-- Run in Supabase SQL Editor
-- Replace 'YOUR_USER_ID' with actual UUID

UPDATE quotes SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE clients SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE rate_cards SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE settings SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
```

#### Step 4: Apply RLS Policies
```bash
# Run supabase-rls-policies.sql in Supabase SQL Editor
```

#### Step 5: Remove Old Password
```bash
# Edit .env.local
# Remove or comment out:
# VITE_APP_PASSWORD=tell2024
```

#### Step 6: Test
1. Clear browser localStorage
2. Reload app
3. Login with email/password
4. Verify data is accessible

## Security Checklist

### For Production Deployment

- [ ] Migrate to Supabase Auth (remove VITE_APP_PASSWORD)
- [ ] Apply RLS policies to database
- [ ] Enable Supabase MFA (Multi-Factor Authentication)
- [ ] Implement backend proxy for AI API keys
- [ ] Enable Supabase database backups
- [ ] Set up monitoring/alerts for failed logins
- [ ] Review and rotate API keys regularly
- [ ] Enable HTTPS only (no HTTP)
- [ ] Set secure cookie flags in Supabase
- [ ] Review Supabase security settings
- [ ] Document incident response procedures
- [ ] Set up rate limiting at infrastructure level (Cloudflare, etc.)

### Regular Security Maintenance

#### Weekly
- Review security event logs
- Check for unusual login patterns

#### Monthly
- Review user access list
- Check for outdated sessions
- Review API key usage

#### Quarterly
- Rotate API keys
- Review RLS policies
- Security audit of code changes
- Update dependencies

## Known Limitations

### 1. Client-Side Encryption
- Not cryptographically secure against determined attackers
- Keys can be extracted by inspecting browser memory
- Recommended: Move to backend proxy

### 2. localStorage Storage
- Accessible via JavaScript
- Not secure against XSS attacks
- Cleared when browser cache is cleared

### 3. Single-User Model
- Currently designed for single user/team
- Multi-tenancy not fully implemented
- Shared access features are planned

### 4. No Backend
- All authentication happens client-side
- API keys exposed to browser (even if encrypted)
- No server-side validation

## Security Best Practices

### For Users

1. **Strong Passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols
   - Unique password (not reused)

2. **Session Management**
   - Always log out on shared computers
   - Don't save passwords in browser

3. **API Keys**
   - Never share API keys
   - Rotate keys if compromised
   - Monitor API usage for anomalies

4. **Data Export**
   - Settings export redacts sensitive data
   - Don't share exported JSON files
   - Store backups securely

### For Developers

1. **Code Security**
   - Never commit API keys to git
   - Use `.env.local` for secrets (gitignored)
   - Review all PRs for security issues

2. **Dependencies**
   - Keep npm packages updated
   - Run `npm audit` regularly
   - Monitor security advisories

3. **Testing**
   - Test RLS policies thoroughly
   - Verify encryption/decryption
   - Test rate limiting

4. **Deployment**
   - Use HTTPS only
   - Enable security headers
   - Set up CSP (Content Security Policy)

## Incident Response

### If API Key Compromised

1. **Immediate Actions**
   - Revoke compromised key in provider dashboard
   - Generate new key
   - Update key in app settings
   - Monitor API usage for suspicious activity

2. **Investigation**
   - Review security logs
   - Identify how key was exposed
   - Document incident

3. **Prevention**
   - Implement additional safeguards
   - Consider backend proxy
   - Update security procedures

### If Unauthorized Access Detected

1. **Immediate Actions**
   - Change all passwords
   - Review recent data changes
   - Check for data exfiltration

2. **Investigation**
   - Review login logs
   - Check session history
   - Identify attack vector

3. **Recovery**
   - Restore from backup if needed
   - Apply security patches
   - Update access controls

## Contact

For security concerns or to report vulnerabilities:
- Email: [Your Security Contact]
- Create a private security advisory on GitHub

## Compliance

### Data Privacy
- All data stored in Supabase (EU/US regions available)
- User data encrypted at rest
- Compliant with GDPR data handling

### Audit Trail
- All security events logged
- Optional audit_log table for compliance
- Session history tracked

## Updates

This security documentation should be reviewed and updated:
- After security incidents
- After major code changes
- Quarterly security reviews
- When new features are added

---

**Last Updated**: 2025-12-13
**Version**: 1.0
**Author**: Security Team
