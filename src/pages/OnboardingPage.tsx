import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircleIcon, Gamepad2Icon, SettingsIcon, UserIcon } from 'lucide-react';

import { DISCORD_CONFIG } from '@/lib/discord-auth';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  status: 'pending' | 'in_progress' | 'completed';
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [discordConnected] = useState(!!localStorage.getItem('ethub_discord_user'));
  const [steamConnected, setSteamConnected] = useState(!!localStorage.getItem('ethub_steam_user'));
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');

  const steps = useMemo<OnboardingStep[]>(
    () => [
      {
        id: 'discord',
        title: 'Connect Discord',
        description: 'Connect your Discord account to verify VTC membership',
        icon: <UserIcon className="h-6 w-6" />,
        status: discordConnected ? 'completed' : 'pending',
      },
      {
        id: 'steam',
        title: 'Connect Steam',
        description: 'Link your Steam account to access TruckersMP features',
        icon: <Gamepad2Icon className="h-6 w-6" />,
        status: steamConnected ? 'completed' : 'pending',
      },
      {
        id: 'profile',
        title: 'Setup Profile',
        description: 'Choose your username and avatar for the VTC',
        icon: <SettingsIcon className="h-6 w-6" />,
        status: username.trim().length > 0 ? 'completed' : 'pending',
      },
    ],
    [discordConnected, steamConnected, username]
  );

  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const handleDiscordConnect = async () => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CONFIG.CLIENT_ID}&redirect_uri=${encodeURIComponent(
      DISCORD_CONFIG.REDIRECT_URI
    )}&response_type=code&scope=${encodeURIComponent(DISCORD_CONFIG.SCOPES.join(' '))}`;

    window.location.href = discordAuthUrl;
  };

  const handleSteamConnect = () => {
    // Simulate Steam OpenID authentication
    const dummySteamUser = {
      id: '76561198000000000',
      name: 'SteamDriver',
      avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
    };
    localStorage.setItem('ethub_steam_user', JSON.stringify(dummySteamUser));
    setSteamConnected(true);
  };

  const handleCompleteSetup = () => {
    localStorage.setItem('ethub_authenticated', 'true');
    localStorage.setItem('ethub_username', username);
    localStorage.setItem('ethub_avatar', avatar);
    localStorage.setItem('ethub_onboarding_completed', 'true');
    navigate('/');
  };

  const handleSkipAvatar = () => {
    handleCompleteSetup();
  };

  useEffect(() => {
    // Check if onboarding is already completed
    const isCompleted = localStorage.getItem('ethub_onboarding_completed') === 'true';
    if (isCompleted) navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to Eternal</h1>
          <p className="text-xl text-blue-200">Let's get you set up with your VTC profile</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <Card
              key={step.id}
              className="relative overflow-hidden transition-all duration-300 hover:scale-[1.01]"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        step.status === 'completed'
                          ? 'bg-green-500'
                          : step.status === 'in_progress'
                            ? 'bg-blue-500 animate-pulse'
                            : 'bg-gray-500'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                      <p className="text-sm text-gray-300 mt-1">{step.description}</p>
                    </div>
                  </div>
                  {step.status === 'completed' && (
                    <div className="flex items-center text-green-400">
                      <CheckCircleIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {step.id === 'discord' && (
                  <div className="space-y-4">
                    {discordConnected ? (
                      <div className="text-center py-4">
                        <div className="text-green-400 mb-2">✓ Discord Connected</div>
                        <p className="text-sm text-gray-300">
                          Discord account verified and VTC membership confirmed
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-300 mb-2">
                          Connect your Discord account to verify you're a member of Eternal VTC (ID:{' '}
                          {DISCORD_CONFIG.TRUCKERSMP_VTC_ID})
                        </p>
                        <Button onClick={handleDiscordConnect} className="w-full" size="lg">
                          Connect Discord
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {step.id === 'steam' && (
                  <div className="space-y-4">
                    {steamConnected ? (
                      <div className="text-center py-4">
                        <div className="text-green-400 mb-2">✓ Steam Connected</div>
                        <p className="text-sm text-gray-300">
                          Steam account linked for TruckersMP integration
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-300 mb-4">
                          Link your Steam account to access TruckersMP features and job tracking
                        </p>
                        <Button
                          onClick={handleSteamConnect}
                          className="w-full"
                          size="lg"
                          variant="outline"
                        >
                          Connect Steam
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {step.id === 'profile' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose your VTC username"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Avatar URL (optional)
                      </label>
                      <input
                        type="url"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={handleCompleteSetup}
                        disabled={username.trim().length === 0}
                        className="flex-1"
                        size="lg"
                      >
                        Complete Setup
                      </Button>
                      <Button
                        onClick={handleSkipAvatar}
                        variant="outline"
                        className="flex-1"
                        size="lg"
                      >
                        Skip Avatar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Setup Progress</h3>
                  <span className="text-sm text-gray-300">
                    {completedSteps}/{steps.length} Complete
                  </span>
                </div>

                <Progress value={progressPercentage} className="h-3" />

                {progressPercentage >= 100 ? (
                  <div className="space-y-2 text-center">
                    <div className="text-green-400 text-lg font-semibold">✓ Setup Complete!</div>
                    <p className="text-gray-300">Welcome to Eternal, {username}!</p>
                    <Button onClick={() => navigate('/')} className="mt-4" size="lg">
                      Go to Dashboard
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-300 text-center">
                    Complete all steps to access your dashboard
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

