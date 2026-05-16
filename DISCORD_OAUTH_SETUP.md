# Discord OAuth Integration Setup Guide

## Overview
This guide will help you set up Discord OAuth authentication for EThub VTC system.

## Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Fill in application details:
   - **Name**: EThub VTC
   - **Description**: VTC management and authentication system
4. Click "Create"

## Step 2: Configure OAuth2 Redirect

1. Go to "OAuth2" tab in your application
2. Set "Redirects" to:
   ```
   http://localhost:5173/auth/discord/callback
   ```
   (For production, use your actual domain)
3. Add these scopes:
   - `identify` - Get user's Discord info
   - `email` - Get user's email
   - `guilds` - Get user's servers (optional)

## Step 3: Get Client Credentials

1. In OAuth2 tab, you'll find:
   - **Client ID**: Copy this
   - **Client Secret**: Click "View Secret" and copy it

## Step 4: Update Your Code

Replace the placeholder in `src/pages/Login.tsx`:

```typescript
const clientId = 'YOUR_DISCORD_CLIENT_ID'; // Replace with your actual Discord Client ID
```

With your actual Client ID:

```typescript
const clientId = '12345678901234567890'; // Your real Client ID
```

## Step 5: Create OAuth Callback Route

Create a new file `src/pages/DiscordCallback.tsx`:

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function DiscordCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Exchange code for access token
      exchangeCodeForToken(code);
    } else {
      navigate('/login?error=access_denied');
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div>Connecting to Discord...</div>
    </div>
  );
}

async function exchangeCodeForToken(code: string) {
  try {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: 'YOUR_CLIENT_ID',
        client_secret: 'YOUR_CLIENT_SECRET',
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'http://localhost:5173/auth/discord/callback',
      }),
    });

    const data = await response.json();
    
    // Get user info with access token
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
      },
    });

    const userData = await userResponse.json();
    
    // Store user data and redirect
    localStorage.setItem('ethub_authenticated', 'true');
    localStorage.setItem('ethub_discord_user', JSON.stringify(userData));
    window.location.href = '/';
    
  } catch (error) {
    console.error('Discord OAuth failed:', error);
    window.location.href = '/login?error=oauth_failed';
  }
}
```

## Step 6: Add Route to App.tsx

Add the callback route to your main App component:

```typescript
import { DiscordCallbackPage } from '@/pages/DiscordCallbackPage';

// In your Routes section:
<Route path='/auth/discord/callback' element={<DiscordCallbackPage />} />
```

## Step 7: Environment Variables (Recommended)

For better security, use environment variables:

Create `.env` file:
```
VITE_DISCORD_CLIENT_ID=your_client_id_here
VITE_DISCORD_CLIENT_SECRET=your_client_secret_here
VITE_DISCORD_REDIRECT_URI=http://localhost:5173/auth/discord/callback
```

Then update your code:
```typescript
const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
const redirectUri = import.meta.env.VITE_DISCORD_REDIRECT_URI;
```

## Step 8: Testing

1. Start your development server
2. Go to login page
3. Click "Continue with Discord"
4. Authorize the application
5. You should be redirected back and logged in

## Security Notes

- **Never expose Client Secret** in frontend code
- **Always validate** the OAuth state parameter
- **Use HTTPS** in production
- **Set proper redirect URI** in Discord dashboard

## Troubleshooting

**"Invalid redirect_uri" error:**
- Check that redirect URI matches exactly in Discord dashboard
- Include http:// or https://
- No trailing slashes

**"Access denied" error:**
- User denied authorization
- Check that scopes are correct

**"Missing client_id" error:**
- Verify Client ID is correct
- Check for extra spaces or characters

## Production Deployment

For production:
1. Update redirect URI to your domain
2. Use environment variables
3. Implement proper session management
4. Add error handling and logging
5. Consider using a backend for OAuth flow

## Current Implementation Status

✅ Discord OAuth button added to login page
✅ OAuth URL generation implemented
⚠️ Need to create callback route
⚠️ Need to add Client ID
⚠️ Need to implement token exchange

The basic structure is ready - you just need to fill in your Discord application credentials!
