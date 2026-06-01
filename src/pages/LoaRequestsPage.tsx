import { useLanguage } from '@/components/LanguageProvider';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoaRequestCard } from '@/components/LoaRequestCard';
import { APP_SIDEBAR } from '@/constants';
import {
  addLoaRequest,
  getLoaRequests,
  subscribeLoaChanges,
  type LoaRequest,
} from '@/lib/loa-storage';
import { CalendarIcon, SendIcon, HistoryIcon } from 'lucide-react';

function formatDay(isoOrYmd: string) {
  const d = new Date(isoOrYmd.includes('T') ? isoOrYmd : `${isoOrYmd}T12:00:00`);
  return Number.isNaN(d.getTime()) ? isoOrYmd : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function LoaRequestsPage() {
  const { t } = useLanguage();
  const profileName = APP_SIDEBAR.curProfile.name;
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [list, setList] = useState<LoaRequest[]>(getLoaRequests());

  const refresh = () => setList(getLoaRequests());

  useEffect(() => {
    return subscribeLoaChanges(refresh);
  }, []);

  const myHistory = useMemo(
    () => list.filter((r) => r.requesterName === profileName),
    [list, profileName]
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!startDate || !endDate || !reason.trim()) {
      setError(t('Please fill in start date, end date, and a reason.'));
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError(t('End date must be on or after the start date.'));
      return;
    }
    addLoaRequest({
      requesterName: profileName,
      startDate,
      endDate,
      reason: reason.trim(),
    });
    setStartDate('');
    setEndDate('');
    setReason('');
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
              <h1 className='text-xl font-semibold lg:text-2xl'>{t('LOA requests')}</h1>
              <p className='text-sm text-muted-foreground'>
                {t('Submit a leave of absence. HR reviews it on')}{' '}
                <Link to='/hr/loa-management' className='font-medium text-primary underline-offset-4 hover:underline'>
                  {t('LOA Management')}
                </Link>
                .
              </p>
            </div>

            <div className='mt-8 grid gap-8 lg:grid-cols-2 lg:items-start'>
              <form
                onSubmit={handleSubmit}
                className='rounded-2xl border bg-background p-6 shadow-sm space-y-5'
              >
                <h2 className='text-lg font-semibold flex items-center gap-2'>
                  <CalendarIcon className='size-5 text-primary' />
                  {t('New request')}
                </h2>

                {error && (
                  <div role='alert' className='rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                    {error}
                  </div>
                )}
                {success && (
                  <div className='rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-foreground'>
                    {t('Request sent to LOA Management for approval.')}
                  </div>
                )}

                <div className='space-y-2'>
                  <label htmlFor='loa-start' className='text-sm font-medium'>
                    {t('Date of start')}
                  </label>
                  <Input
                    id='loa-start'
                    type='date'
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <label htmlFor='loa-end' className='text-sm font-medium'>
                    {t('Date of end')}
                  </label>
                  <Input
                    id='loa-end'
                    type='date'
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <label htmlFor='loa-reason' className='text-sm font-medium'>
                    {t('Reasons')}
                  </label>
                  <Textarea
                    id='loa-reason'
                    placeholder={t('Explain why you need leave…')}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={5}
                    required
                  />
                </div>

                <Button type='submit' className='w-full sm:w-auto'>
                  <SendIcon className='size-4' />
                  {t('Submit to LOA Management')}
                </Button>
              </form>

              <div className='rounded-2xl border bg-background p-6 shadow-sm'>
                <h2 className='text-lg font-semibold flex items-center gap-2 mb-4'>
                  <HistoryIcon className='size-5 text-primary' />
                  {t('Your LOA history')}
                </h2>
                {myHistory.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>{t('No requests yet.')}</p>
                ) : (
                  <ul className='space-y-4'>
                    {myHistory.map((r) => (
                      <li key={r.id}>
                         <LoaRequestCard
                          status={r.status}
                          headerTitle={`${formatDay(r.startDate)} → ${formatDay(r.endDate)}`}
                          footer={
                            <p className='text-[11px] text-muted-foreground'>
                              {t('Submitted')} {new Date(r.submittedAt).toLocaleString()}
                              {r.reviewedAt && ` · ${t('Reviewed')} ${new Date(r.reviewedAt).toLocaleString()}`}
                            </p>
                          }
                        >
                          <p className='text-muted-foreground whitespace-pre-wrap'>{r.reason}</p>
                        </LoaRequestCard>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
