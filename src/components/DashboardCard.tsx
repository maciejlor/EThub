/**
 * @copyright 2025 codewithsadee
 * @license Apache-2.0
 */

/**
 * Components
 */
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

/**
 * Assets
 */
import { EllipsisVerticalIcon } from 'lucide-react';

/**
 * Types
 */
type Props = {
  title: string;
  description: string;
  text?: string;
  buttonText: string;
};

/**
 * Constants
 */
import { DASHBOARD_CARD_MENU } from '@/constants';

export const DashboardCard = ({
  title,
  description,
  buttonText,
  children,
}: React.PropsWithChildren<Props>) => {
  return (
    <Card className='bg-background'>
      <CardHeader className='border-b flex justify-between'>
        <div>
          <CardTitle className='text-lg'>{title}</CardTitle>

          <CardDescription>{description}</CardDescription>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <EllipsisVerticalIcon size={20} />
          </DropdownMenuTrigger>

          <DropdownMenuContent align='end'>
            {DASHBOARD_CARD_MENU.map((item) => (
              <DropdownMenuItem key={item.label}>
                <item.Icon />

                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className='grid grid-cols-1 grow'>{children}</CardContent>

      <CardFooter className='border-t'>
        <Button
          variant='outline'
          className='ml-auto'
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};
