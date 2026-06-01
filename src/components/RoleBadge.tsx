import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  let colorClass = 'text-primary bg-primary/10 border-primary/20'; // default
  
  if (!role) {
    return null;
  }
  
  const lowerRole = role.toLowerCase();
  
  if (lowerRole.includes('admin')) {
    colorClass = 'text-red-500 bg-red-500/10 border-red-500/30';
  } else if (lowerRole.includes('driver')) {
    colorClass = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
  } else if (lowerRole.includes('hr staff') || lowerRole.includes('hr manager')) {
    colorClass = 'text-blue-500 bg-blue-500/10 border-blue-500/30';
  } else if (lowerRole.includes('event staff') || lowerRole.includes('event manager')) {
    colorClass = 'text-amber-500 bg-amber-500/10 border-amber-500/30';
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-1.5 py-px rounded-full text-[9px] font-semibold border tracking-wider uppercase',
      colorClass,
      className
    )}>
      <Shield className="w-2.5 h-2.5" />
      <span>{role}</span>
    </div>
  );
}
