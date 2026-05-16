/** Euro Truck Simulator 2 on Steam */
export const ETS2_STEAM_APP_ID = 227300;

function steamApiKey(): string | undefined {
  const k = import.meta.env.VITE_STEAM_WEB_API_KEY;
  return typeof k === 'string' && k.trim() ? k.trim() : undefined;
}

/** Proxied at `/steam-api` (see vite.config) — omit host so deploys can add the same reverse proxy. */
function steamApiPath(pathWithLeadingSlash: string, queryString: string): string {
  const path = pathWithLeadingSlash.startsWith('/') ? pathWithLeadingSlash : `/${pathWithLeadingSlash}`;
  return `/steam-api${path}?${queryString}`;
}

/** Parse 76561198… or profile URLs into SteamID64 */
export function parseSteamId64(input: string): string | null {
  const t = input.trim();
  if (/^7656119\d{10,}$/.test(t)) return t;
  const u = t.match(/steamcommunity\.com\/profiles\/(\d+)/i);
  if (u) return u[1];
  return null;
}

async function steamJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = steamApiKey();
  if (!key) throw new Error('Missing VITE_STEAM_WEB_API_KEY');
  const q = new URLSearchParams({ ...params, key, format: 'json' }).toString();
  const url = steamApiPath(path, q);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam API HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

type ResolveVanityResponse = {
  response?: { steamid?: string; success?: number; message?: string };
};

/** Resolve vanity URL segment (e.g. `myusername` or full `https://.../id/myusername`) */
export async function resolveVanityToSteamId64(vanityRaw: string): Promise<string | null> {
  const key = steamApiKey();
  if (!key) return null;
  let vanity = vanityRaw.trim();
  const m = vanity.match(/steamcommunity\.com\/id\/([^/?#]+)/i);
  if (m) vanity = decodeURIComponent(m[1]);
  if (!vanity || /^7656119\d+$/.test(vanity)) return null;

  const data = await steamJson<ResolveVanityResponse>('/ISteamUser/ResolveVanityURL/v0001/', {
    vanityurl: vanity,
    url_type: '1',
  });
  const id = data.response?.steamid;
  if (!id || data.response?.success !== 1) return null;
  return id;
}

type RecentGamesResponse = {
  response?: {
    total_count?: number;
    games?: Array<{
      appid: number;
      name?: string;
      rtime_last_played?: number;
      playtime_forever?: number;
    }>;
  };
};

type OwnedGamesResponse = {
  response?: {
    game_count?: number;
    games?: Array<{
      appid: number;
      name?: string;
      rtime_last_played?: number;
      playtime_forever?: number;
    }>;
  };
};

type PlayerSummariesResponse = {
  response?: {
    players?: Array<{
      steamid?: string;
      gameid?: string;
      gameextrainfo?: string;
    }>;
  };
};

/**
 * Uses GetRecentlyPlayedGames — only games launched recently appear; otherwise ETS2 may be absent.
 */
export async function fetchEts2LastPlayedUnix(steamId64: string): Promise<{
  lastPlayedUnix: number | null;
  note?: string;
}> {
  console.log('Steam API - Checking Steam ID:', steamId64);
  try {
    // Check live game first: if user is currently in ETS2, show explicit status.
    const summary = await steamJson<PlayerSummariesResponse>('/ISteamUser/GetPlayerSummaries/v0002/', {
      steamids: steamId64,
    });
    const player = summary.response?.players?.[0];
    if (player?.gameid === String(ETS2_STEAM_APP_ID)) {
      return { lastPlayedUnix: null, note: 'Currently playing ETS2.' };
    }

  const recent = await steamJson<RecentGamesResponse>(
    '/IPlayerService/GetRecentlyPlayedGames/v0001/',
    {
      steamid: steamId64,
      count: '50',
    }
  );

  const recentGames = recent.response?.games ?? [];
  console.log('Steam API - Recent games:', recentGames.length, 'games found');
  const recentEts2 = recentGames.find((g) => g.appid === ETS2_STEAM_APP_ID);
  console.log('Steam API - ETS2 in recent:', !!recentEts2, recentEts2);
  const recentTs = recentEts2?.rtime_last_played;
  if (typeof recentTs === 'number' && recentTs > 0) {
    console.log('Steam API - Found recent ETS2 play time:', new Date(recentTs * 1000));
    return { lastPlayedUnix: recentTs };
  }

  // Fallback to full owned games history so older ETS2 activity can still be found.
  const owned = await steamJson<OwnedGamesResponse>('/IPlayerService/GetOwnedGames/v0001/', {
    steamid: steamId64,
    include_appinfo: '1',
  });
  const ownedGames = owned.response?.games ?? [];
  console.log('Steam API - Owned games:', ownedGames.length, 'games found');
  console.log('Steam API - First few games:', ownedGames.slice(0, 5).map(g => ({ name: g.name, appid: g.appid })));
  const ownedEts2 = ownedGames.find((g) => g.appid === ETS2_STEAM_APP_ID);
  console.log('Steam API - ETS2 in owned:', !!ownedEts2, ownedEts2);
  const ownedTs = ownedEts2?.rtime_last_played;
  if (typeof ownedTs === 'number' && ownedTs > 0) {
    console.log('Steam API - Found owned ETS2 play time:', new Date(ownedTs * 1000));
    return { lastPlayedUnix: ownedTs, note: 'From owned games history (not recent list).' };
  }

  // If Steam reports playtime but no timestamp, the user has played ETS2, but exact last session is hidden.
  if (ownedEts2 && typeof ownedEts2.playtime_forever === 'number' && ownedEts2.playtime_forever > 0) {
    return {
      lastPlayedUnix: null,
      note: 'Game details are private or no recent play sessions found.',
    };
  }

  // If ETS2 appears in recent list without timestamp, still provide a clearer reason.
  if (recentEts2) {
    return {
      lastPlayedUnix: null,
      note: 'ETS2 owned but no recent play sessions found.',
    };
  }

  return {
    lastPlayedUnix: null,
    note: 'ETS2 not found in this Steam account.',
  };
  } catch (error) {
    console.error('Steam API error:', error);
    return {
      lastPlayedUnix: null,
      note: `Steam API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export function hasSteamApiKey(): boolean {
  return Boolean(steamApiKey());
}

/** Resolve user input (ID64, profile URL, or vanity) to SteamID64; returns null if not resolvable without API or API missing. */
export async function normalizeSteamInputToId64(raw: string): Promise<string | null> {
  const direct = parseSteamId64(raw);
  if (direct) return direct;
  return resolveVanityToSteamId64(raw);
}
