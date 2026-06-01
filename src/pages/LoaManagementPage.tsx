import { useLanguage } from '@/components/LanguageProvider';
import { useEffect, useMemo, useState } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { LoaRequestCard } from '@/components/LoaRequestCard';
import {
  getLoaRequests,
  setLoaRequestStatus,
  subscribeLoaChanges,
  type LoaRequest,
} from '@/lib/loa-storage';
import { CheckIcon, XIcon, ClipboardListIcon } from 'lucide-react';

function formatDay(isoOrYmd: string) {
  const d = new Date(isoOrYmd.includes('T') ? isoOrYmd : `${isoOrYmd}T12:00:00`);
  return Number.isNaN(d.getTime()) ? isoOrYmd : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function LoaManagementPage() {
  const { t } = useLanguage();
  const [list, setList] = useState<LoaRequest[]>(getLoaRequests());

  const refresh = () => setList(getLoaRequests());

  useEffect(() => {
    return subscribeLoaChanges(refresh);
  }, []);

  const pending = useMemo(() => list.filter((r) => r.status === 'pending'), [list]);
  const processed = useMemo(() => list.filter((r) => r.status !== 'pending'), [list]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main>
          <Page>
            <div className='flex flex-col gap-1'>
              <h1 className='text-xl font-semibold lg:text-2xl'>{t('LOA management')}</h1>
              <p className='text-sm text-muted-foreground'>
                {t('Approve or reject driver leave requests. New submissions appear here from')}{' '}
                <span className='font-medium text-foreground'>{t('LOA Requests')}</span>.
              </p>
            </div>

            <div className='mt-8 space-y-10'>
              <section className='rounded-2xl border bg-background p-6 shadow-sm'>
                <h2 className='text-lg font-semibold flex items-center gap-2 mb-4'>
                  <ClipboardListIcon className='size-5 text-amber-600' />
                  {t('Pending ({count})', { count: pending.length })}
                </h2>
                {pending.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>{t('No pending requests.')}</p>
                ) : (
                  <ul className='grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
                    {pending.map((r) => (
                      <li key={r.id}>
                        <LoaRequestCard
                          status='pending'
                          headerTitle={r.requesterName}
                          footer={
                            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                              <p className='text-[11px] text-muted-foreground order-2 sm:order-1'>
                                {t('Submitted')} {new Date(r.submittedAt).toLocaleString()}
                              </p>
                              <div className='flex shrink-0 gap-2 order-1 sm:order-2 justify-end'>
                                <Button
                                  size='sm'
                                  className='gap-1'
                                  onClick={() => {
                                    setLoaRequestStatus(r.id, 'approved');
                                  }}
                                >
                                  <CheckIcon className='size-4' />
                                  {t('Accept')}
                                </Button>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  className='gap-1 border-destructive/40 text-destructive hover:bg-destructive/10'
                                  onClick={() => {
                                    setLoaRequestStatus(r.id, 'rejected');
                                  }}
                                >
                                  <XIcon className='size-4' />
                                  {t('Reject')}
                                </Button>
                              </div>
                            </div>
                          }
                        >
                          <p>
                            <span className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wide'>
                              {t('Dates')}
                            </span>
                            <span className='block font-semibold'>
                              {formatDay(r.startDate)} → {formatDay(r.endDate)}
                            </span>
                          </p>
                          <p className='text-muted-foreground whitespace-pre-wrap pt-1'>{r.reason}</p>
                        </LoaRequestCard>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className='rounded-2xl border bg-background p-6 shadow-sm'>
                <h2 className='text-lg font-semibold mb-4'>{t('History')}</h2>
                {processed.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>{t('No approved or rejected requests yet.')}</p>
                ) : (
                  <ul className='grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
                    {processed.map((r) => (
                      <li key={r.id}>
                        <LoaRequestCard
                          status={r.status}
                          headerTitle={r.requesterName}
                          footer={
                            <p className='text-[11px] text-muted-foreground'>
                              {t('Submitted')} {new Date(r.submittedAt).toLocaleString()}
                              {r.reviewedAt && ` · ${t('Decided')} ${new Date(r.reviewedAt).toLocaleString()}`}
                            </p>
                          }
                        >
                          <p className='text-muted-foreground'>
                            {formatDay(r.startDate)} → {formatDay(r.endDate)}
                          </p>
                          <p className='text-muted-foreground whitespace-pre-wrap pt-1'>{r.reason}</p>
                        </LoaRequestCard>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
