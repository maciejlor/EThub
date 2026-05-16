import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderIcon, ShieldIcon, XCircleIcon } from 'lucide-react';
import { DISCORD_CONFIG } from '@/lib/discord-auth';
import { getUsers, setCurrentUser, addUser } from '@/lib/driver-storage';
import { BackgroundSlider } from '@/components/BackgroundSlider';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email?: string;
}

export function DiscordCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'checking' | 'success' | 'error' | 'no_role'>('loading');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<DiscordUser | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      setStatus('error');
      setMessage('Authorization denied. Please try again.');
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received.');
      return;
    }

    handleDiscordCallback(code);
  }, []);

  const handleDiscordCallback = async (code: string) => {
    try {
      setStatus('checking');
      setMessage('Exchanging authorization code...');

      // In production, you MUST set DISCORD_CONFIG.CLIENT_SECRET in discord-auth.ts.
      // Exchange code for access token
      console.log('Exchanging code for token...');
      
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: DISCORD_CONFIG.CLIENT_ID,
          client_secret: DISCORD_CONFIG.CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: DISCORD_CONFIG.REDIRECT_URI,
        }),
      });

      console.log('Token response status:', tokenResponse.status);
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        throw new Error(`Failed to exchange code for token: ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Token data received:', tokenData);
      
      if (!tokenData.access_token) {
        throw new Error('No access token in response');
      }
      
      const accessToken = tokenData.access_token;

      // Get user information
      setMessage('Fetching user information...');
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user information');
      }

      const userData: DiscordUser = await userResponse.json();
      setUser(userData);

      // Get user's guild member object for the specific server to get their roles
      setMessage('Checking server roles...');
      const memberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${DISCORD_CONFIG.SERVER_ID}/member`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (memberResponse.status === 404) {
        setStatus('no_role');
        setMessage(`You must join the EThub Discord server to access this system.`);
        return;
      }

      if (!memberResponse.ok) {
        throw new Error('Failed to fetch guild member information');
      }

      const memberData = await memberResponse.json();
      const userRoles: string[] = memberData.roles || [];
      
      console.log('User roles:', userRoles);
      console.log('Required role ID:', DISCORD_CONFIG.REQUIRED_ROLE_ID);
      
      const hasRequiredRole = userRoles.includes(DISCORD_CONFIG.REQUIRED_ROLE_ID);
      
      if (!hasRequiredRole) {
        setStatus('no_role');
        setMessage(`You don't have the required role in EThub Discord server. Required role ID: ${DISCORD_CONFIG.REQUIRED_ROLE_ID}. Please contact an administrator.`);
        return;
      }

      // Success - user has required role
      setStatus('success');
      setMessage('Authentication successful! Redirecting...');

      // If an admin-created user matches this Discord ID, set it as current user.
      // If not, automatically create a new user entry for them since they successfully logged in.
      let matched = getUsers().find((u) => u.discordId === userData.id);
      if (!matched) {
        matched = addUser({
          username: userData.username,
          password: '', // Auto-generated/No password needed for Discord login
          email: userData.email || '',
          displayName: userData.username,
          avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`,
          role: 'Driver',
          department: 'Event', // Default
          isActive: true,
          createdBy: 'System (Auto-Join)',
          discordId: userData.id,
          discordUsername: userData.username,
        });
      }
      setCurrentUser(matched.id);

      // Store user session
      localStorage.setItem('ethub_authenticated', 'true');
      localStorage.setItem('ethub_discord_user', JSON.stringify(userData));
      localStorage.setItem('ethub_user_role', 'discord_authenticated');

      // Redirect to dashboard after delay
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Discord OAuth error:', error);
      setStatus('error');
      setMessage('Authentication failed. Please try again.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
      case 'checking':
        return <LoaderIcon className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <ShieldIcon className="h-8 w-8 text-green-500" />;
      case 'no_role':
        return <XCircleIcon className="h-8 w-8 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-8 w-8 text-red-500" />;
      default:
        return <LoaderIcon className="h-8 w-8 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'no_role':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'error':
        return 'text-red-400 border-red-500/30 bg-red-500/10';
      default:
        return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black p-4">
      {/* Background Image Overlay */}
      <BackgroundSlider />

      <Card className="relative z-10 w-full max-w-md bg-[#0f0f0f] border-gray-800/50 text-white shadow-2xl">
        <CardHeader className="text-center border-b border-gray-800">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-lg text-white">
            {status === 'loading' && 'Connecting to Discord...'}
            {status === 'checking' && 'Verifying Access...'}
            {status === 'success' && 'Authentication Successful'}
            {status === 'no_role' && 'Access Denied'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className={`text-center text-sm ${getStatusColor()} p-4 rounded-lg border`}>
            {message}
          </div>
          
          {user && (
            <div className="flex items-center justify-center space-x-3 p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
              <img 
                src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                alt={user.username}
                className="w-10 h-10 rounded-full"
              />
              <div className="text-left">
                <p className="font-medium text-gray-200">{user.username}</p>
                <p className="text-sm text-gray-400">{user.email || 'No email'}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-800 transition-colors"
            >
              Back to Login
            </Button>
          )}

          {status === 'no_role' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 text-center">
                To gain access, please:
              </p>
              <div className="text-sm space-y-2 text-gray-300">
                <p className="flex gap-2"><span>1.</span> Join the EThub Discord server</p>
                <p className="flex gap-2"><span>2.</span> Contact an administrator for the required role</p>
                <p className="flex gap-2"><span>3.</span> Try logging in again</p>
              </div>
              <Button 
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-800 transition-colors"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
