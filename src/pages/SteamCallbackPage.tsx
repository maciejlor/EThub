import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderIcon, ShieldIcon, XCircleIcon } from 'lucide-react';
import { BackgroundSlider } from '@/components/BackgroundSlider';
import { getCurrentUser, updateUserSettings } from '@/lib/driver-storage';
import { getSteamPlayerSummary } from '@/lib/steam-ets2';

export function SteamCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying Steam connection...');

  const handleSteamCallback = useCallback(async (params: URLSearchParams) => {
    try {
      // Extract the steamid from the identity URL
      const identity = params.get('openid.identity');
      const steamId = identity?.split('/').pop();

      if (!steamId) {
        throw new Error('No Steam ID found in response');
      }

      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('No user session found');
      }

      // Fetch real Steam profile data
      setMessage('Fetching Steam profile details...');
      const steamProfile = await getSteamPlayerSummary(steamId);
      
      const steamUsername = steamProfile?.personaname || steamId;
      const steamAvatar = steamProfile?.avatarfull || `https://avatars.akamai.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg`;

      // Update user settings with Steam info (store steam avatar separately)
      updateUserSettings(currentUser.id, {
        steamId,
        steamUsername,
        username: steamUsername,
        displayName: steamUsername,
        steamAvatar: steamAvatar,
        avatar: steamAvatar,
      });

      setStatus('success');
      setMessage('Steam account connected successfully!');

      setTimeout(() => {
        navigate('/settings');
      }, 2000);
    } catch (error) {
      console.error('Steam connection error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to connect Steam account');
    }
  }, [navigate]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Steam OpenID returns many openid.* parameters
    if (urlParams.has('openid.mode')) {
      handleSteamCallback(urlParams);
    } else {
      // If we got here without openid params, something is wrong
      setStatus('error');
      setMessage('Invalid Steam response received.');
    }
  }, [handleSteamCallback]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <LoaderIcon className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <ShieldIcon className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-8 w-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'error':
        return 'text-red-400 border-red-500/30 bg-red-500/10';
      default:
        return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black p-4">
      <BackgroundSlider />

      <Card className="relative z-10 w-full max-w-md bg-[#0f0f0f] border-gray-800/50 text-white shadow-2xl">
        <CardHeader className="text-center border-b border-gray-800">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-lg text-white">
            {status === 'loading' && 'Steam Connection'}
            {status === 'success' && 'Connection Successful'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className={`text-center text-sm ${getStatusColor()} p-4 rounded-lg border`}>
            {message}
          </div>

          {status === 'error' && (
            <button 
              onClick={() => navigate('/settings')}
              className="w-full h-10 rounded-md bg-[#1a1a1a] border border-gray-700 text-white hover:bg-gray-800 transition-colors"
            >
              Back to Settings
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
