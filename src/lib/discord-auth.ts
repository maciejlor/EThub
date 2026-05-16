// Discord authentication utilities and configuration

export const DISCORD_CONFIG = {
  CLIENT_ID: '1501649661214199869',
  CLIENT_SECRET: 'Y0wtxTqSCANfSjOwWbvTLffG-aTj5k4D', // Added by user
  REDIRECT_URI: `${window.location.origin}/auth/discord/callback`,
  SERVER_ID: '932199620224901170', // Your Discord server ID
  REQUIRED_ROLE_ID: '1127578418129670285', // Role ID for access
  SCOPES: ['identify', 'email', 'guilds', 'guilds.members.read'],
  TRUCKERSMP_VTC_ID: '74784', // Eternal VTC ID for TruckersMP
};

// Temporary bypass for testing - remove this once you add CLIENT_SECRET
export const TEMP_BYPASS_OAUTH = true;

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email?: string;
  verified?: boolean;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  owner?: boolean;
  permissions?: string;
  features?: string[];
  roles: string[];
}

export interface DiscordAuthResult {
  user: DiscordUser;
  hasRequiredRole: boolean;
  isInServer: boolean;
  guild?: DiscordGuild;
}

/**
 * Exchange Discord authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch('https://discord.com/api/oauth2/token', {
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

  if (!response.ok) {
    throw new Error(`Failed to exchange code: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Get Discord user information using access token
 */
export async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch('https://discord.com/api/users/@me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get user's Discord guilds (servers)
 */
export async function getUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const response = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch guilds: ${response.status}`);
  }

  return await response.json();
}

/**
 * Check if user has required role in the specified Discord server
 */
export async function checkDiscordRole(accessToken: string): Promise<DiscordAuthResult> {
  const [user, guilds] = await Promise.all([
    getDiscordUser(accessToken),
    getUserGuilds(accessToken),
  ]);

  // Find the target server
  const targetGuild = guilds.find(guild => guild.id === DISCORD_CONFIG.SERVER_ID);
  
  const isInServer = !!targetGuild;
  const hasRequiredRole = isInServer && targetGuild.roles.includes(DISCORD_CONFIG.REQUIRED_ROLE_ID);

  return {
    user,
    hasRequiredRole,
    isInServer,
    guild: targetGuild,
  };
}

/**
 * Check if user is member of Eternal VTC in TruckersMP
 * This would require TruckersMP API integration
 */
export async function checkTruckersMPVTCMembership(discordUserId: string): Promise<boolean> {
  // For now, we'll assume Discord role check is sufficient
  // In production, you'd integrate with TruckersMP API to verify VTC membership
  console.log(`Checking TruckersMP VTC membership for Discord user: ${discordUserId}`);
  
  // TODO: Integrate with TruckersMP API to verify VTC ID ${DISCORD_CONFIG.TRUCKERSMP_VTC_ID}
  return true; // Placeholder - assume Discord role check is sufficient
}

/**
 * Store Discord user session in localStorage
 */
export function storeDiscordSession(user: DiscordUser): void {
  localStorage.setItem('ethub_authenticated', 'true');
  localStorage.setItem('ethub_discord_user', JSON.stringify(user));
  localStorage.setItem('ethub_auth_method', 'discord');
  localStorage.setItem('ethub_login_time', Date.now().toString());
}

/**
 * Clear Discord session
 */
export function clearDiscordSession(): void {
  localStorage.removeItem('ethub_authenticated');
  localStorage.removeItem('ethub_discord_user');
  localStorage.removeItem('ethub_auth_method');
  localStorage.removeItem('ethub_login_time');
}

/**
 * Check if user is authenticated via Discord
 */
export function isDiscordAuthenticated(): boolean {
  return localStorage.getItem('ethub_auth_method') === 'discord' && 
         localStorage.getItem('ethub_authenticated') === 'true';
}

/**
 * Get stored Discord user
 */
export function getStoredDiscordUser(): DiscordUser | null {
  const stored = localStorage.getItem('ethub_discord_user');
  return stored ? JSON.parse(stored) : null;
}

/**
 * Generate Discord OAuth URL
 */
export function generateDiscordOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: DISCORD_CONFIG.CLIENT_ID,
    redirect_uri: DISCORD_CONFIG.REDIRECT_URI,
    response_type: 'code',
    scope: DISCORD_CONFIG.SCOPES.join(' '),
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}
