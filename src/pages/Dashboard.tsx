import { useEffect, useState, useMemo } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page, PageHeader } from '@/components/Page';
import { DashboardCard } from '@/components/DashboardCard';
import { AppBarChart } from '@/components/AppBarChart';
import { DashboardTable } from '@/components/DashboardTable';
import { UsersIcon, BriefcaseIcon, MapIcon, CalendarIcon } from 'lucide-react';
import { fetchTruckersmpVtcInfo, fetchUpcomingEvents, type UpcomingEvent } from '@/lib/truckersmp';
import { fetchTruckyVtcInfo, fetchTruckyJobs, fetchTruckyCompletedDeliveryTotals, type TruckyVtcInfo, type TruckyJob } from '@/lib/trucky';
import { APP_SIDEBAR } from '@/constants';
import { 
  getCurrentUser, 
  getUsers, 
  subscribeUsersChanges,
  setCurrentUser,
  updateUser,
  type UserEntry 
} from '@/lib/driver-storage';
import { StatCard } from '@/components/StatCard';
import { UpcomingConvoyCard } from '@/components/UpcomingConvoyCard';
import { useLanguage } from '@/components/LanguageProvider';
import { refreshDiscordUserInfo, isDiscordAuthenticated } from '@/lib/discord-auth';

export function DashboardPage() {
  const { t } = useLanguage();
  const [vtcInfo, setVtcInfo] = useState<{ members_count: number } | null>(null);
  const [truckyInfo, setTruckyInfo] = useState<TruckyVtcInfo | null>(null);
  const [vtcEvents, setVtcEvents] = useState<UpcomingEvent[]>([]);
  const [recentJobs, setRecentJobs] = useState<TruckyJob[]>([]);
  const [completedTotals, setCompletedTotals] = useState({ jobs: 0, distanceKm: 0 });
  const [loading, setLoading] = useState(true);
  // Internal DB member count — live-updated from Firebase sync
  const [dbMemberCount, setDbMemberCount] = useState<number>(
    () => getUsers().filter(u => u.isActive && !u.isPending).length
  );

  const [currentUser, setLocalUser] = useState<UserEntry | null>(() => getCurrentUser());

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setLocalUser(user);

      // Refresh Discord username if authenticated via Discord (works for all users, not just admins)
      if (isDiscordAuthenticated()) {
        refreshDiscordUserInfo().then((discordUser) => {
          if (discordUser && user.discordId === discordUser.id) {
            // Update user entry if Discord username changed
            if (user.discordUsername !== discordUser.username) {
              updateUser(user.id, {
                discordUsername: discordUser.username,
                discordAvatar: discordUser.avatar
                  ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                  : user.discordAvatar,
              });
              // Reload user to get updated data
              const updatedUser = getCurrentUser();
              if (updatedUser) {
                setLocalUser(updatedUser);
              }
            }
          }
        });
      }
    }
  }, []);

  // Keep member count live as Firebase syncs new/updated users
  useEffect(() => {
    const unsub = subscribeUsersChanges(() => {
      setDbMemberCount(getUsers().filter(u => u.isActive && !u.isPending).length);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const results = await Promise.allSettled([
        fetchTruckersmpVtcInfo(74784),
        fetchUpcomingEvents(74784),
        fetchTruckyVtcInfo(44349),
        fetchTruckyJobs(44349, 100),
        fetchTruckyCompletedDeliveryTotals(44349),
      ]);

      if (results[0].status === 'fulfilled') setVtcInfo(results[0].value);
      if (results[1].status === 'fulfilled') setVtcEvents(results[1].value);
      if (results[2].status === 'fulfilled') setTruckyInfo(results[2].value);
      if (results[3].status === 'fulfilled') setRecentJobs(results[3].value);
      if (results[4].status === 'fulfilled') setCompletedTotals(results[4].value);

      setLoading(false);
    };
    loadData();
  }, []);

  // Count upcoming events (future only) from TMP
  const upcomingEventCount = useMemo(() => {
    const now = new Date();
    return vtcEvents.filter((e) => {
      const d = new Date(e.startDate);
      return d && d.getTime() > now.getTime() - 4 * 60 * 60 * 1000;
    }).length;
  }, [vtcEvents]);

  // Primary: TruckersMP only (authoritative VTC member count)
  // Fallback: Trucky VTC members count
  // Fallback 2: internal EThub DB (Firebase-synced, registered users count)
  const totalMembers = useMemo(() => {
    return vtcInfo?.members_count || truckyInfo?.members_count || dbMemberCount || 0;
  }, [dbMemberCount, vtcInfo, truckyInfo]);

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <Header />

        <main>
          <Page>
            <PageHeader name={currentUser?.displayName || currentUser?.discordUsername || currentUser?.username || t('Member')} />

            {/* Stat Cards */}
            <div className='grid gap-6 mt-8 sm:grid-cols-2 lg:grid-cols-4'>
              <StatCard
                title={t('Drivers Number')}
                value={totalMembers}
                subtitle={t('Total VTC Members')}
                icon={UsersIcon}
                loading={loading}
              />
              <StatCard
                title={t('Total Jobs')}
                value={completedTotals.jobs.toLocaleString()}
                subtitle={t('All-time completed deliveries')}
                icon={BriefcaseIcon}
                loading={loading}
              />
              <StatCard
                title={t('Total Distance')}
                value={`${completedTotals.distanceKm.toLocaleString()} km`}
                subtitle={t('Distance on completed jobs')}
                icon={MapIcon}
                loading={loading}
              />
              <StatCard
                title={t('Upcoming Events')}
                value={upcomingEventCount}
                subtitle={t('VTC Events Attending')}
                icon={CalendarIcon}
                loading={loading}
              />
            </div>

            <div className='grid gap-6 py-8 lg:grid-cols-[1fr_550px]'>
              <DashboardCard
                title={t('Job Statistics')}
                description={t('Performance overview of distance and deliveries.')}
                buttonText={t('View performance')}
                className='h-[600px]'
              >
                <div className='relative h-full'>
                  <AppBarChart jobs={recentJobs} />
                </div>
              </DashboardCard>

              <UpcomingConvoyCard events={vtcEvents} />
            </div>

            <DashboardTable jobs={recentJobs} />
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

