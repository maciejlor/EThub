/**
 * Login page styled like reference screenshot.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoaderIcon } from 'lucide-react';
import { BackgroundSlider } from '@/components/BackgroundSlider';

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiscordLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Discord OAuth implementation
      const clientId = '1501649661214199869'; // Your actual Discord Client ID
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/discord/callback');
      const scope = encodeURIComponent('identify email guilds guilds.members.read');
      
      // Redirect to Discord OAuth
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
      
      window.location.href = discordAuthUrl;
    } catch (err) {
      setError('Discord login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className='relative flex min-h-dvh items-center justify-center bg-black p-4'>
      {/* Background Image Slider */}
      <BackgroundSlider />

      {/* Ebolt Logo Top Left */}
      <div className='absolute top-8 left-8 z-20'>
        <img 
          src="/src/assets/ethub.png" 
          alt="Ebolt" 
          className="h-8 w-auto"
        />
      </div>

      {/* Main Login Form */}
      <div className='relative z-10 w-full max-w-md rounded-3xl bg-[#0f0f0f] p-8 shadow-2xl border border-gray-800/50 flex flex-col items-center'>
        
        {/* Title */}
        <h1 className='mb-6 text-center text-3xl font-bold text-white'>
          Eternal VTC
        </h1>

        {/* Error Display */}
        {error && (
          <div className='mb-6 w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
            {error}
          </div>
        )}

        {/* Social Login Buttons */}
        <div className='w-full'>
          <Button
            type='button'
            variant='outline'
            className='h-12 w-full rounded-xl border-gray-700 bg-[#1a1a1a] text-white hover:bg-gray-800 transition-colors'
            onClick={handleDiscordLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoaderIcon className='mr-2 size-4 animate-spin' />
            ) : (
              <img 
                src="/src/assets/Discord.png" 
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
