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
  addLeftDriver,
  getLeftDrivers,
  removeLeftDriver,
  subscribeLeftDriverChanges,
  type LeftDriverEntry,
} from '@/lib/driver-storage';
import { APP_SIDEBAR } from '@/constants';
import { LoaderIcon, TrashIcon, UserMinusIcon, ListIcon, CalendarIcon } from 'lucide-react';

/** Match dashboard-ish row accent — distinct from blacklist red */
const rowClass =
  'bg-gradient-to-l from-orange-500/10 to-transparent hover:from-orange-500/15 border-r-2 border-r-orange-500/50 transition-colors';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];


function getYearMonthCounts(drivers: LeftDriverEntry[]) {
  const counts: Record<string, Record<string, number>> = {};
  
  drivers.forEach(driver => {
    const date = new Date(driver.leftDate);
    const year = date.getFullYear().toString();
    const month = months[date.getMonth()];
    
    if (!counts[year]) counts[year] = {};
    if (!counts[year][month]) counts[year][month] = 0;
    counts[year][month]++;
  });
  
  return counts;
}

function filterDriversByYearMonth(drivers: LeftDriverEntry[], year: string, month: string) {
  return drivers.filter(driver => {
    const date = new Date(driver.leftDate);
    const driverYear = date.getFullYear().toString();
    const driverMonth = months[date.getMonth()];
    return driverYear === year && driverMonth === month;
  });
}

