import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserIcon, TruckIcon } from 'lucide-react';
import { getCurrentUser, type UserEntry } from '@/lib/driver-storage';

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso?: string) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProfilePage() {
  const user = getCurrentUser();
  const profileAvatar = user?.avatar || user?.discordAvatar || user?.steamAvatar;

  if (!user) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-background">
          <Header />
          <main className="bg-background">
            <Page>
              <div className="text-center py-16">No profile selected.</div>
            </Page>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <Header />
        <main className="bg-background">
          <Page>
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="relative w-full h-[320px] md:h-[380px] bg-black">
                {user.coverImage ? (
                  <>
                    <img src={user.coverImage} alt="cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-slate-800" />
                )}
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute left-8 bottom-6 flex items-center gap-4">
                  {profileAvatar ? (
                    <img src={profileAvatar} alt="avatar" className="w-36 h-36 rounded-lg border border-white/30 object-cover" />
                  ) : (
                    <div className="w-36 h-36 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
                      <UserIcon className="h-8 w-8" />
                    </div>
                  )}
                  <div className="text-white">
                    <div className="text-3xl font-bold">{user.displayName}</div>
                    <div className="text-sm opacity-90">@{user.username}</div>
                    <div className="mt-2 text-sm">Member since: {formatDate(user.createdAt)}</div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4">
                  <Badge className="text-sm border">{user.role}</Badge>
                  {user.rankTitle && <div className="text-sm text-muted-foreground">{user.rankTitle} {user.rankLevel ? `· Level ${user.rankLevel}` : ''}</div>}
                  <div className="ml-auto flex gap-2">
                    <Button asChild>
                      <a href={`https://truckersmp.com/players?search=${encodeURIComponent(user.displayName)}`} target="_blank" rel="noreferrer" className="h-9 px-3">TMP</a>
                    </Button>
                    <Button asChild>
                      <a href={user.steamId ? (user.steamId.startsWith('http') ? user.steamId : `https://steamcommunity.com/profiles/${user.steamId}`) : '#'} target="_blank" rel="noreferrer" className="h-9 px-3">Steam</a>
                    </Button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="text-xs text-muted-foreground">Total Jobs</div>
                    <div className="text-lg font-bold">—</div>
                  </div>
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="text-xs text-muted-foreground">Last Login</div>
                    <div className="text-lg font-bold">{formatDateTime(user.lastLogin)}</div>
                  </div>
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="text-xs text-muted-foreground">Profile Links</div>
                    <div className="text-sm">
                      {user.discordId ? (
                        <a href={`https://discord.com/users/${user.discordId}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">Discord</a>
                      ) : '—'}
                      <span className="mx-2">•</span>
                      {user.steamId ? (
                        <a href={user.steamId.startsWith('http') ? user.steamId : `https://steamcommunity.com/profiles/${user.steamId}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">Steam</a>
                      ) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
