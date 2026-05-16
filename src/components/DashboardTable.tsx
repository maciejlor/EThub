/**
 * @copyright 2025 codewithsadee
 * @license Apache-2.0
 */

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { TruckyJob } from '@/lib/trucky';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  jobs: TruckyJob[];
}

const ITEMS_PER_PAGE = 5;

export const DashboardTable = ({ jobs }: Props) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
  const currentJobs = jobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className='bg-background rounded-2xl border px-6 py-6 shadow-sm mt-8'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='text-lg font-semibold'>Detail informations of jobs</h2>
          <p className='text-sm text-muted-foreground'>Latest deliveries logged in Trucky.</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className='hover:bg-transparent border-b-muted/10'>
            <TableHead className='w-[40px] text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40'>#</TableHead>
            <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40'>Driver</TableHead>
            <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40'>Route</TableHead>
            <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40'>Cargo</TableHead>
            <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-right'>Distance</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {currentJobs.map((job, index) => {
            const absoluteIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
            const getStatusClass = (status?: string) => {
              const s = status?.toLowerCase() || '';
              if (s.includes('done') || s.includes('completed') || s.includes('finished')) return 'bg-gradient-to-l from-green-500/10 to-transparent hover:from-green-500/20 border-r-2 border-r-green-500';
              if (s.includes('cancel') || s.includes('declined') || s.includes('failed')) return 'bg-gradient-to-l from-red-500/10 to-transparent hover:from-red-500/20 border-r-2 border-r-red-500';
              if (s.includes('pending') || s.includes('progress') || s.includes('active')) return 'bg-gradient-to-l from-yellow-500/10 to-transparent hover:from-yellow-500/20 border-r-2 border-r-yellow-500';
              return 'hover:bg-foreground/[0.02] border-b-muted/5';
            };
            return (
              <TableRow 
                key={job.id} 
                className={`transition-colors cursor-pointer group ${getStatusClass(job.status)}`} 
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
              <TableCell className='py-4 text-xs text-muted-foreground font-medium'>
                {absoluteIndex}
              </TableCell>
              <TableCell className='py-4'>
                <div className='flex items-center gap-3'>
                  <div className='size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 overflow-hidden'>
                    {job.driver?.avatar_url || job.driver?.avatar ? (
                      <img src={job.driver.avatar_url || job.driver.avatar} alt={job.driver.name} className='w-full h-full object-cover' />
                    ) : (
                      job.driver?.name?.charAt(0) || '?'
                    )}
                  </div>
                  <span className='text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors'>
                    {job.driver?.name || 'Unknown'}
                  </span>
                </div>
              </TableCell>
              <TableCell className='py-5'>
                <div className='flex items-center gap-2 text-sm font-bold'>
                  <span className='text-foreground'>{job.source_city_name}</span>
                  <span className='text-muted-foreground/30 font-normal'>→</span>
                  <span className='text-foreground'>{job.destination_city_name}</span>
                </div>
              </TableCell>
              <TableCell className='py-5'>
                <Badge variant='outline' className='bg-muted/10 border-muted/20 text-muted-foreground/70 text-[10px] font-semibold px-2.5 py-0.5 rounded-full lowercase tracking-tight'>
                  {job.cargo_name}
                </Badge>
              </TableCell>
              <TableCell className='py-4 text-right'>
                <span className='text-sm font-black tracking-tight text-foreground'>
                  {Math.round(job.real_distance_km || job.planned_distance_km)} <span className='text-xs font-bold text-muted-foreground/50'>km</span>
                </span>
              </TableCell>
              </TableRow>
            );
          })}
          {currentJobs.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className='text-center py-10 text-muted-foreground'>
                No recent jobs found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between mt-6 pt-6 border-t border-muted/10'>
          <p className='text-xs text-muted-foreground font-medium'>
            Showing <span className='text-foreground'>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className='text-foreground'>{Math.min(currentPage * ITEMS_PER_PAGE, jobs.length)}</span> of <span className='text-foreground'>{jobs.length}</span> entries
          </p>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='h-8 px-2 rounded-lg border-muted/20 hover:bg-muted/50 transition-all text-xs font-bold'
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className='size-3.5 mr-1' />
              Previous
            </Button>
            <div className='flex items-center gap-1'>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`size-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <Button
              variant='outline'
              size='sm'
              className='h-8 px-2 rounded-lg border-muted/20 hover:bg-muted/50 transition-all text-xs font-bold'
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className='size-3.5 ml-1' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