export function LeftDriversPage() {
  const [driverName, setDriverName] = useState('');
  const [reasonForLeaving, setReasonForLeaving] = useState('');
  const [leftDate, setLeftDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<LeftDriverEntry[]>(getLeftDrivers());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(months[new Date().getMonth()]);

  const refreshList = () => setList(getLeftDrivers());

  useEffect(() => {
    return subscribeLeftDriverChanges(refreshList);
  }, []);

  const yearMonthCounts = getYearMonthCounts(list);
  const availableYears = Object.keys(yearMonthCounts).sort((a, b) => parseInt(b) - parseInt(a));
  const availableMonths = yearMonthCounts[selectedYear] ? Object.keys(yearMonthCounts[selectedYear]) : [];
  const filteredList = filterDriversByYearMonth(list, selectedYear, selectedMonth);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    const name = driverName.trim();
    const reason = reasonForLeaving.trim();
    const date = leftDate.trim();
    
    if (!name) {
      setError('Please enter a driver name.');
      return;
    }
    if (!reason) {
      setError('Please enter a reason for leaving.');
      return;
    }
    if (!date) {
      setError('Please enter a left date.');
      return;
    }

    setSaving(true);
    try {
      addLeftDriver({
        driverName: name,
        reasonForLeaving: reason,
        leftDate: date,
        loggedBy: APP_SIDEBAR.curProfile.name,
      });

      setDriverName('');
      setReasonForLeaving('');
      setLeftDate('');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save left driver.');
    } finally {
      setSaving(false);
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
              <h1 className='text-xl font-semibold lg:text-2xl'>Left Drivers</h1>
              <p className='text-sm text-muted-foreground'>
                Manage drivers who have left the company. Track their reason for leaving and departure date.
              </p>
            </div>

            <div className='mt-8 grid gap-8 lg:grid-cols-2 lg:items-start'>
              <form
                onSubmit={handleSubmit}
                className='rounded-2xl border bg-background p-6 shadow-sm space-y-5 h-fit'
              >
                <h2 className='text-lg font-semibold flex items-center gap-2'>
                  <UserMinusIcon className='size-5 text-orange-500' />
                  Record left driver
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
                    Left driver saved. List updates on all open tabs using this browser.
                  </div>
                )}

                <div className='space-y-2'>
                  <label htmlFor='left-name' className='text-sm font-medium'>
                    Driver Name
                  </label>
                  <Input
                    id='left-name'
                    placeholder='Driver name'
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    autoComplete='off'
                  />
                </div>
                <div className='space-y-2'>
                  <label htmlFor='left-reason' className='text-sm font-medium'>
                    Reason for Leaving
                  </label>
                  <Input
                    id='left-reason'
                    placeholder='Reason for leaving'
                    value={reasonForLeaving}
                    onChange={(e) => setReasonForLeaving(e.target.value)}
                    autoComplete='off'
                  />
                </div>
                <div className='space-y-2'>
                  <label htmlFor='left-date' className='text-sm font-medium'>
                    Left Date
                  </label>
                  <Input
                    id='left-date'
                    type='date'
                    value={leftDate}
                    onChange={(e) => setLeftDate(e.target.value)}
                  />
                </div>

                <Button type='submit' disabled={saving} className='gap-2'>
                  {saving && <LoaderIcon className='size-4 animate-spin' />}
                  {saving ? 'Saving…' : 'Add left driver'}
                </Button>
              </form>

              <div className='rounded-2xl border bg-background shadow-sm overflow-hidden'>
                <div className='p-6 border-b border-muted/15'>
                  <h2 className='text-lg font-semibold flex items-center gap-2'>
                    <ListIcon className='size-5 text-muted-foreground' />
                    Left Drivers ({list.length})
                  </h2>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Stored in this browser. Navigate by year and month to view specific periods.
                  </p>
                </div>

                {list.length === 0 ? (
                  <div className='px-6 py-16 text-center text-sm text-muted-foreground'>
                    No left drivers yet. Use the form to add drivers who have left the company.
                  </div>
                ) : (
                  <>
                    {/* Year/Month Navigation */}
                    <div className='p-4 border-b border-muted/15'>
                      <div className='flex items-center gap-2 mb-3'>
                        <CalendarIcon className='size-4 text-muted-foreground' />
                        <span className='text-sm font-medium'>Navigate by Period</span>
                      </div>
                      
                      {/* Years */}
                      <div className='flex flex-wrap gap-2 mb-3'>
                        {availableYears.length > 0 ? (
                          availableYears.map(year => (
                            <Button
                              key={year}
                              variant={selectedYear === year ? 'default' : 'outline'}
                              size='sm'
                              onClick={() => {
                                setSelectedYear(year);
                                setSelectedMonth(Object.keys(yearMonthCounts[year])[0] || '');
                              }}
                              className='text-xs'
                            >
                              {year}
                            </Button>
                          ))
                        ) : (
                          <span className='text-xs text-muted-foreground'>No data available</span>
                        )}
                      </div>
                      
                      {/* Months */}
                      {availableMonths.length > 0 && (
                        <div className='flex flex-wrap gap-2'>
                          {availableMonths.map(month => (
                            <Button
                              key={month}
                              variant={selectedMonth === month ? 'default' : 'outline'}
                              size='sm'
                              onClick={() => setSelectedMonth(month)}
                              className='text-xs'
                            >
                              {month} ({yearMonthCounts[selectedYear][month]})
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Table */}
                    <div className='overflow-x-auto'>
                      <Table>
                        <TableHeader>
                          <TableRow className='hover:bg-transparent border-b-muted/10'>
                            <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap min-w-[140px]'>
                              DRIVER NAME
                            </TableHead>
                            <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap min-w-[160px]'>
                              REASON FOR LEAVING
                            </TableHead>
                            <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap min-w-[120px]'>
                              LEFT DATE
                            </TableHead>
                            <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap min-w-[120px]'>
                              LOGGED BY
                            </TableHead>
                            <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap text-right'>
                              ACTIONS
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredList.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className='py-8 text-center text-sm text-muted-foreground'>
                                No drivers found for {selectedMonth} {selectedYear}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredList.map((row) => (
                              <TableRow key={row.id} className={`cursor-default ${rowClass}`}>
                                <TableCell className='py-4 align-top font-semibold text-sm max-w-[160px]'>
                                  <span className='break-words'>{row.driverName}</span>
                                </TableCell>
                                <TableCell className='py-4 align-top text-sm max-w-[180px]'>
                                  <span className='break-words'>{row.reasonForLeaving}</span>
                                </TableCell>
                                <TableCell className='py-4 align-top text-sm whitespace-nowrap'>
                                  {new Date(row.leftDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell className='py-4 align-top text-sm whitespace-nowrap'>{row.loggedBy}</TableCell>
                                <TableCell className='py-4 align-top text-right'>
                                  <div className='flex justify-end gap-1'>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='icon'
                                      className='h-8 w-8 text-muted-foreground hover:text-destructive'
                                      aria-label='Remove left driver entry'
                                      onClick={() => removeLeftDriver(row.id)}
                                    >
                                      <TrashIcon className='size-4' />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
