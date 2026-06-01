import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderIcon, ShieldIcon, XCircleIcon, ClockIcon, SendIcon, CheckCircleIcon, LinkIcon, UserIcon, TrashIcon } from 'lucide-react';
import { DISCORD_CONFIG } from '@/lib/discord-auth';
import { getUsers, setCurrentUser, addUser, updateUser } from '@/lib/driver-storage';
import { BackgroundSlider } from '@/components/BackgroundSlider';
import { initialSyncPromise } from '@/lib/sync';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email?: string;
}

type PageStatus =
  | 'loading'
  | 'checking'
  | 'success'
  | 'pending'           // User is in DB but pending admin approval
  | 'not_registered'   // Discord ID not in DB at all
  | 'request_sent'     // User just submitted their join request
  | 'inactive'         // Account exists but set to inactive
  | 'error';

export function DiscordCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<PageStatus>('loading');
  const [message, setMessage] = useState('');
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For "link existing account" flow
  const [showLinkAccount, setShowLinkAccount] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState('');

  const handleResetStorage = () => {
    if (confirm('Are you sure you want to reset all storage and sessions? This will wipe all current users and reload the original default seeded staff.')) {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleDiscordCallback = useCallback(async (code: string) => {
    try {
      setStatus('checking');
      setMessage('Exchanging authorization code…');

      // ── MOCK BYPASS FOR QUICK SWITCHER TESTING ──────────────────────────
      if (code.startsWith('mock_')) {
        const userId = code.replace(/^mock_pending_/, '').replace(/^mock_login_/, '');
        const matched = getUsers().find((u) => u.id === userId);
        if (matched) {
          const userData: DiscordUser = {
            id: matched.discordId || '123456789',
            username: matched.username,
            discriminator: '0000',
            avatar: matched.avatar || '',
            email: matched.email || undefined,
          };
          setDiscordUser(userData);
          if (code.startsWith('mock_pending_')) {
            setStatus('pending');
            setMessage('Your join request is still pending admin approval. Please check back later.');
            return;
          }
          // Log in mock active user
          setCurrentUser(matched.id);
          localStorage.setItem('ethub_authenticated', 'true');
          localStorage.setItem('ethub_discord_user', JSON.stringify(userData));
          setStatus('success');
          setMessage(`Welcome back, ${matched.displayName}! Redirecting to dashboard…`);
          setTimeout(() => navigate('/'), 1200);
          return;
        }
      }

      // Exchange code for access token
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const tokenUrl = isLocal ? '/discord-api/oauth2/token' : '/api/discord-token';
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: DISCORD_CONFIG.CLIENT_ID,
          client_secret: DISCORD_CONFIG.CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: DISCORD_CONFIG.REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        const err = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${err}`);
      }

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) throw new Error('No access token in response');

      const accessToken: string = tokenData.access_token;
      handleDiscordCallbackWithToken(accessToken);
    } catch (err) {
      console.error('Discord OAuth error:', err);
      setStatus('error');
      setMessage('Authentication failed. Please try again.');
    }
  }, [navigate]);

  const handleDiscordCallbackWithToken = useCallback(async (accessToken: string) => {
    try {
      setStatus('checking');
      setMessage('Fetching Discord profile…');

      // Fetch Discord profile - Try direct request first, then fallback to Vite proxy
      let userResponse;
      try {
        userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (e) {
        userResponse = await fetch('/discord-api/users/@me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }

      if (!userResponse.ok) throw new Error('Failed to fetch Discord user info');

      const userData: DiscordUser = await userResponse.json();
      setDiscordUser(userData);

      // ── Gate: look up by Discord ID ─────────────────────────────────────
      setMessage('Syncing database…');
      await initialSyncPromise;
      setMessage('Checking access…');
      const allUsers = getUsers();
      // Prefer active + approved accounts first — avoids getting stuck on pending
      // when both a pending request AND an active account share the same Discord ID.
      const matched =
        allUsers.find((u) => u.discordId === userData.id && u.isActive && !u.isPending) ??
        allUsers.find((u) => u.discordId === userData.id && u.isPending) ??
        allUsers.find((u) => u.discordId === userData.id);

      if (matched) {
        if (matched.isPending) {
          setStatus('pending');
          setMessage('Your join request is still pending admin approval. Please check back later.');
          return;
        }

        if (!matched.isActive) {
          setStatus('inactive');
          setMessage('Your account is inactive. Please contact an administrator.');
          return;
        }

        // Active user — sync Discord info then log in
        updateUser(matched.id, {
          discordUsername: userData.username,
          discordAvatar: userData.avatar
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
            : matched.discordAvatar,
        });

        setCurrentUser(matched.id);
        localStorage.setItem('ethub_authenticated', 'true');
        localStorage.setItem('ethub_discord_user', JSON.stringify(userData));
        localStorage.setItem('ethub_discord_access_token', accessToken);

        setStatus('success');
        setMessage(`Welcome back, ${matched.displayName}! Redirecting to dashboard…`);
        setTimeout(() => navigate('/'), 1800);
        return;
      }

      // Not in DB → show options
      setStatus('not_registered');
      setMessage('');
    } catch (err) {
      console.error('Discord OAuth profile fetch error:', err);
      setStatus('error');
      setMessage('Authentication failed. Please try again.');
    }
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    // Parse implicit grant token if present in url hash fragment
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const hashError = hashParams.get('error');

    if (error || hashError) {
      setStatus('error');
      setMessage('Authorization was denied. Please try again.');
      return;
    }

    if (accessToken) {
      handleDiscordCallbackWithToken(accessToken);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code or access token received from Discord.');
      return;
    }

    handleDiscordCallback(code);
  }, [handleDiscordCallback, handleDiscordCallbackWithToken]);

  // ── Submit join request ───────────────────────────────────────────────────
  const handleSubmitRequest = () => {
    if (!discordUser) return;
    setIsSubmitting(true);

    addUser({
      username: discordUser.username,
      email: discordUser.email ?? '',
      displayName: discordUser.username,
      avatar: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : '',
      discordId: discordUser.id,
      discordUsername: discordUser.username,
      discordAvatar: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : '',
      role: 'Driver',
      department: 'HR',
      isActive: false,
      isPending: true,
      createdBy: 'System (Join Request)',
    });

    setIsSubmitting(false);
    setStatus('request_sent');
    setMessage('Your request has been submitted! An admin will review it shortly.');
  };

  // ── Link to existing account ──────────────────────────────────────────────
  const activeUnlinkedUsers = getUsers().filter(
    (u) => u.isActive && !u.isPending && (!u.discordId || u.discordId.startsWith('123456789'))
  );

  const handleLinkAccount = () => {
    if (!discordUser || !selectedAccountId) return;
    setIsLinking(true);
    setLinkError('');

    const success = updateUser(selectedAccountId, {
      discordId: discordUser.id,
      discordUsername: discordUser.username,
      discordAvatar: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : '',
    });

    if (success) {
      setCurrentUser(selectedAccountId);
      localStorage.setItem('ethub_authenticated', 'true');
      localStorage.setItem('ethub_discord_user', JSON.stringify(discordUser));
      // Note: We don't have access token in link account flow, so we can't store it
      setStatus('success');
      const linkedUser = getUsers().find((u) => u.id === selectedAccountId);
      setMessage(`Welcome, ${linkedUser?.displayName ?? 'User'}! Redirecting to dashboard…`);
      setTimeout(() => navigate('/'), 1800);
    } else {
      setLinkError('Failed to link account. Please try again.');
    }
    setIsLinking(false);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const avatarUrl = discordUser?.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null;

  const statusConfig: Record<PageStatus, { title: string; icon: React.ReactNode; border: string }> = {
    loading:       { title: 'Connecting to Discord…', icon: <LoaderIcon className="h-8 w-8 animate-spin text-blue-400" />, border: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
    checking:      { title: 'Verifying Access…',      icon: <LoaderIcon className="h-8 w-8 animate-spin text-blue-400" />, border: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
    success:       { title: 'Welcome!',                icon: <CheckCircleIcon className="h-8 w-8 text-green-400" />,       border: 'border-green-500/30 bg-green-500/10 text-green-300' },
    pending:       { title: 'Request Pending',         icon: <ClockIcon className="h-8 w-8 text-yellow-400" />,            border: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' },
    not_registered:{ title: 'Not Registered',          icon: <ShieldIcon className="h-8 w-8 text-orange-400" />,           border: 'border-orange-500/30 bg-orange-500/10 text-orange-300' },
    request_sent:  { title: 'Request Submitted!',      icon: <CheckCircleIcon className="h-8 w-8 text-green-400" />,       border: 'border-green-500/30 bg-green-500/10 text-green-300' },
    inactive:      { title: 'Account Inactive',        icon: <XCircleIcon className="h-8 w-8 text-red-400" />,             border: 'border-red-500/30 bg-red-500/10 text-red-300' },
    error:         { title: 'Authentication Failed',   icon: <XCircleIcon className="h-8 w-8 text-red-400" />,             border: 'border-red-500/30 bg-red-500/10 text-red-300' },
  };

  const cfg = statusConfig[status];

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black p-4">
      <BackgroundSlider />

      <Card className="relative z-10 w-full max-w-md bg-[#0f0f0f] border-gray-800/50 text-white shadow-2xl">
        <CardHeader className="text-center border-b border-gray-800 pb-5">
          <div className="flex justify-center mb-4">{cfg.icon}</div>
          <CardTitle className="text-lg text-white">{cfg.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Discord user info card */}
          {discordUser && (
            <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
              {avatarUrl ? (
                <img src={avatarUrl} alt={discordUser.username} className="w-10 h-10 rounded-full shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#5865F2]/20 flex items-center justify-center shrink-0">
                  <ShieldIcon className="h-5 w-5 text-[#5865F2]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-gray-200 truncate">{discordUser.username}</p>
                <p className="text-xs text-gray-400 font-mono truncate">ID: {discordUser.id}</p>
              </div>
            </div>
          )}

          {/* Status message */}
          {message && (
            <div className={`text-sm text-center p-4 rounded-lg border ${cfg.border}`}>
              {message}
            </div>
          )}

          {/* NOT REGISTERED: two options */}
          {status === 'not_registered' && !showLinkAccount && (
            <div className="space-y-3">
              <div className="text-sm text-gray-400 text-center leading-relaxed">
                Your Discord account (<span className="text-white font-mono">{discordUser?.username}</span>) is not
                registered in EThub.
              </div>

              {/* Option 1: Submit join request */}
              <Button
                id="submit-join-request"
                onClick={handleSubmitRequest}
                disabled={isSubmitting}
                className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white transition-colors"
              >
                {isSubmitting ? (
                  <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <SendIcon className="h-4 w-4 mr-2" />
                )}
                Submit Join Request
              </Button>

              {/* Divider */}
              {activeUnlinkedUsers.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-t border-gray-800" />
                    <span className="text-[10px] text-gray-600 uppercase tracking-widest">or</span>
                    <div className="flex-1 border-t border-gray-800" />
                  </div>

                  {/* Option 2: Link to existing account */}
                  <Button
                    id="link-existing-account"
                    variant="outline"
                    onClick={() => setShowLinkAccount(true)}
                    className="w-full bg-[#1a1a1a] border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    I already have an account
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full bg-transparent border-gray-800 text-gray-500 hover:bg-gray-900 hover:text-white text-xs"
              >
                Back to Login
              </Button>
            </div>
          )}

          {/* LINK EXISTING ACCOUNT panel */}
          {status === 'not_registered' && showLinkAccount && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 text-center">
                Select your existing account to link this Discord profile to it.
              </p>

              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-full bg-[#1a1a1a] border-gray-700 text-white">
                  <SelectValue placeholder="Select your account…" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-gray-800 text-white">
                  {activeUnlinkedUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="hover:bg-gray-800 focus:bg-gray-800 text-white focus:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                          <UserIcon className="h-3 w-3 text-gray-400" />
                        </div>
                        <span>{u.displayName}</span>
                        <span className="text-gray-500 text-xs">— {u.role}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {linkError && (
                <p className="text-xs text-red-400 text-center">{linkError}</p>
              )}

              <Button
                id="confirm-link-account"
                onClick={handleLinkAccount}
                disabled={!selectedAccountId || isLinking}
                className="w-full bg-white hover:bg-gray-200 text-black font-semibold"
              >
                {isLinking ? (
                  <LoaderIcon className="h-4 w-4 mr-2 animate-spin text-black" />
                ) : (
                  <LinkIcon className="h-4 w-4 mr-2" />
                )}
                Link & Login
              </Button>

              <Button
                variant="outline"
                onClick={() => { setShowLinkAccount(false); setSelectedAccountId(''); setLinkError(''); }}
                className="w-full bg-transparent border-gray-800 text-gray-500 hover:bg-gray-900 hover:text-white text-xs"
              >
                ← Back
              </Button>
            </div>
          )}

          {/* PENDING: already submitted */}
          {(status === 'pending' || status === 'request_sent') && (
            <div className="space-y-2 w-full">
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-800 text-sm"
              >
                Back to Login
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetStorage}
                className="w-full bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-950/50 hover:text-red-300 text-xs flex items-center justify-center gap-1.5"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Reset Sessions & Database
              </Button>
            </div>
          )}

          {/* ERROR / INACTIVE */}
          {(status === 'error' || status === 'inactive') && (
            <div className="space-y-2 w-full">
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-800 text-sm"
              >
                Back to Login
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetStorage}
                className="w-full bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-950/50 hover:text-red-300 text-xs flex items-center justify-center gap-1.5"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Reset Sessions & Database
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
