/**
 * Login page - Discord OAuth only, with a premium Quick Test Switcher for local development.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoaderIcon, ShieldIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { BackgroundSlider } from '@/components/BackgroundSlider';
import { getUsers, setCurrentUser } from '@/lib/driver-storage';
import ethubLogo from '@/assets/ethub.png';
import discordIcon from '@/assets/Discord.png';

export function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);

  const handleDiscordLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const clientId = '1501649661214199869';
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/discord/callback');
      const scope = encodeURIComponent('identify email guilds guilds.members.read');
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
      window.location.href = discordAuthUrl;
    } catch {
      setError('Discord login failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Quick switch function for developer testing
  const handleQuickSwitch = (userId: string) => {
    const users = getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    if (target.isPending) {
      // If it's a pending user, simulate landing on the pending screen
      localStorage.setItem('ethub_authenticated', 'false');
      localStorage.removeItem('ethub_current_user_id');
      
      // Mock Discord callback state for this pending user
      const mockDiscordUser = {
        id: target.discordId || '12345',
        username: target.username,
        discriminator: '0000',
        avatar: '',
      };
      localStorage.setItem('ethub_discord_user', JSON.stringify(mockDiscordUser));
      
      navigate(`/auth/discord/callback?code=mock_pending_${userId}`);
      return;
    }

    // Otherwise log them in normally
    setCurrentUser(userId);
    localStorage.setItem('ethub_authenticated', 'true');
    navigate('/');
  };

  const allUsers = getUsers();
  const activeStaff = allUsers.filter((u) => u.isActive && !u.isPending && u.role !== 'Driver');
  const activeDrivers = allUsers.filter((u) => u.isActive && !u.isPending && u.role === 'Driver');
  const pendingRequests = allUsers.filter((u) => u.isPending);

  return (
    <div className='relative flex min-h-dvh flex-col items-center justify-center bg-black p-4'>
      {/* Background Image Slider */}
      <BackgroundSlider />

      {/* Logo Top Left */}
      <div className='absolute top-8 left-8 z-20'>
        <img
          src={ethubLogo}
          alt="EThub"
          className="h-8 w-auto"
        />
      </div>

      {/* Main Login Card */}
      <div className='relative z-10 w-full max-w-md rounded-3xl bg-[#0f0f0f]/90 backdrop-blur-md p-8 shadow-2xl border border-gray-800/50 flex flex-col items-center mb-6'>

        {/* Title */}
        <h1 className='mb-2 text-center text-3xl font-bold text-white tracking-tight'>
          Eternal VTC
        </h1>
        <p className='mb-8 text-center text-sm text-gray-500'>
          Sign in to access the hub
        </p>

        {/* Error Display */}
        {error && (
          <div className='mb-6 w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
            {error}
          </div>
        )}

        {/* Discord Login Button */}
        <div className='w-full'>
          <Button
            type='button'
            variant='outline'
            id='discord-login-btn'
            className='h-12 w-full rounded-xl border-gray-700 bg-[#1a1a1a] text-white hover:bg-[#5865F2]/20 hover:border-[#5865F2]/50 transition-all duration-300'
            onClick={handleDiscordLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoaderIcon className='mr-2 size-4 animate-spin text-gray-400' />
            ) : (
              <img
                src={discordIcon}
                alt="Discord"
                className="mr-3 h-5 w-5"
              />
            )}
            Sign in with Discord
          </Button>
        </div>

      </div>
    </div>
  );
}
