import { useEffect, useState, type FormEvent } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  addManagedDriver,
  getManagedDrivers,
  removeManagedDriver,
  updateManagedDriver,
  subscribeManagedDriverChanges,
  type ManagedDriverEntry,
} from '@/lib/driver-storage';
import {
  fetchEts2LastPlayedUnix,
  hasSteamApiKey,
  normalizeSteamInputToId64,
  parseSteamId64,
} from '@/lib/steam-ets2';
import { APP_SIDEBAR } from '@/constants';
import { LoaderIcon, RefreshCwIcon, TrashIcon, UserPlusIcon, ListIcon } from 'lucide-react';

/** Match dashboard-ish row accent — distinct from blacklist red */
const rowClass =
  'bg-gradient-to-l from-primary/10 to-transparent hover:from-primary/15 border-r-2 border-r-primary transition-colors';

function mutedOrDash(text: string, mono?: boolean) {
  return (
    <span className={[mono ? 'font-mono text-[11px]' : '', 'text-muted-foreground/80'].filter(Boolean).join(' ')}>
      {text || '—'}
    </span>
  );
}

function formatEts2LastPlayed(entry: ManagedDriverEntry) {
  if (entry.ets2LastPlayedUnix != null && entry.ets2LastPlayedUnix > 0) {
    return new Date(entry.ets2LastPlayedUnix * 1000).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
  return null;
}

export function DriverManagePage() {
  const [username, setUsername] = useState('');
  const [discordUserId, setDiscordUserId] = useState('');
  const [steamId, setSteamId] = useState('');
  const [truckersmpUserId, setTruckersmpUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<ManagedDriverEntry[]>([]);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const steamReady = hasSteamApiKey();

  const refreshList = () => setList(getManagedDrivers());

  useEffect(() => {
    refreshList();
    return subscribeManagedDriverChanges(refreshList);
  }, []);

  async function resolveSteamMeta(steamRaw: string) {
    const trimmed = steamRaw.trim();
    if (!trimmed) {
      return {
        steamId64: null as string | null,
        ets2LastPlayedUnix: null as number | null,
        ets2Note: null as string | null,
      };
    }
    let steamId64 = parseSteamId64(trimmed);
    if (!steamId64 && steamReady) {
      steamId64 = await normalizeSteamInputToId64(trimmed);
    }
    if (!steamId64 || !steamReady) {
      return {
        steamId64,
        ets2LastPlayedUnix: null,
        ets2Note: !steamReady
          ? 'Set VITE_STEAM_WEB_API_KEY to query last ETS2 session via Steam.'
          : 'Could not resolve Steam ID — use 7656119… numeric ID or Steam community vanity / profile URL with API key.',
      };
    }
    try {
      const { lastPlayedUnix, note } = await fetchEts2LastPlayedUnix(steamId64);
      return { steamId64, ets2LastPlayedUnix: lastPlayedUnix, ets2Note: note ?? null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Steam lookup failed';
      return { steamId64, ets2LastPlayedUnix: null, ets2Note: msg };
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const u = username.trim();
    if (!u) {
      setError('Please enter a username.');
      return;
    }

    setSaving(true);
    try {
      const { steamId64, ets2LastPlayedUnix, ets2Note } = await resolveSteamMeta(steamId);

      addManagedDriver({
        loggedBy: APP_SIDEBAR.curProfile.name,
        username: u,
        discordUserId: discordUserId.trim(),
        steamId: steamId.trim(),
        steamId64,
        truckersmpUserId: truckersmpUserId.trim(),
        ets2LastPlayedUnix,
        ets2FetchedAt: steamId.trim() && steamReady ? new Date().toISOString() : null,
        ets2Note,
      });

      setUsername('');
      setDiscordUserId('');
      setSteamId('');
      setTruckersmpUserId('');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save driver.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRefreshSteam(row: ManagedDriverEntry) {
    if (!steamReady) return;
    setRefreshingId(row.id);
    try {
      const sid64 =
        row.steamId64 ?? parseSteamId64(row.steamId) ?? (await normalizeSteamInputToId64(row.steamId));
      if (!sid64) {
        updateManagedDriver(row.id, {
          ets2FetchedAt: new Date().toISOString(),
          ets2Note: 'Could not resolve Steam ID.',
        });
        return;
      }
      const { lastPlayedUnix, note } = await fetchEts2LastPlayedUnix(sid64);
      updateManagedDriver(row.id, {
        steamId64: sid64,
        ets2LastPlayedUnix: lastPlayedUnix,
        ets2FetchedAt: new Date().toISOString(),
        ets2Note: note ?? null,
      });
    } catch (e) {
      updateManagedDriver(row.id, {
        ets2FetchedAt: new Date().toISOString(),
        ets2Note: e instanceof Error ? e.message : 'Steam request failed.',
      });
    } finally {
      setRefreshingId(null);
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main>
          <Page>
            <div className='flex flex-col gap-1'>
              <h1 className='text-xl font-semibold lg:text-2xl'>Driver manage</h1>
              <p className='text-sm text-muted-foreground'>
                When a candidate is accepted, record their identifiers here. Optionally connect Steam to approximate the
                last time they played{' '}
                <span className='font-medium text-foreground'>Euro Truck Simulator 2</span> via the Steam Web API.
              </p>
            </div>

            {!steamReady && (
              <div
                className='mt-6 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground'
                role='status'
              >
                <span className='font-semibold text-foreground'>Steam ETS2 lookup is off:</span> add{' '}
                <code className='text-xs font-mono rounded bg-muted px-1'>VITE_STEAM_WEB_API_KEY</code> to{' '}
                <code className='text-xs font-mono rounded bg-muted px-1'>.env</code> (get a key from the{' '}
                <a
                  href='https://steamcommunity.com/dev/apikey'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary underline-offset-4 hover:underline font-medium'
                >
                  Steam Web API page
                </a>
                ) and restart dev. Deployments must proxy{' '}
                <code className='text-xs font-mono rounded bg-muted px-1'>/steam-api</code>
                like local Vite.
              </div>
            )}

            <div className='mt-8 grid gap-8 lg:grid-cols-2 lg:items-start'>
              <form
                onSubmit={handleSubmit}
                className='rounded-2xl border bg-background p-6 shadow-sm space-y-5 h-fit'
              >
                <h2 className='text-lg font-semibold flex items-center gap-2'>
                  <UserPlusIcon className='size-5 text-primary' />
                  New driver
                </h2>

                <p className='text-xs text-muted-foreground rounded-lg border bg-muted/20 px-3 py-2'>
                  <span className='font-bold text-foreground'>Added by:</span> {APP_SIDEBAR.curProfile.name}
                </p>

                {error && (
                  <div
                    role='alert'
                    className='rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'
                  >
                    {error}
                  </div>
                )}
                {success && (
                  <div className='rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-foreground'>
                    Driver saved. List updates on all open tabs using this browser.
                  </div>
                )}

                <div className='space-y-2'>
                  <label htmlFor='drv-user' className='text-sm font-medium'>
                    Username
                  </label>
                  <Input
                    id='drv-user'
                    placeholder='In-game / community username'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete='off'
                  />
                </div>
                <div className='space-y-2'>
                  <label htmlFor='drv-dc' className='text-sm font-medium'>
                    Discord user ID
                  </label>
                  <Input
                    id='drv-dc'
                    placeholder='Discord snowflake ID'
                    value={discordUserId}
                    onChange={(e) => setDiscordUserId(e.target.value)}
                    autoComplete='off'
                  />
                </div>
                <div className='space-y-2'>
                  <label htmlFor='drv-steam' className='text-sm font-medium'>
                    Steam ID
                  </label>
                  <Input
                    id='drv-steam'
                    placeholder='SteamID64 or profile URL (vanity resolves if API key is set)'
                    value={steamId}
                    onChange={(e) => setSteamId(e.target.value)}
                    autoComplete='off'
                  />
                </div>
                <div className='space-y-2'>
                  <label htmlFor='drv-tmp' className='text-sm font-medium'>
                    TruckersMP user ID
                  </label>
                  <Input
                    id='drv-tmp'
                    placeholder='TMP numeric user ID'
                    value={truckersmpUserId}
                    onChange={(e) => setTruckersmpUserId(e.target.value)}
                    autoComplete='off'
                  />
                </div>

                <Button type='submit' disabled={saving} className='gap-2'>
                  {saving && <LoaderIcon className='size-4 animate-spin' />}
                  {saving ? 'Saving…' : 'Add driver'}
                </Button>
              </form>

              <div className='rounded-2xl border bg-background shadow-sm overflow-hidden'>
                <div className='p-6 border-b border-muted/15'>
                  <h2 className='text-lg font-semibold flex items-center gap-2'>
                    <ListIcon className='size-5 text-muted-foreground' />
                    Drivers ({list.length})
                  </h2>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Stored in this browser. <strong>Steam Privacy:</strong> Game details are only visible if the player has{' '}
                    <span className='font-medium text-foreground'>public game activity</span> in their Steam privacy settings. 
                    Private profiles will show "Game details are private" instead of play time.
                  </p>
                </div>

                {list.length === 0 ? (
                  <div className='px-6 py-16 text-center text-sm text-muted-foreground'>
                    No drivers yet. Accept an applicant on HR Applications, then add them with the form.
                  </div>
                ) : (
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow className='hover:bg-transparent border-b-muted/10'>
                          <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap min-w-[110px]'>
                            Username
                          </TableHead>
                          <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap'>
                            Discord
                          </TableHead>
                          <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap min-w-[140px]'>
                            Steam
                          </TableHead>
                          <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap'>
                            TMP ID
                          </TableHead>
                          <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap min-w-[140px]'>
                            ETS2 last played*
                          </TableHead>
                          <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap min-w-[110px]'>
                            Added by
                          </TableHead>
                          <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap text-right'>
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list.map((row) => {
                          const etsShown = formatEts2LastPlayed(row);
                          return (
                            <TableRow key={row.id} className={`cursor-default ${rowClass}`}>
                              <TableCell className='py-4 align-top font-semibold text-sm max-w-[160px]'>
                                <span className='break-words'>{row.username}</span>
                              </TableCell>
                              <TableCell className='py-4 align-top text-xs'>
                                {mutedOrDash(row.discordUserId, true)}
                              </TableCell>
                              <TableCell className='py-4 align-top text-xs max-w-[180px]' title={row.steamId}>
                                {row.steamId64 ? (
                                  <a
                                    href={`https://steamcommunity.com/profiles/${row.steamId64}`}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-primary hover:underline underline-offset-4 font-mono text-[11px] block truncate'
                                    title={`Open Steam profile: ${row.steamId64}`}
                                  >
                                    {row.steamId64}
                                  </a>
                                ) : row.steamId ? (
                                  <a
                                    href={row.steamId.startsWith('http') ? row.steamId : `https://steamcommunity.com/id/${row.steamId.replace(/[^a-zA-Z0-9_-]/g, '')}`}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-primary hover:underline underline-offset-4 font-mono text-[11px] block truncate'
                                    title={`Open Steam profile: ${row.steamId}`}
                                  >
                                    {row.steamId}
                                  </a>
                                ) : (
                                  mutedOrDash('', true)
                                )}
                              </TableCell>
                              <TableCell className='py-4 align-top text-xs'>{mutedOrDash(row.truckersmpUserId, true)}</TableCell>
                              <TableCell className='py-4 align-top text-xs max-w-[220px]'>
                                {etsShown ? (
                                  <span className='text-foreground/90 font-medium'>{etsShown}</span>
                                ) : row.ets2Note ? (
                                  <span
                                    className={`text-[11px] leading-snug block ${
                                      row.ets2Note.toLowerCase().includes('currently playing')
                                        ? 'text-green-600 dark:text-green-400 font-semibold'
                                        : 'text-muted-foreground/80'
                                    }`}
                                  >
                                    {row.ets2Note}
                                  </span>
                                ) : (
                                  <span className='text-muted-foreground/90 block'>—</span>
                                )}
                              </TableCell>
                              <TableCell className='py-4 align-top text-xs whitespace-nowrap'>{row.loggedBy}</TableCell>
                              <TableCell className='py-4 align-top text-right'>
                                <div className='flex justify-end gap-1'>
                                  <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    className='h-8 px-2 text-xs gap-1'
                                    disabled={!steamReady || refreshingId === row.id}
                                    title='Refresh Steam ETS2 last played'
                                    onClick={() => handleRefreshSteam(row)}
                                  >
                                    {refreshingId === row.id ? (
                                      <LoaderIcon className='size-3 animate-spin shrink-0' />
                                    ) : (
                                      <RefreshCwIcon className='size-3 shrink-0' />
                                    )}
                                    Steam
                                  </Button>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    className='h-8 w-8 text-muted-foreground hover:text-destructive'
                                    aria-label='Remove driver entry'
                                    onClick={() => removeManagedDriver(row.id)}
                                  >
                                    <TrashIcon className='size-4' />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
