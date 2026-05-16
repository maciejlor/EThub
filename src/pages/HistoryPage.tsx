import { useState, useEffect, useMemo } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { HistoryIcon, FilterIcon, SearchIcon, UserIcon, CalendarIcon, ActivityIcon } from 'lucide-react';
import { getHistory, subscribeHistoryChanges, type HistoryEntry } from '@/lib/driver-storage';

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  updated: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  deleted: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
  added: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  removed: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
  changed: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  accepted: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  declined: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
  pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
};

const ENTITY_COLORS: Record<string, string> = {
  driver: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  event_invite: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  blacklist_driver: 'bg-red-500/20 text-red-700 dark:text-red-400',
  blacklist_vtc: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
  blacklist_staff: 'bg-pink-500/20 text-pink-700 dark:text-pink-400',
  user: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
  role: 'bg-teal-500/20 text-teal-700 dark:text-teal-400',
};

const DEPARTMENT_COLORS: Record<string, string> = {
  HR: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  Event: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  Admin: 'bg-red-500/20 text-red-700 dark:text-red-400',
  System: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
};

export function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    setHistory(getHistory());
    
    const unsubscribe = subscribeHistoryChanges(() => {
      setHistory(getHistory());
    });

    return unsubscribe;
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter(entry => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        entry.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.performedBy.toLowerCase().includes(searchTerm.toLowerCase());

      // Action filter
      const matchesAction = actionFilter === 'all' || entry.action === actionFilter;

      // Entity filter
      const matchesEntity = entityFilter === 'all' || entry.entityType === entityFilter;

      // Department filter
      const matchesDepartment = departmentFilter === 'all' || entry.department === departmentFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const entryDate = new Date(entry.performedAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'today':
            matchesDate = daysDiff === 0;
            break;
          case 'week':
            matchesDate = daysDiff <= 7;
            break;
          case 'month':
            matchesDate = daysDiff <= 30;
            break;
          case 'year':
            matchesDate = daysDiff <= 365;
            break;
        }
      }

      return matchesSearch && matchesAction && matchesEntity && matchesDepartment && matchesDate;
    });
  }, [history, searchTerm, actionFilter, entityFilter, departmentFilter, dateFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setEntityFilter('all');
    setDepartmentFilter('all');
    setDateFilter('all');
  };

  const formatChanges = (changes?: Record<string, { old: string | number; new: string | number }>) => {
    if (!changes || Object.keys(changes).length === 0) return null;
    
    return (
      <div className='mt-2 space-y-1'>
        {Object.entries(changes).map(([key, change]) => (
          <div key={key} className='text-xs text-muted-foreground'>
            <span className='font-medium'>{key}:</span> {change.old} → {change.new}
          </div>
        ))}
      </div>
    );
  };

  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='bg-background'>
        <Header />
        <main className='bg-background'>
          <Page>
            <div className='flex flex-col gap-4 lg:flex-row lg:justify-between mb-8'>
              <div>
                <h1 className='text-xl font-semibold lg:text-2xl text-foreground'>System History</h1>
                <p className='text-sm text-muted-foreground'>Track all changes and activities across the system.</p>
              </div>
            </div>

            {/* Filters */}
            <Card className='bg-card border-border mb-6'>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <FilterIcon className='h-5 w-5' />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-6'>
                  <div>
                    <label className='text-sm font-medium text-foreground block mb-2'>Search</label>
                    <div className='relative'>
                      <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                      <Input
                        placeholder='Search history...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='pl-10 bg-background border-border'
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className='text-sm font-medium text-foreground block mb-2'>Action</label>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger className='bg-background border-border'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-card border-border'>
                        <SelectItem value='all'>All Actions</SelectItem>
                        <SelectItem value='created'>Created</SelectItem>
                        <SelectItem value='updated'>Updated</SelectItem>
                        <SelectItem value='deleted'>Deleted</SelectItem>
                        <SelectItem value='added'>Added</SelectItem>
                        <SelectItem value='removed'>Removed</SelectItem>
                        <SelectItem value='changed'>Changed</SelectItem>
                        <SelectItem value='accepted'>Accepted</SelectItem>
                        <SelectItem value='declined'>Declined</SelectItem>
                        <SelectItem value='pending'>Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-foreground block mb-2'>Entity Type</label>
                    <Select value={entityFilter} onValueChange={setEntityFilter}>
                      <SelectTrigger className='bg-background border-border'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-card border-border'>
                        <SelectItem value='all'>All Entities</SelectItem>
                        <SelectItem value='driver'>Driver</SelectItem>
                        <SelectItem value='event_invite'>Event Invite</SelectItem>
                        <SelectItem value='blacklist_driver'>Blacklist Driver</SelectItem>
                        <SelectItem value='blacklist_vtc'>Blacklist VTC</SelectItem>
                        <SelectItem value='blacklist_staff'>Blacklist Staff</SelectItem>
                        <SelectItem value='user'>User</SelectItem>
                        <SelectItem value='role'>Role</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-foreground block mb-2'>Department</label>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className='bg-background border-border'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-card border-border'>
                        <SelectItem value='all'>All Departments</SelectItem>
                        <SelectItem value='HR'>HR</SelectItem>
                        <SelectItem value='Event'>Event</SelectItem>
                        <SelectItem value='Admin'>Admin</SelectItem>
                        <SelectItem value='System'>System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-foreground block mb-2'>Date Range</label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className='bg-background border-border'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-card border-border'>
                        <SelectItem value='all'>All Time</SelectItem>
                        <SelectItem value='today'>Today</SelectItem>
                        <SelectItem value='week'>Last Week</SelectItem>
                        <SelectItem value='month'>Last Month</SelectItem>
                        <SelectItem value='year'>Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='flex items-end'>
                    <Button onClick={clearFilters} variant='outline' className='w-full bg-background border-border'>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* History Display */}
            <div className='space-y-4'>
              {filteredHistory.length === 0 ? (
                <div className='text-center py-16'>
                  <HistoryIcon className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
                  <h3 className='text-xl font-semibold text-foreground mb-2'>No history found</h3>
                  <p className='text-muted-foreground'>
                    {history.length === 0 ? 'No system activity recorded yet.' : 'No history matches your filters.'}
                  </p>
                </div>
              ) : (
                filteredHistory.map((entry) => (
                  <Card key={entry.id} className='bg-card border-border'>
                    <CardContent className='p-6'>
                      <div className='flex items-start justify-between gap-4'>
                        <div className='flex-1 space-y-3'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <Badge className={ACTION_COLORS[entry.action] || 'bg-gray-500/20 text-gray-700'}>
                              {entry.action}
                            </Badge>
                            <Badge className={ENTITY_COLORS[entry.entityType] || 'bg-gray-500/20 text-gray-700'}>
                              {entry.entityType}
                            </Badge>
                            {entry.department && (
                              <Badge className={DEPARTMENT_COLORS[entry.department] || 'bg-gray-500/20 text-gray-700'}>
                                {entry.department}
                              </Badge>
                            )}
                          </div>
                          
                          <div>
                            <h4 className='font-semibold text-foreground'>{entry.entityName}</h4>
                            <p className='text-sm text-muted-foreground mt-1'>{entry.description}</p>
                            {formatChanges(entry.changes)}
                          </div>

                          <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                            <div className='flex items-center gap-1'>
                              <UserIcon className='h-3 w-3' />
                              <span>{entry.performedBy}</span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <CalendarIcon className='h-3 w-3' />
                              <span>{new Date(entry.performedAt).toLocaleDateString()}</span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <ActivityIcon className='h-3 w-3' />
                              <span>{new Date(entry.performedAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
