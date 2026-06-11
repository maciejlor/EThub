import { useState, useCallback, useEffect } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusIcon, Trash2Icon, ExternalLinkIcon, UserIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, ImageIcon, LoaderIcon } from 'lucide-react';
import { APP_SIDEBAR } from '@/constants';

type Member = { username: string; steamId: string };
type Convoy = {
  id: string; month: number; year: number;
  name: string; tmpLink: string;
  tmpBanner?: string; tmpDate?: string;
  evidence?: string;
  /** Username of staff who created the attendance log entry. */
  loggedBy?: string;
  convoyControl: Member[]; drivers: Member[];
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CUR_YEAR = new Date().getFullYear();
const EMPTY_MEMBER: Member = { username: '', steamId: '' };

function extractTmpEventId(url: string): string | null {
  const m = url.match(/truckersmp\.com\/events\/(\d+)/);
  return m ? m[1] : null;
}

async function fetchTmpEvent(eventId: string) {
  try {
    // Use the correct TruckersMP API proxy: /api/truckersmp → https://api.truckersmp.com/v2
    const res = await fetch(`/api/truckersmp/events/${eventId}`);
    console.log(`[TMP] fetchTmpEvent(${eventId}) status:`, res.status);
    if (!res.ok) return null;
    const data = await res.json();
    console.log('[TMP] fetchTmpEvent response:', data);
    if (data.error) return null;
    const r = data.response;
    // TruckersMP API returns dates as "YYYY-MM-DD HH:MM:SS" (no timezone)
    // Convert to ISO format so browsers parse it as UTC
    let rawDate = r.start_at ?? '';
    if (rawDate && !rawDate.includes('T') && rawDate.includes(' ')) {
      rawDate = rawDate.replace(' ', 'T') + 'Z';
    }
    return { name: r.name ?? '', banner: r.banner ?? '', date: rawDate };
  } catch (e) {
    console.error('[TMP] fetchTmpEvent error:', e);
    return null;
  }
}

function MemberRow({ member, onChange, onRemove, canRemove }: {
  member: Member; onChange: (m: Member) => void; onRemove: () => void; canRemove: boolean;
}) {
  return (
    <div className='flex gap-2 items-center'>
      <Input placeholder='Username' value={member.username} onChange={e => onChange({ ...member, username: e.target.value })} className='h-8 text-sm' />
      <Input placeholder='TMP Profile ID' value={member.steamId} onChange={e => onChange({ ...member, steamId: e.target.value })} className='h-8 text-sm' />
      {canRemove && <Button variant='ghost' size='icon' className='size-8 shrink-0 text-destructive hover:text-destructive' onClick={onRemove}><Trash2Icon size={14} /></Button>}
    </div>
  );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────
function ConvoyDetailDialog({ convoy, open, onClose }: { convoy: Convoy | null; open: boolean; onClose: () => void }) {
  if (!convoy) return null;
  const allAttendees = [
    ...convoy.convoyControl.map(m => ({ ...m, role: 'CC' as const })),
    ...convoy.drivers.map(m => ({ ...m, role: 'Driver' as const })),
  ];
  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className='sm:max-w-xl max-h-[90vh] overflow-y-auto p-0'>
        {convoy.tmpBanner ? (
          <img src={convoy.tmpBanner} alt={convoy.name} className='w-full h-48 object-cover rounded-t-xl' />
        ) : (
          <div className='w-full h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-t-xl flex items-center justify-center'>
            <ImageIcon className='size-10 text-muted-foreground/30' />
          </div>
        )}
        <div className='p-6 space-y-5'>
          <div>
            <h2 className='text-xl font-black tracking-tight'>{convoy.name}</h2>
            <p className='text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1'>{MONTHS[convoy.month]} {convoy.year}</p>
            {convoy.tmpDate && <p className='text-xs text-muted-foreground mt-0.5'>📅 {new Date(convoy.tmpDate).toLocaleString()}</p>}
            {convoy.loggedBy && (
              <p className='text-xs text-muted-foreground mt-2'>
                <span className='font-semibold text-foreground/80'>Logged by</span> {convoy.loggedBy}
              </p>
            )}
          </div>
          {convoy.tmpLink && (
            <a href={convoy.tmpLink} target='_blank' rel='noopener noreferrer'
              className='inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold'>
              <ExternalLinkIcon size={12} /> View TMP Event
            </a>
          )}
          {convoy.evidence && (
            <div>
              <p className='text-xs font-black uppercase tracking-widest text-muted-foreground mb-2'>Evidence</p>
              <img src={convoy.evidence} alt='Attendance evidence' className='w-full rounded-xl border object-cover max-h-64' onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
          <div>
            <p className='text-xs font-black uppercase tracking-widest text-muted-foreground mb-3'>Attendance ({allAttendees.length})</p>
            {convoy.convoyControl.length > 0 && (
              <div className='mb-3'>
                <p className='text-[10px] font-bold text-yellow-600 uppercase tracking-wider mb-1.5'>Convoy Control</p>
                <div className='space-y-1.5'>
                  {convoy.convoyControl.map((m, i) => (
                    <div key={i} className='flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-1.5'>
                      <UserIcon size={12} className='text-yellow-600 shrink-0' />
                      <span className='font-semibold text-sm flex-1'>{m.username}</span>
                      {m.steamId && <span className='text-[10px] text-muted-foreground font-mono'>{m.steamId}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {convoy.drivers.length > 0 && (
              <div>
                <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5'>Drivers</p>
                <div className='space-y-1.5'>
                  {convoy.drivers.map((m, i) => (
                    <div key={i} className='flex items-center gap-2 bg-muted/30 border rounded-lg px-3 py-1.5'>
                      <UserIcon size={12} className='text-muted-foreground shrink-0' />
                      <span className='font-semibold text-sm flex-1'>{m.username}</span>
                      {m.steamId && <span className='text-[10px] text-muted-foreground font-mono'>{m.steamId}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {allAttendees.length === 0 && <p className='text-xs text-muted-foreground'>No attendees recorded.</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create/Edit Dialog ───────────────────────────────────────────────────────
function ConvoyDialog({ open, onClose, onSave, year, initial }: {
  open: boolean; onClose: () => void; onSave: (c: Convoy) => void; year: number; initial?: Convoy | null;
}) {
  const isEdit = !!initial;
  const [stage, setStage] = useState<1 | 2>(1);
  const [month, setMonth] = useState(initial ? String(initial.month) : '');
  const [tmpLink, setTmpLink] = useState(initial?.tmpLink ?? '');
  const [tmpLoading, setTmpLoading] = useState(false);
  const [tmpName, setTmpName] = useState(initial?.name ?? '');
  const [tmpBanner, setTmpBanner] = useState(initial?.tmpBanner ?? '');
  const [tmpDate, setTmpDate] = useState(initial?.tmpDate ?? '');
  const [evidence, setEvidence] = useState(initial?.evidence ?? '');
  const [cc, setCc] = useState<Member[]>(
    initial?.convoyControl.length 
      ? initial.convoyControl.map(m => ({ ...m })) 
      : [{ ...EMPTY_MEMBER }]
  );
  const [drivers, setDrivers] = useState<Member[]>(
    initial?.drivers.length 
      ? initial.drivers.map(m => ({ ...m })) 
      : [{ ...EMPTY_MEMBER }]
  );

  // Auto-fetch TMP event when link changes
  useEffect(() => {
    const id = extractTmpEventId(tmpLink);
    if (!id) return;
    
    // Check if we already have this data (e.g. from initial)
    if (initial && tmpLink === initial.tmpLink && tmpName === initial.name) return;

    let active = true;
    const load = async () => {
      setTmpLoading(true);
      try {
        const data = await fetchTmpEvent(id);
        if (active && data) {
          setTmpName(data.name);
          setTmpBanner(data.banner);
          setTmpDate(data.date);
        }
      } finally {
        if (active) setTmpLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [tmpLink, initial, tmpName]);

  const handleSave = () => {
    onSave({
      id: initial?.id ?? Date.now().toString(),
      month: parseInt(month, 10), year: initial?.year ?? year,
      name: tmpName, tmpLink, tmpBanner, tmpDate, evidence,
      convoyControl: cc.filter(m => m.username.trim()),
      drivers: drivers.filter(m => m.username.trim()),
    });
    onClose();
  };

  const updateMember = (list: Member[], setList: (m: Member[]) => void, idx: number, val: Member) => { const n = [...list]; n[idx] = val; setList(n); };
  const addMember = (list: Member[], setList: (m: Member[]) => void) => setList([...list, { ...EMPTY_MEMBER }]);
  const removeMember = (list: Member[], setList: (m: Member[]) => void, idx: number) => setList(list.filter((_, i) => i !== idx));

  const stage1Valid = month !== '' && tmpLink.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-base font-bold tracking-tight'>
            {isEdit ? 'Edit Convoy' : 'Create Convoy'} — {stage === 1 ? 'Details' : 'Attendance'}
          </DialogTitle>
        </DialogHeader>
        <div className='flex items-center gap-2 mb-4'>
          {[1,2].map(s => <div key={s} onClick={() => (s === 1 || stage1Valid) && setStage(s as 1|2)} className={`h-1 flex-1 rounded-full transition-colors cursor-pointer ${stage >= s ? 'bg-primary' : 'bg-muted'}`} />)}
        </div>

        {stage === 1 && (
          <div className='space-y-4'>
            <div>
              <label className='text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block'>Month</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className='h-9'><SelectValue placeholder='Select month…' /></SelectTrigger>
                <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className='text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block'>TMP Event Link</label>
              <div className='relative'>
                <Input placeholder='https://truckersmp.com/events/...' value={tmpLink} onChange={e => setTmpLink(e.target.value)} className='h-9 pr-8' />
                {tmpLoading && <LoaderIcon size={14} className='absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground' />}
              </div>
            </div>
            {tmpName && (
              <div className='rounded-xl border bg-muted/20 p-3 space-y-2'>
                {tmpBanner && <img src={tmpBanner} alt={tmpName} className='w-full h-24 object-cover rounded-lg' />}
                <div>
                  <p className='font-bold text-sm'>{tmpName}</p>
                  {tmpDate && <p className='text-[11px] text-muted-foreground'>📅 {new Date(tmpDate).toLocaleString()}</p>}
                </div>
              </div>
            )}
            {!tmpName && !tmpLoading && tmpLink && !extractTmpEventId(tmpLink) && (
              <p className='text-xs text-destructive'>Could not detect a TMP event ID from that link.</p>
            )}
          </div>
        )}

        {stage === 2 && (
          <div className='space-y-5 max-h-[55vh] overflow-y-auto pr-1'>
            {!isEdit ? (
              <p className='text-xs text-muted-foreground rounded-lg border bg-muted/20 px-3 py-2'>
                <span className='font-bold text-foreground'>Who logs this:</span>{' '}
                {APP_SIDEBAR.curProfile.name}
              </p>
            ) : (
              initial?.loggedBy && (
                <p className='text-xs text-muted-foreground rounded-lg border bg-muted/20 px-3 py-2'>
                  <span className='font-bold text-foreground'>Logged by:</span> {initial.loggedBy}
                </p>
              )
            )}
            <div>
              <label className='text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block'>Evidence (Image URL)</label>
              <Input placeholder='https://i.imgur.com/...' value={evidence} onChange={e => setEvidence(e.target.value)} className='h-8 text-sm' />
              {evidence && <img src={evidence} alt='Evidence preview' className='mt-2 w-full h-28 object-cover rounded-lg border' onError={e => (e.currentTarget.style.display = 'none')} />}
            </div>
            {[{label: 'Convoy Control', list: cc, setList: setCc}, {label: 'Drivers', list: drivers, setList: setDrivers}].map(({ label, list, setList }) => (
              <div key={label}>
                <div className='flex items-center justify-between mb-2'>
                  <label className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>{label}</label>
                  <Button variant='ghost' size='sm' className='h-6 text-xs gap-1' onClick={() => addMember(list, setList)}><PlusIcon size={12} /> More</Button>
                </div>
                <div className='space-y-2'>
                  {list.map((m, i) => <MemberRow key={i} member={m} onChange={v => updateMember(list, setList, i, v)} onRemove={() => removeMember(list, setList, i)} canRemove={list.length > 1} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className='flex justify-between pt-2'>
          {stage === 2 ? <Button variant='outline' size='sm' onClick={() => setStage(1)}>Back</Button> : <div />}
          {stage === 1
            ? <Button size='sm' disabled={!stage1Valid} onClick={() => setStage(2)}>Next →</Button>
            : <Button size='sm' onClick={handleSave}>{isEdit ? 'Save Changes' : 'Save Convoy'}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Convoy Card ──────────────────────────────────────────────────────────────
function ConvoyCard({ convoy, onDelete, onEdit, onClick }: { convoy: Convoy; onDelete: () => void; onEdit: () => void; onClick: () => void }) {
  const total = convoy.convoyControl.length + convoy.drivers.length;
  return (
    <div className='bg-card border rounded-2xl overflow-hidden shadow-sm flex flex-col cursor-pointer group hover:border-primary/40 transition-colors' onClick={onClick}>
      {convoy.tmpBanner ? (
        <img src={convoy.tmpBanner} alt={convoy.name} className='w-full h-28 object-cover group-hover:opacity-90 transition-opacity' />
      ) : (
        <div className='h-28 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center'>
          <ImageIcon className='size-8 text-muted-foreground/30' />
        </div>
      )}
      <div className='p-4 flex flex-col gap-2 flex-1 relative'>
        <div className='absolute top-3 right-3 flex gap-1' onClick={e => e.stopPropagation()}>
          <Button variant='ghost' size='icon' className='size-7 text-muted-foreground hover:text-foreground' onClick={onEdit}><PencilIcon size={11} /></Button>
          <Button variant='ghost' size='icon' className='size-7 text-destructive/60 hover:text-destructive' onClick={onDelete}><Trash2Icon size={11} /></Button>
        </div>
        <div className='pr-16'>
          <h3 className='font-black text-sm leading-tight truncate'>{convoy.name || 'Unnamed Convoy'}</h3>
          <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>{MONTHS[convoy.month]} {convoy.year}</p>
        </div>
        {convoy.tmpDate && <p className='text-[11px] text-muted-foreground'>📅 {new Date(convoy.tmpDate).toLocaleDateString()}</p>}
        {convoy.loggedBy && (
          <p className='text-[10px] text-muted-foreground truncate' title={convoy.loggedBy}>
            <span className='font-semibold text-foreground/70'>Logged by</span> {convoy.loggedBy}
          </p>
        )}
        <div className='flex items-center justify-between mt-auto pt-2 border-t border-muted/30'>
          <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest'>
            {total} Attendee{total !== 1 ? 's' : ''}
          </span>
          {convoy.tmpLink && (
            <a href={convoy.tmpLink} target='_blank' rel='noopener noreferrer' onClick={e => e.stopPropagation()}
              className='flex items-center gap-1 text-[10px] text-primary hover:underline font-bold'>
              <ExternalLinkIcon size={10} /> TMP
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ConvoyAttendancePage() {
  const [convoys, setConvoys] = useState<Convoy[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Convoy | null>(null);
  const [detailTarget, setDetailTarget] = useState<Convoy | null>(null);
  const [year, setYear] = useState(CUR_YEAR);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());

  const openCreate = () => { setEditTarget(null); setDialogOpen(true); };
  const openEdit = useCallback((c: Convoy) => { setEditTarget(c); setDialogOpen(true); }, []);
  const closeDialog = () => { setDialogOpen(false); setEditTarget(null); };

  const handleSave = useCallback((c: Convoy) => {
    setConvoys(prev => {
      const exists = prev.find((x) => x.id === c.id);
      const merged: Convoy = {
        ...c,
        loggedBy: exists?.loggedBy ?? APP_SIDEBAR.curProfile.name,
      };
      return exists ? prev.map((x) => (x.id === c.id ? merged : x)) : [...prev, merged];
    });
  }, []);

  const deleteConvoy = useCallback((id: string) => setConvoys(prev => prev.filter(c => c.id !== id)), []);

  const convoysByMonth = SHORT_MONTHS.reduce<Record<number, Convoy[]>>((acc, _, i) => {
    acc[i] = convoys.filter(c => c.year === year && c.month === i);
    return acc;
  }, {});

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='flex flex-col h-screen overflow-hidden'>
        <Header />
        <main className='flex-1 overflow-hidden flex flex-col'>
          <div className='px-4 pt-8 pb-4 md:px-8'>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <h2 className='text-lg font-semibold'>Convoy Attendance</h2>
                <p className='text-sm text-muted-foreground'>Manage and track convoy attendance by month.</p>
              </div>
              <Button size='sm' onClick={openCreate} className='gap-1.5'><PlusIcon size={14} /> Create Convoy</Button>
            </div>
            <div className='flex items-center gap-2 mb-4'>
              <Button variant='ghost' size='icon' className='size-7' onClick={() => setYear(y => y - 1)}><ChevronLeftIcon size={14} /></Button>
              <span className='font-black text-base w-12 text-center'>{year}</span>
              <Button variant='ghost' size='icon' className='size-7' onClick={() => setYear(y => y + 1)}><ChevronRightIcon size={14} /></Button>
            </div>
            <div className='flex gap-1 flex-wrap'>
              {SHORT_MONTHS.map((m, i) => {
                const count = convoysByMonth[i].length;
                return (
                  <button key={i} onClick={() => setActiveMonth(i)}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${activeMonth === i ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                    {m}
                    {count > 0 && <span className={`ml-1.5 text-[9px] font-black px-1 py-0.5 rounded-full ${activeMonth === i ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary'}`}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className='flex-1 overflow-y-auto px-4 md:px-8 pb-8'>
            <div className='mb-4'>
              <h3 className='text-sm font-bold text-muted-foreground uppercase tracking-widest'>{SHORT_MONTHS[activeMonth]} {year}</h3>
            </div>
            {convoysByMonth[activeMonth].length === 0 ? (
              <div className='flex flex-col items-center justify-center min-h-[30vh] border border-dashed rounded-2xl text-center'>
                <p className='text-muted-foreground text-sm mb-3'>No convoys for {MONTHS[activeMonth]} {year}.</p>
                <Button variant='outline' size='sm' onClick={openCreate} className='gap-1.5'><PlusIcon size={14} /> Create one</Button>
              </div>
            ) : (
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {convoysByMonth[activeMonth].map(c => (
                  <ConvoyCard key={c.id} convoy={c}
                    onDelete={() => deleteConvoy(c.id)}
                    onEdit={() => openEdit(c)}
                    onClick={() => setDetailTarget(c)} />
                ))}
              </div>
            )}
          </div>
        </main>

        {dialogOpen && <ConvoyDialog open={dialogOpen} onClose={closeDialog} onSave={handleSave} year={year} initial={editTarget} />}
        <ConvoyDetailDialog convoy={detailTarget} open={!!detailTarget} onClose={() => setDetailTarget(null)} />
      </SidebarInset>
    </SidebarProvider>
  );
}
