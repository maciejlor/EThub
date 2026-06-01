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
import { Check } from 'lucide-react';
import ukFlag from '@/assets/UK.png';
import trFlag from '@/assets/TR.png';

export const Page = ({ children }: React.PropsWithChildren) => {
  return <div className='px-4 py-8 md:p-8'>{children}</div>;
};

export const PageHeader = ({ name = 'Sadee' }: { name?: string }) => {
  const { language, setLanguage, t } = useLanguage();

  const currentFlag = language === 'en' ? ukFlag : trFlag;
  const currentLabel = language === 'en' ? 'English' : 'Türkçe';

  return (
    <div className='flex flex-col gap-4 lg:flex-row lg:justify-between'>
      <div>
        <h1 className='text-xl font-semibold lg:text-2xl'>{t('Welcome back, {name}', { name })}</h1>
        <p className='text-sm text-muted-foreground'>{t("Here's your Daily Dashboard Overview.")}</p>
      </div>

      <div className='flex items-center gap-3'>
        <div className='flex items-center max-lg:hidden'>
          <ThemeToggle />
        </div>

        <div className='flex items-center gap-3'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className="flex items-center gap-2 cursor-pointer px-3">
                <img src={currentFlag} alt={currentLabel} className="w-5 h-4 object-cover rounded-sm" />
                <span>{currentLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-40'>
              <DropdownMenuItem onClick={() => setLanguage('en')} className="cursor-pointer flex items-center gap-2">
                <img src={ukFlag} alt="English" className="w-5 h-4 object-cover rounded-sm" />
                <span>English</span>
                {language === 'en' && <Check className='size-4 text-primary ms-auto' />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('tr')} className="cursor-pointer flex items-center gap-2">
                <img src={trFlag} alt="Türkçe" className="w-5 h-4 object-cover rounded-sm" />
                <span>Türkçe</span>
                {language === 'tr' && <Check className='size-4 text-primary ms-auto' />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
