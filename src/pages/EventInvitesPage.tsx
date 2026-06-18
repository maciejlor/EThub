import { useState, useEffect, useMemo } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, PlusIcon, MailIcon } from 'lucide-react';
import { getEventInvites, addEventInvite, updateEventInviteStatus, removeEventInvite, subscribeEventInviteChanges, type EventInviteEntry } from '@/lib/driver-storage';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function EventInvitesPage() {
  const [invites, setInvites] = useState<EventInviteEntry[]>(getEventInvites());
  const [selectedYear, setSelectedYear] = useState(Math.max(2027, new Date().getFullYear()).toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newInvite, setNewInvite] = useState({
    convoyName: MONTHS[new Date().getMonth()],
    year: Math.max(2027, new Date().getFullYear()).toString(),
    vtcName: '',
    status: 'pending' as 'pending' | 'accepted' | 'declined' | 'maybe',
    addedBy: 'Current User'
  });

  // Generate years starting from 2027
  const years = useMemo(() => {
    const startYear = 2027;
    const currentYear = new Date().getFullYear();
    const endYear = Math.max(startYear + 3, currentYear + 3);
    const length = endYear - startYear + 1;
    return Array.from({ length }, (_, i) => (startYear + i).toString());
  }, []);

  // Filter invites by selected year and month
  const filteredInvites = useMemo(() => {
    return invites.filter(invite => {
      if (!invite.inviteDate) return false;
      const parts = invite.inviteDate.split('-');
      if (parts.length < 2) return false;
      const inviteYear = parts[0];
      const inviteMonth = parseInt(parts[1], 10) - 1;
      return inviteYear === selectedYear && inviteMonth === selectedMonth;
    });
  }, [invites, selectedYear, selectedMonth]);

  // Get count of invites per month for selected year
  const monthlyCounts = useMemo(() => {
    return MONTHS.map((_, monthIndex) => {
      return invites.filter(invite => {
        if (!invite.inviteDate) return false;
        const parts = invite.inviteDate.split('-');
        if (parts.length < 2) return false;
        const inviteYear = parts[0];
        const inviteMonth = parseInt(parts[1], 10) - 1;
        return inviteYear === selectedYear && inviteMonth === monthIndex;
      }).length;
    });
  }, [invites, selectedYear]);

  // Load invites and subscribe to changes
  useEffect(() => {
    const unsubscribe = subscribeEventInviteChanges(() => {
      const refreshedInvites = getEventInvites();
      console.log('Refreshed invites:', refreshedInvites);
      setInvites(refreshedInvites);
    });

    return unsubscribe;
  }, []);

  const handleAddInvite = () => {
    console.log('Form data:', newInvite);
    
    if (!newInvite.convoyName || !newInvite.vtcName) {
      console.log('Validation failed - missing fields');
      return;
    }

    const monthIndex = MONTHS.indexOf(newInvite.convoyName);
    const dateStr = `${newInvite.year}-${String(monthIndex + 1).padStart(2, '0')}-02`;

    console.log('Adding invite with date:', dateStr);
    const result = addEventInvite({
      convoyName: newInvite.convoyName,
      vtcName: newInvite.vtcName,
      status: newInvite.status,
      inviteDate: dateStr,
      addedBy: newInvite.addedBy
    });
    
    console.log('Add result:', result);

    setNewInvite({
      convoyName: MONTHS[new Date().getMonth()],
      year: Math.max(2027, new Date().getFullYear()).toString(),
      vtcName: '',
      status: 'pending',
      addedBy: 'Current User'
    });
    setIsAddDialogOpen(false);
  };

  const getStatusColor = (status: EventInviteEntry['status']) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'declined':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'maybe':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main>
          <Page>
            <div className='flex flex-col gap-4 lg:flex-row lg:justify-between mb-8'>
              <div>
                <h1 className='text-xl font-semibold lg:text-2xl text-foreground'>Event Invites</h1>
                <p className='text-sm text-muted-foreground'>Manage invites from other VTCs organized by year and month.</p>
              </div>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className='bg-primary text-primary-foreground hover:bg-primary/90'>
                    <PlusIcon className='mr-2 h-4 w-4' />
                    Add Invite
                  </Button>
                </DialogTrigger>
                <DialogContent className='bg-card border-border'>
                  <DialogHeader>
                    <DialogTitle className='text-foreground'>Add New Event Invite</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label htmlFor='convoyName' className='text-sm font-medium text-foreground block mb-2'>Month</label>
                        <Select value={newInvite.convoyName} onValueChange={(value) => setNewInvite(prev => ({ ...prev, convoyName: value }))}>
                          <SelectTrigger className='bg-background border-border'>
                            <SelectValue placeholder='Select month' />
                          </SelectTrigger>
                          <SelectContent className='bg-card border-border'>
                            {MONTHS.map(month => (
                              <SelectItem key={month} value={month} className='text-foreground hover:bg-accent'>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label htmlFor='inviteYear' className='text-sm font-medium text-foreground block mb-2'>Year</label>
                        <Select value={newInvite.year} onValueChange={(value) => setNewInvite(prev => ({ ...prev, year: value }))}>
                          <SelectTrigger className='bg-background border-border'>
                            <SelectValue placeholder='Select year' />
                          </SelectTrigger>
                          <SelectContent className='bg-card border-border'>
                            {years.map(year => (
                              <SelectItem key={year} value={year} className='text-foreground hover:bg-accent'>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor='vtcName' className='text-sm font-medium text-foreground block mb-2'>VTC Name</label>
                      <Input
                        id='vtcName'
                        value={newInvite.vtcName}
                        onChange={(e) => setNewInvite(prev => ({ ...prev, vtcName: e.target.value }))}
                        placeholder='Enter VTC name'
                        className='bg-background border-border'
                      />
                    </div>
                    <div>
                      <label htmlFor='status' className='text-sm font-medium text-foreground block mb-2'>Status</label>
                      <Select value={newInvite.status} onValueChange={(value: EventInviteEntry['status']) => setNewInvite(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger className='bg-background border-border'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='bg-card border-border'>
                          <SelectItem value='pending' className='text-foreground hover:bg-accent'>Pending</SelectItem>
                          <SelectItem value='accepted' className='text-foreground hover:bg-accent'>Accepted</SelectItem>
                          <SelectItem value='declined' className='text-foreground hover:bg-accent'>Declined</SelectItem>
                          <SelectItem value='maybe' className='text-foreground hover:bg-accent'>Maybe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddInvite} className='w-full bg-primary text-primary-foreground hover:bg-primary/90'>
                      Add Invite
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className='space-y-6'>
              {/* Year and Month Navigation */}
              <div className='space-y-4'>
                {/* Year Selector */}
                <div className='flex items-center space-x-4'>
                  <span className='text-foreground font-medium'>Year:</span>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className='w-32 bg-background border-border'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-card border-border'>
                      {years.map(year => (
                        <SelectItem key={year} value={year} className='text-foreground hover:bg-accent'>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Month Tabs */}
                <div className='flex flex-wrap gap-2'>
                  {MONTHS.map((month, index) => (
                    <Button
                      key={month}
                      variant={selectedMonth === index ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setSelectedMonth(index)}
                      className={
                        selectedMonth === index 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-background border-border text-foreground hover:bg-accent'
                      }
                    >
                      {month} ({monthlyCounts[index]})
                    </Button>
                  ))}
                </div>
              </div>

              {/* Event Display Area */}
              <div className='min-h-96'>
                {filteredInvites.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-16 text-center'>
                    <CalendarIcon className='h-16 w-16 text-muted-foreground mb-4' />
                    <h3 className='text-xl font-semibold text-foreground mb-2'>
                      No invites found
                    </h3>
                    <p className='text-muted-foreground'>
                      Total invites in storage: {invites.length}
                    </p>
                    <p className='text-muted-foreground'>Click "Add Invite" to create your first event invite</p>
                  </div>
                ) : (
                  <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {filteredInvites.map(invite => (
                      <Card key={invite.id} className='bg-card border-border'>
                        <CardHeader className='pb-3'>
                          <div className='flex items-center justify-between'>
                            <CardTitle className='text-lg text-foreground'>{invite.convoyName}</CardTitle>
                            <Badge className={getStatusColor(invite.status)}>
                              {invite.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                          <div className='flex items-center text-sm text-muted-foreground'>
                            <MailIcon className='mr-2 h-4 w-4' />
                            {invite.vtcName}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Invited: {new Date(invite.inviteDate).toLocaleDateString()}
                          </div>
                          <div className='flex space-x-2 pt-2'>
                            <Select 
                              value={invite.status} 
                              onValueChange={(value: EventInviteEntry['status']) => 
                                updateEventInviteStatus(invite.id, value)
                              }
                            >
                              <SelectTrigger className='flex-1 bg-background border-border'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className='bg-card border-border'>
                                <SelectItem value='pending' className='text-foreground hover:bg-accent'>Pending</SelectItem>
                                <SelectItem value='accepted' className='text-foreground hover:bg-accent'>Accepted</SelectItem>
                                <SelectItem value='declined' className='text-foreground hover:bg-accent'>Declined</SelectItem>
                                <SelectItem value='maybe' className='text-foreground hover:bg-accent'>Maybe</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant='destructive'
                              size='sm'
                              onClick={() => removeEventInvite(invite.id)}
                              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                            >
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
