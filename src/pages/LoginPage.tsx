import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserIcon, ShieldIcon } from 'lucide-react';
import { getUsers, setCurrentUser } from '@/lib/driver-storage';

export function LoginPage() {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const users = getUsers();

  const handleLogin = async () => {
    if (!selectedUser) {
      setError('Please select a user to login');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = setCurrentUser(selectedUser);
      if (success) {
        navigate('/');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30';
      case 'HR Manager': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
      case 'Event Manager': return 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30';
      case 'Senior Staff': return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
      case 'Staff': return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30';
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'HR': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
      case 'Event': return 'bg-purple-500/20 text-purple-700 dark:text-purple-400';
      case 'Admin': return 'bg-red-500/20 text-red-700 dark:text-red-400';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
    }
  };

  if (users.length === 0) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <Card className='w-full max-w-md bg-card border-border'>
          <CardHeader className='text-center'>
            <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
              <UserIcon className='h-8 w-8 text-primary' />
            </div>
            <CardTitle className='text-foreground'>No Users Available</CardTitle>
          </CardHeader>
          <CardContent className='text-center'>
            <p className='text-muted-foreground mb-4'>
              No users have been created yet. Please contact an administrator to create user accounts.
            </p>
            <Button 
              onClick={() => navigate('/admin/members')}
              className='bg-primary text-primary-foreground hover:bg-primary/90'
            >
              Go to User Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <Card className='w-full max-w-md bg-card border-border'>
        <CardHeader className='text-center'>
          <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
            <UserIcon className='h-8 w-8 text-primary' />
          </div>
          <CardTitle className='text-foreground'>Login to EThub</CardTitle>
          <p className='text-sm text-muted-foreground'>
            Select your account to continue
          </p>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <label className='text-sm font-medium text-foreground block mb-2'>Select User</label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className='bg-background border-border'>
                <SelectValue placeholder='Choose a user account' />
              </SelectTrigger>
              <SelectContent className='bg-card border-border max-h-64 overflow-y-auto'>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id} className='text-foreground hover:bg-accent'>
                    <div className='flex items-center gap-2 py-2'>
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.displayName} 
                          className='w-6 h-6 rounded-full object-cover'
                        />
                      ) : (
                        <div className='w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center'>
                          <UserIcon className='h-3 w-3 text-primary' />
                        </div>
                      )}
                      <div className='flex-1 min-w-0'>
                        <div className='font-medium text-foreground truncate'>{user.displayName}</div>
                        <div className='text-xs text-muted-foreground truncate'>@{user.username}</div>
                        <div className='flex items-center gap-1 mt-1'>
                          <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                            {user.role}
                          </Badge>
                          <Badge className={`text-xs ${getDepartmentColor(user.department)}`}>
                            {user.department}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className='p-3 bg-destructive/10 border border-destructive/20 rounded-md'>
              <p className='text-sm text-destructive'>{error}</p>
            </div>
          )}

          <Button 
            onClick={handleLogin} 
            disabled={isLoading || !selectedUser}
            className='w-full bg-primary text-primary-foreground hover:bg-primary/90'
          >
            {isLoading ? (
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin' />
                Logging in...
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                <ShieldIcon className='h-4 w-4' />
                Login
              </div>
            )}
          </Button>

          <div className='text-center text-xs text-muted-foreground'>
            <p>Role-based access will be applied based on your user permissions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
