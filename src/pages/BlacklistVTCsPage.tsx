import { useState, useEffect } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShieldXIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { getBlacklistVtcs, addBlacklistVtc, removeBlacklistVtc, subscribeBlacklistVtcChanges, type BlacklistVtcEntry } from '@/lib/driver-storage';

export function BlacklistVTCsPage() {
  const [blacklistVtcs, setBlacklistVtcs] = useState<BlacklistVtcEntry[]>(getBlacklistVtcs());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newVtc, setNewVtc] = useState({
    vtcName: '',
    reason: '',
    blacklistedDate: new Date().toISOString().split('T')[0],
    addedBy: 'Current User'
  });

  // Load blacklist VTCs and subscribe to changes
  useEffect(() => {
    const unsubscribe = subscribeBlacklistVtcChanges(() => {
      setBlacklistVtcs(getBlacklistVtcs());
    });

    return unsubscribe;
  }, []);

  const handleAddVtc = () => {
    if (!newVtc.vtcName || !newVtc.reason) {
      return;
    }

    addBlacklistVtc({
      vtcName: newVtc.vtcName,
      reason: newVtc.reason,
      blacklistedDate: newVtc.blacklistedDate,
      addedBy: newVtc.addedBy
    });

    setNewVtc({
      vtcName: '',
      reason: '',
      blacklistedDate: new Date().toISOString().split('T')[0],
      addedBy: 'Current User'
    });
    setIsAddDialogOpen(false);
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
                <h1 className='text-xl font-semibold lg:text-2xl text-foreground'>Blacklist VTCs</h1>
                <p className='text-sm text-muted-foreground'>Manage blacklisted VTCs from events.</p>
              </div>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className='bg-primary text-primary-foreground hover:bg-primary/90'>
                    <PlusIcon className='mr-2 h-4 w-4' />
                    Add VTC to Blacklist
                  </Button>
                </DialogTrigger>
                <DialogContent className='bg-card border-border'>
                  <DialogHeader>
                    <DialogTitle className='text-foreground'>Add VTC to Blacklist</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div>
                      <label htmlFor='vtcName' className='text-sm font-medium text-foreground block mb-2'>VTC Name</label>
                      <Input
                        id='vtcName'
                        value={newVtc.vtcName}
                        onChange={(e) => setNewVtc(prev => ({ ...prev, vtcName: e.target.value }))}
                        placeholder='Enter VTC name or "TMP VTC"'
                        className='bg-background border-border'
                      />
                    </div>
                    <div>
                      <label htmlFor='reason' className='text-sm font-medium text-foreground block mb-2'>Reason</label>
                      <Input
                        id='reason'
                        value={newVtc.reason}
                        onChange={(e) => setNewVtc(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder='Enter blacklist reason'
                        className='bg-background border-border'
                      />
                    </div>
                    <div>
                      <label htmlFor='blacklistedDate' className='text-sm font-medium text-foreground block mb-2'>Blacklisted Date</label>
                      <Input
                        id='blacklistedDate'
                        type='date'
                        value={newVtc.blacklistedDate}
                        onChange={(e) => setNewVtc(prev => ({ ...prev, blacklistedDate: e.target.value }))}
                        className='bg-background border-border'
                      />
                    </div>
                    <Button onClick={handleAddVtc} className='w-full bg-primary text-primary-foreground hover:bg-primary/90'>
                      Add to Blacklist
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Blacklist Display Area */}
            <div className='min-h-96'>
              {blacklistVtcs.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 text-center'>
                  <ShieldXIcon className='h-16 w-16 text-muted-foreground mb-4' />
                  <h3 className='text-xl font-semibold text-foreground mb-2'>
                    No blacklisted VTCs
                  </h3>
                  <p className='text-muted-foreground'>Blacklisted VTCs will appear here</p>
                </div>
              ) : (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {blacklistVtcs.map(vtc => (
                    <Card key={vtc.id} className='bg-card border-border'>
                      <CardHeader className='pb-3'>
                        <div className='flex items-center justify-between'>
                          <CardTitle className='text-lg text-foreground'>{vtc.vtcName}</CardTitle>
                          <div className='flex items-center space-x-2'>
                            <div className='h-3 w-3 rounded-full bg-red-500' />
                            <span className='text-xs text-muted-foreground'>Blacklisted</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <div className='text-sm text-muted-foreground'>
                          <strong>Reason:</strong> {vtc.reason}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          <strong>Blacklisted:</strong> {new Date(vtc.blacklistedDate).toLocaleDateString()}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          <strong>Added by:</strong> {vtc.addedBy}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          <strong>Added:</strong> {new Date(vtc.addedAt).toLocaleDateString()}
                        </div>
                        <div className='flex space-x-2 pt-2'>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => removeBlacklistVtc(vtc.id)}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                          >
                            <TrashIcon className='mr-2 h-4 w-4' />
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
