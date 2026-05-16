import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  loading?: boolean;
}

export function StatCard({ title, value, subtitle, icon: Icon, loading }: StatCardProps) {
  return (
    <div className='bg-background text-card-foreground rounded-2xl border p-6 flex flex-col justify-between gap-4 shadow-sm relative'>
       <div className='flex items-start justify-between'>
          <p className='text-sm font-medium text-muted-foreground'>{title}</p>
          <div className='size-10 rounded-full bg-muted/50 flex items-center justify-center text-foreground'>
             <Icon className='size-5' />
          </div>
       </div>
       
       <div className='space-y-1'>
          {loading ? (
            <div className='h-9 w-32 bg-muted animate-pulse rounded-lg' />
          ) : (
            <h3 className='text-2xl font-bold tracking-tight'>{value}</h3>
          )}
          {subtitle && (
            <p className='text-sm text-muted-foreground'>{subtitle}</p>
          )}
       </div>
    </div>
  );
}
