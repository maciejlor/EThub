/**
 * @copyright 2025 codewithsadee
 * @license Apache-2.0
 */

/**
 * Components
 */
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLanguage } from '@/components/LanguageProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Assets
 */
import { SearchIcon, Globe, Check } from 'lucide-react';

export const Page = ({ children }: React.PropsWithChildren) => {
  return <div className='px-4 py-8 md:p-8'>{children}</div>;
};

export const PageHeader = ({ name = 'Sadee' }: { name?: string }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className='flex flex-col gap-4 lg:flex-row lg:justify-between'>
      <div>
        <h1 className='text-xl font-semibold lg:text-2xl'>{t('Welcome back, {name}', { name })}</h1>
        <p className='text-sm text-muted-foreground'>{t("Here's your Daily Dashboard Overview.")}</p>
      </div>

      <div className='flex gap-3'>
        <div className='flex max-lg:hidden'>
          <ThemeToggle />

          <Button
            variant='ghost'
            size='icon'
            aria-label='Search'
          >
            <SearchIcon />
          </Button>
        </div>

        <div className='flex items-center gap-3'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className="flex items-center gap-2 cursor-pointer">
                <Globe className="size-4" />
                <span>{language === 'en' ? 'English' : 'Türkçe'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-40'>
              <DropdownMenuItem onClick={() => setLanguage('en')} className="flex items-center justify-between cursor-pointer">
                <span>English</span>
                {language === 'en' && <Check className='size-4 text-primary ml-auto' />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('tr')} className="flex items-center justify-between cursor-pointer">
                <span>Türkçe</span>
                {language === 'tr' && <Check className='size-4 text-primary ml-auto' />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
