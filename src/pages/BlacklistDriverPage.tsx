import { useEffect, useState, type FormEvent } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  addBlacklistDriverEntry,
  getBlacklistDriverEntries,
  removeBlacklistDriverEntry,
  subscribeBlacklistDriverChanges,
  type BlacklistDriverEntry,
} from '@/lib/blacklist-storage';
import { ListIcon, TrashIcon, UserXIcon } from 'lucide-react';

/** Same visual language as dashboard job rows — red accent fits blacklist semantics. */
const rowClass =
  'bg-gradient-to-l from-red-500/10 to-transparent hover:from-red-500/20 border-r-2 border-r-red-500 transition-colors';

function mutedOrDash(text: string, className?: string) {
  return (
    <span className={className ?? 'text-muted-foreground/80 tabular-nums'}>{text || '—'}</span>
  );
}

export function BlacklistDriverPage() {
  const [username, setUsername] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [truckersmpUserId, setTruckersmpUserId] = useState('');
  const [steamId, setSteamId] = useState('');
  const [reasons, setReasons] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [list, setList] = useState<BlacklistDriverEntry[]>(getBlacklistDrivers());

  const refresh = () => setList(getBlacklistDriverEntries());

  useEffect(() => {
    return subscribeBlacklistDriverChanges(refresh);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const u = username.trim();
    const dc = discordId.trim();
    const tmp = truckersmpUserId.trim();
    const steam = steamId.trim();
    const rsn = reasons.trim();
    if (!u) {
      setError('Please enter a username.');
      return;
    }
    if (!rsn) {
      setError('Please enter the reasons.');
      return;
    }
    addBlacklistDriverEntry({
      username: u,
      discordId: dc,
      truckersmpUserId: tmp,
      steamId: steam,
      reasons: rsn,
    });
    setUsername('');
    setDiscordId('');
    setTruckersmpUserId('');
    setSteamId('');
    setReasons('');
    setSuccess(true);
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main>
          <Page>
            <div className='flex flex-col gap-1'>
              <h1 className='text-xl font-semibold lg:text-2xl'>Blacklist driver</h1>
              <p className='text-sm text-muted-foreground'>
                Record banned drivers with identifiers so staff can recognise them consistently.
              </p>
            </div>

            <div className='mt-8 grid gap-8 lg:grid-cols-2 lg:items-start'>
              <form
                onSubmit={handleSubmit}
                className='rounded-2xl border bg-background p-6 shadow-sm space-y-5 h-fit'
              >
                <h2 className='text-lg font-semibold flex items-center gap-2'>
                  <UserXIcon className='size-5 text-destructive' />
                  Add to blacklist
                </h2>

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
                    Entry saved to this device&apos;s blacklist.
                  </div>
                )}

                <div className='space-y-2'>
                  <label htmlFor='blk-username' className='text-sm font-medium'>
                    Username
                  </label>
                  <Input
                    id='blk-username'
                    placeholder='Known in-game / community name'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete='off'
                  />
                </div>
                <div className='space-y-2'>
                  <label htmlFor='blk-discord' className='text-sm font-medium'>
                    Discord ID
                  </label>
                  <Input
                    id='blk-discord'
                    placeholder='e.g. 123456789012345678'
                    value={discordId}
                    onChange={(e) => setDiscordId(e.target.value)}
                    autoComplete='off'
                  />
                </div>
                <div className='space-y-2'>
                  <label htmlFor='blk-truckersmp' className='text-sm font-medium'>
                    TruckersMP User ID
                  </label>
                  <Input
                    id='blk-truckersmp'
                    placeholder='Numeric TMP profile ID'
                    value={truckersmpUserId}
                    onChange={(e) => setTruckersmpUserId(e.target.value)}
                    autoComplete='off'
                  />
                </div>
                <div className='space-y-2'>
                  <label htmlFor='blk-steam' className='text-sm font-medium'>
                    Steam ID
                  </label>
                  <Input
                    id='blk-steam'
                    placeholder='Steam64 / profile identifier'
                    value={steamId}
                    onChange={(e) => setSteamId(e.target.value)}
                    autoComplete='off'
                  />
                </div>
                <div className='space-y-2'>
                  <label htmlFor='blk-reasons' className='text-sm font-medium'>
                    Reasons
                  </label>
                  <Textarea
                    id='blk-reasons'
                    placeholder='Why this driver is blacklisted…'
                    value={reasons}
                    onChange={(e) => setReasons(e.target.value)}
                    rows={5}
                  />
                </div>

                <Button type='submit'>Add blacklist entry</Button>
              </form>

              <div className='rounded-2xl border bg-background shadow-sm overflow-hidden'>
                <div className='p-6 border-b border-muted/15'>
                  <h2 className='text-lg font-semibold flex items-center gap-2'>
                    <ListIcon className='size-5 text-muted-foreground' />
                    Blacklist ({list.length})
                  </h2>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Stored in this browser (localStorage). Clearing site data removes the list.
                  </p>
                </div>

                {list.length === 0 ? (
                  <div className='px-6 py-12 text-center text-sm text-muted-foreground'>No entries yet.</div>
                ) : (
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow className='hover:bg-transparent border-b-muted/10'>
                          <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap min-w-[140px]'>
                            Username
                          </TableHead>
                          <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap'>
                            Discord ID
                          </TableHead>
                          <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap'>
                            TMP User ID
                          </TableHead>
                          <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap'>
                            Steam ID
                          </TableHead>
                          <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 min-w-[200px]'>
                            Reasons
                          </TableHead>
                          <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap text-right w-[100px]'>
                            Added
                          </TableHead>
                          <TableHead className='w-12 px-2' aria-label='Remove' />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list.map((row) => (
                          <TableRow key={row.id} className={`cursor-default ${rowClass}`}>
                            <TableCell className='py-4 align-top font-semibold text-foreground/90 max-w-[180px]'>
                              <span className='break-words'>{row.username}</span>
                            </TableCell>
                            <TableCell className='py-4 align-top text-xs'>{mutedOrDash(row.discordId)}</TableCell>
                            <TableCell className='py-4 align-top text-xs'>{mutedOrDash(row.truckersmpUserId)}</TableCell>
                            <TableCell className='py-4 align-top text-xs max-w-[140px]'>
                              {mutedOrDash(row.steamId, 'break-all text-muted-foreground/80')}
                            </TableCell>
                            <TableCell className='py-4 align-top text-xs text-muted-foreground max-w-[280px]'>
                              <span className='break-words whitespace-pre-wrap'>{row.reasons}</span>
                            </TableCell>
                            <TableCell className='py-4 align-top text-[11px] text-muted-foreground text-right whitespace-nowrap'>
                              {new Date(row.addedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </TableCell>
                            <TableCell className='py-4 align-top text-right'>
                              <Button
                                type='button'
                                size='sm'
                                variant='ghost'
                                className='h-8 w-8 p-0 text-muted-foreground hover:text-destructive'
                                aria-label='Remove blacklist entry'
                                onClick={() => removeBlacklistDriverEntry(row.id)}
                              >
                                <TrashIcon className='size-4' />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
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
