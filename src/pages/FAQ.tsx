import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { useLanguage } from '@/components/LanguageProvider';

const STAFF_FORM_URL = 'https://forms.gle/v3X4XoYs7MWruL719';

function FaqBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='rounded-2xl border bg-background px-5 py-5 shadow-sm'>
      <h2 className='text-base font-semibold text-foreground tracking-tight'>{title}</h2>
      <div className='mt-3 space-y-2 text-sm text-muted-foreground leading-relaxed'>{children}</div>
    </div>
  );
}

export function FAQPage() {
  const { t } = useLanguage();
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <Header />

        <main>
          <Page>
            <div className='flex flex-col gap-1'>
              <h1 className='text-xl font-semibold lg:text-2xl'>{t('FAQ')}</h1>
              <p className='text-sm text-muted-foreground'>
                {t('Quick answers for drivers — bans, staff, convoy equipment, and in-game help.')}
              </p>
            </div>

            <div className='mt-8 max-w-3xl space-y-6'>
              <FaqBlock title={t('What should I do if I get banned in TMP?')}>
                <p>
                  {t('Contact HR via direct message as soon as possible. They will guide you on next steps.')}
                </p>
                <p>
                  {t('Not reporting a ban may lead to warnings or removal from the VTC.')}
                </p>
              </FaqBlock>

              <FaqBlock title={t('How can I apply for staff?')}>
                <p>
                  {t('You can apply using the')}{' '}
                  <a
                    href={STAFF_FORM_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='font-medium text-primary underline-offset-4 hover:underline'
                  >
                    {t('Google Form')}
                  </a>
                  {t('. Leadership may also share the link elsewhere.')}
                </p>
                <p>{t('You should receive a response within 24–72 hours.')}</p>
              </FaqBlock>

              <FaqBlock title={t('Which truck and trailer are we using?')}>
                <p>
                  {t('Check the #konvoy-bilgi channel on Discord. Required truck and trailer details for each convoy are posted there.')}
                </p>
              </FaqBlock>

              <FaqBlock title={t('Why is the convoy moving so slowly?')}>
                <p>
                  {t('Convoy Control may reduce speed to close gaps between drivers. That keeps the convoy organised and reduces the chance of people taking wrong turns or splitting the pack.')}
                </p>
              </FaqBlock>

              <FaqBlock title={t('Issue in game?')}>
                <p>
                  {t('Tell higher ranks (e.g. in Discord). They can point you to the right person or fix where possible.')}
                </p>
              </FaqBlock>
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
