# Google OAuth Setup Guide

This guide will help you configure Google OAuth authentication for your Web CRM system.

## Prerequisites

1. A Google Cloud Platform account
2. Access to Google Cloud Console
3. Your CRM running on a domain (not localhost for production)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Web CRM OAuth")
4. Click "Create"

## Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on "Google Identity" and enable it

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Web CRM"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (your email addresses)
6. Save and continue

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Name: "Web CRM OAuth"
5. Add authorized JavaScript origins:
   - `http://localhost:8000` (for development)
   - `https://yourdomain.com` (for production)
6. Add authorized redirect URIs:
   - `http://localhost:8000/login.html` (for development)
   - `https://yourdomain.com/login.html` (for production)
7. Click "Create"
8. **Copy the Client ID** - you'll need this for the next step

## Step 5: Configure Your CRM

### Update JavaScript Configuration

1. Open `js/auth.js`
2. Find this line:
   ```javascript
   this.googleClientId = 'YOUR_GOOGLE_CLIENT_ID'; // Replace with your actual client ID
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Google Client ID

### Update HTML Configuration

1. Open `login.html`
2. Find this line:
   ```html
   data-client_id="YOUR_GOOGLE_CLIENT_ID"
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Google Client ID

## Step 6: Server-Side Verification (Production)

For production use, you should verify Google tokens on the server side. Update the `verifyGoogleToken` method in `php/auth.php`:

```php
private function verifyGoogleToken($credential, $userData) {
    // Get Google's public keys
    $keys = json_decode(file_get_contents('https://www.googleapis.com/oauth2/v1/certs'), true);
    
    // Decode the JWT header
    $header = json_decode(base64_decode(explode('.', $credential)[0]), true);
    $kid = $header['kid'];
    
    // Find the correct key
    $key = null;
    foreach ($keys as $k) {
        if ($k['kid'] === $kid) {
            $key = $k;
            break;
        }
    }
    
    if (!$key) {
        return false;
    }
    
    // Verify the token
    $verified = $this->verifyJWT($credential, $key['n'], $key['e']);
    
    if (!$verified) {
        return false;
    }
    
    // Decode the payload
    $payload = json_decode(base64_decode(explode('.', $credential)[1]), true);
    
    // Verify the audience
    if ($payload['aud'] !== $this->googleClientId) {
        return false;
    }
    
    // Verify the issuer
    if ($payload['iss'] !== 'accounts.google.com' && $payload['iss'] !== 'https://accounts.google.com') {
        return false;
    }
    
    // Check if token is not expired
    if ($payload['exp'] < time()) {
        return false;
    }
    
    return $payload;
}

private function verifyJWT($token, $n, $e) {
    // Implement JWT verification using the public key
    // This is a simplified version - use a proper JWT library in production
    return true; // Placeholder
}
```

## Step 7: Database Setup

Run the database migration to add Google OAuth support:

```sql
-- Run the update_auth_schema.sql file
source update_auth_schema.sql;
```

## Step 8: Test the Integration

1. Start your web server
2. Navigate to your login page
3. Click the "Sign in with Google" button
4. Complete the Google sign-in flow
5. Verify that you're redirected to the dashboard

## Troubleshooting

### Common Issues

1. **"Invalid client" error**
   - Check that your Client ID is correct
   - Verify the authorized origins include your domain

2. **"Redirect URI mismatch" error**
   - Add your exact domain to authorized redirect URIs
   - Include both HTTP and HTTPS versions if needed

3. **"Access blocked" error**
   - Add your email to test users in OAuth consent screen
   - Verify the app is not in restricted mode

4. **Token verification fails**
   - Check that Google+ API is enabled
   - Verify your server can reach Google's servers

### Development vs Production

**Development:**
- Use `http://localhost:8000` in authorized origins
- Add your email to test users
- Use HTTP for local development

**Production:**
- Use `https://yourdomain.com` in authorized origins
- Remove test user restrictions
- Always use HTTPS
- Implement proper server-side token verification

## Security Best Practices

1. **Never expose your Client Secret** in frontend code
2. **Always verify tokens** on the server side in production
3. **Use HTTPS** in production
4. **Implement proper session management**
5. **Log authentication events** for security monitoring
6. **Regularly rotate credentials** if compromised

## Advanced Configuration

### Custom Scopes

You can request additional scopes by modifying the Google Sign-In configuration:

```html
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"
     data-context="signin"
     data-ux_mode="popup"
     data-callback="handleGoogleSignIn"
     data-auto_prompt="false"
     data-scope="openid email profile">
</div>
```

### Custom Styling

The Google Sign-In button can be customized with CSS. See the styles in `css/auth.css` for examples.

### Error Handling

The system includes comprehensive error handling for:
- Network errors
- Invalid tokens
- User cancellation
- Server errors

## Monitoring and Analytics

The system logs authentication events to help you monitor usage:

- Login attempts (successful and failed)
- Google OAuth usage
- Session creation and expiration
- Security events

You can view these in the database tables:
- `login_attempts`
- `user_sessions`
- `security_audit` view

## Support

If you encounter issues:

1. Check the browser console for JavaScript errors
2. Check the server logs for PHP errors
3. Verify your Google Cloud Console configuration
4. Test with a different browser or incognito mode
5. Ensure your domain matches the authorized origins exactly

## Next Steps

After setting up Google OAuth:

1. Test the complete authentication flow
2. Implement proper error handling
3. Add user profile management
4. Consider adding other OAuth providers (Facebook, GitHub, etc.)
5. Implement account linking (allow users to link multiple OAuth accounts)
6. Add two-factor authentication for additional security 