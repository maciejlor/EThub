import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRoles, type RoleEntry } from '@/lib/driver-storage';

interface RoleBadgeProps {
  role: string | RoleEntry; // This is now a role ID or a role object
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (!role) return null;
  
  const roles = getRoles();
  let roleObj = typeof role === 'string' ? roles.find(r => r.id === role) : role;
  if (!roleObj && typeof role === 'string') roleObj = roles.find(r => r.name === role);
  
  const name = roleObj?.name || (typeof role === 'string' ? role : role.name) || 'Unknown';
  const color = roleObj?.color || '#a1a1aa'; // default zinc-400
  const gradientColor = roleObj?.gradientColor;
  const iconUrl = roleObj?.iconUrl;

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-px rounded-full text-[10px] font-bold border tracking-wider uppercase shadow-sm',
        className
      )}
      style={{
        ...(gradientColor ? {
          background: `linear-gradient(135deg, ${color}22, ${gradientColor}22)`,
          borderColor: `${color}55`,
        } : {
          color: color,
          backgroundColor: `${color}1A`,
          borderColor: `${color}4D`
        })
      }}
    >
      {iconUrl ? (
        <img src={iconUrl} alt={name} className="w-3 h-3 object-contain drop-shadow-md" />
      ) : (
        <Shield className="w-2.5 h-2.5" style={gradientColor ? { color } : undefined} />
      )}
      <span style={gradientColor ? {
        backgroundImage: `linear-gradient(to right, ${color}, ${gradientColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: 'transparent'
      } : undefined}>
        {name}
      </span>
    </div>
  );
}
