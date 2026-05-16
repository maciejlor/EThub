import { useState, useEffect } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldAlertIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { getBlacklistStaff, addBlacklistStaff, removeBlacklistStaff, subscribeBlacklistStaffChanges, type BlacklistStaffEntry } from '@/lib/driver-storage';

const STAFF_ROLES = ['Admin', 'Moderator', 'Event Manager', 'HR Manager', 'Driver Manager', 'Senior Staff', 'HR Staff', 'Event Staff'];

export function BlacklistStaffPage() {
  const [blacklistStaff, setBlacklistStaff] = useState<BlacklistStaffEntry[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    staffName: '',
    role: '',
    reason: '',
    blacklistedDate: new Date().toISOString().split('T')[0],
    addedBy: 'Current User'
  });

  // Load blacklist staff and subscribe to changes
  useEffect(() => {
    setBlacklistStaff(getBlacklistStaff());
    
    const unsubscribe = subscribeBlacklistStaffChanges(() => {
      setBlacklistStaff(getBlacklistStaff());
    });

    return unsubscribe;
  }, []);

  const handleAddStaff = () => {
    if (!newStaff.staffName || !newStaff.role || !newStaff.reason) {
      return;
    }

    addBlacklistStaff({
      staffName: newStaff.staffName,
      role: newStaff.role,
      reason: newStaff.reason,
      blacklistedDate: newStaff.blacklistedDate,
      addedBy: newStaff.addedBy
    });

    setNewStaff({
      staffName: '',
      role: '',
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
                <h1 className='text-xl font-semibold lg:text-2xl text-foreground'>Blacklist Staff</h1>
                <p className='text-sm text-muted-foreground'>Manage blacklisted staff and management.</p>
              </div>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className='bg-primary text-primary-foreground hover:bg-primary/90'>
                    <PlusIcon className='mr-2 h-4 w-4' />
                    Add Staff to Blacklist
                  </Button>
                </DialogTrigger>
                <DialogContent className='bg-card border-border'>
                  <DialogHeader>
                    <DialogTitle className='text-foreground'>Add Staff to Blacklist</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div>
                      <label htmlFor='staffName' className='text-sm font-medium text-foreground block mb-2'>Staff Name</label>
                      <Input
                        id='staffName'
                        value={newStaff.staffName}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, staffName: e.target.value }))}
                        placeholder='Enter staff name'
                        className='bg-background border-border'
                      />
                    </div>
                    <div>
                      <label htmlFor='role' className='text-sm font-medium text-foreground block mb-2'>Role</label>
                      <Select value={newStaff.role} onValueChange={(value) => setNewStaff(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger className='bg-background border-border'>
                          <SelectValue placeholder='Select role' />
                        </SelectTrigger>
                        <SelectContent className='bg-card border-border'>
                          {STAFF_ROLES.map(role => (
                            <SelectItem key={role} value={role} className='text-foreground hover:bg-accent'>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor='reason' className='text-sm font-medium text-foreground block mb-2'>Reason</label>
                      <Input
                        id='reason'
                        value={newStaff.reason}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder='Enter blacklist reason'
                        className='bg-background border-border'
                      />
                    </div>
                    <div>
                      <label htmlFor='blacklistedDate' className='text-sm font-medium text-foreground block mb-2'>Blacklisted Date</label>
                      <Input
                        id='blacklistedDate'
                        type='date'
                        value={newStaff.blacklistedDate}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, blacklistedDate: e.target.value }))}
                        className='bg-background border-border'
                      />
                    </div>
                    <Button onClick={handleAddStaff} className='w-full bg-primary text-primary-foreground hover:bg-primary/90'>
                      Add to Blacklist
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Blacklist Display Area */}
            <div className='min-h-96'>
              {blacklistStaff.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 text-center'>
                  <ShieldAlertIcon className='h-16 w-16 text-muted-foreground mb-4' />
                  <h3 className='text-xl font-semibold text-foreground mb-2'>
                    No blacklisted staff
                  </h3>
                  <p className='text-muted-foreground'>Blacklisted staff members will appear here</p>
                </div>
              ) : (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {blacklistStaff.map(staff => (
                    <Card key={staff.id} className='bg-card border-border'>
                      <CardHeader className='pb-3'>
                        <div className='flex items-center justify-between'>
                          <CardTitle className='text-lg text-foreground'>{staff.staffName}</CardTitle>
                          <div className='flex items-center space-x-2'>
                            <div className='h-3 w-3 rounded-full bg-red-500' />
                            <span className='text-xs text-muted-foreground'>Blacklisted</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <div className='text-sm text-muted-foreground'>
                          <strong>Role:</strong> {staff.role}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          <strong>Reason:</strong> {staff.reason}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          <strong>Blacklisted:</strong> {new Date(staff.blacklistedDate).toLocaleDateString()}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          <strong>Added by:</strong> {staff.addedBy}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          <strong>Added:</strong> {new Date(staff.addedAt).toLocaleDateString()}
                        </div>
                        <div className='flex space-x-2 pt-2'>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => removeBlacklistStaff(staff.id)}
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
