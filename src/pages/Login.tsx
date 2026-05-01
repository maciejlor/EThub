/**
 * Login page styled like reference screenshot.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const canContinue = useMemo(() => {
    const e = email.trim();
    const p = password.trim();
    if (!e || !p) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && p.length >= 8;
  }, [email, password]);

  return (
    <div className='min-h-dvh bg-background text-foreground'>
      <div className='mx-auto grid min-h-dvh w-full max-w-[1200px] grid-cols-1 gap-0 p-4 lg:grid-cols-[440px_1fr]'>
        <div className='grid min-h-[calc(100dvh-2rem)] overflow-hidden rounded-[28px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.10)] lg:grid-cols-[440px_1fr]'>
          {/* Left promo panel */}
          <aside className='relative hidden lg:block'>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,214,102,0.18),transparent_58%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.10),transparent_55%),linear-gradient(160deg,#0B0F13_0%,#0F1A22_55%,#0B0F13_100%)]' />
            <div className='absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:26px_26px]' />

            <div className='relative flex h-full flex-col px-10 py-12 text-white'>
              <div className='flex items-center gap-2 text-sm font-medium text-white/80'>
                <div className='grid size-9 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15'>
                  <div className='relative size-4 rounded-full bg-white/80'>
                    <div className='absolute right-0 top-0 size-2 rounded-full bg-[#0B0F13]' />
                  </div>
                </div>
              </div>

              <div className='mt-auto pb-10'>
                <h2 className='text-3xl font-semibold leading-tight tracking-tight'>
                  One Platform to Streamline
                  <br />
                  All Product Analytics
                </h2>
                <p className='mt-4 max-w-sm text-sm leading-relaxed text-white/65'>
                  Your revenue are set to grow by 20% next month. Your revenue is
                  increase by next month with our campaign tools.
                </p>

                <div className='mt-10 flex items-center gap-3'>
                  <span className='size-1.5 rounded-full bg-white/45' />
                  <span className='size-1.5 rounded-full bg-white/70' />
                  <span className='size-1.5 rounded-full bg-white/45' />
                </div>
              </div>
            </div>
          </aside>

          {/* Right form panel */}
          <main className='relative flex min-h-[calc(100dvh-2rem)] flex-col bg-white px-6 py-8 lg:px-14 lg:py-10'>
            <div className='flex items-start justify-between'>
              <div className='grid size-9 place-items-center rounded-2xl bg-neutral-900 text-white'>
                <div className='relative size-4 rounded-full bg-white/90'>
                  <div className='absolute right-0 top-0 size-2 rounded-full bg-neutral-900' />
                </div>
              </div>

              <div className='text-xs text-muted-foreground'>
                Don&apos;t have an account?{' '}
                <a className='font-medium text-foreground underline underline-offset-2' href='#'>
                  Sign Up
                </a>
              </div>
            </div>

            <div className='mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-6 lg:py-0'>
              <h1 className='text-center text-2xl font-semibold tracking-tight'>
                Welcome back to Orion!
              </h1>
              <p className='mt-2 text-center text-sm text-muted-foreground'>
                Please enter your details to sign in your account
              </p>

              <div className='mt-8 space-y-3'>
                <Button
                  type='button'
                  variant='outline'
                  className='h-11 w-full rounded-xl border-neutral-200 bg-white text-sm font-medium text-neutral-900 shadow-none hover:bg-neutral-50'
                >
                  <span className='mr-2 inline-flex size-5 items-center justify-center rounded-full bg-white ring-1 ring-neutral-200'>
                    <span className='text-[10px] font-semibold text-neutral-700'>G</span>
                  </span>
                  Continue with Google
                </Button>

                <Button
                  type='button'
                  variant='outline'
                  className='h-11 w-full rounded-xl border-neutral-200 bg-white text-sm font-medium text-neutral-900 shadow-none hover:bg-neutral-50'
                >
                  <span className='mr-2 inline-flex size-5 items-center justify-center'>
                    <svg
                      aria-hidden='true'
                      viewBox='0 0 24 24'
                      className='size-5 fill-neutral-900'
                    >
                      <path d='M16.365 1.43c0 1.14-.43 2.22-1.23 3.12-.87 1-2.07 1.77-3.37 1.66-.15-1.22.44-2.46 1.25-3.3.9-.96 2.38-1.66 3.35-1.48zM20.55 17.1c-.62 1.44-.92 2.08-1.72 3.36-1.12 1.76-2.7 3.95-4.66 3.97-1.74.02-2.19-1.13-4.56-1.12-2.37.01-2.86 1.14-4.6 1.12-1.96-.02-3.46-1.98-4.58-3.74C.27 18.86-1 14.83.86 11.9c1.2-1.9 3.1-3.01 4.9-3.01 1.84 0 2.99 1.14 4.5 1.14 1.46 0 2.35-1.14 4.48-1.14 1.6 0 3.3.88 4.5 2.39-3.95 2.16-3.3 7.77.78 9.82z' />
                    </svg>
                  </span>
                  Continue with Apple
                </Button>
              </div>

              <div className='my-6 flex items-center gap-3'>
                <div className='h-px flex-1 bg-neutral-200' />
                <div className='text-xs text-muted-foreground'>Or sign in with</div>
                <div className='h-px flex-1 bg-neutral-200' />
              </div>

              <form
                className='space-y-4'
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!canContinue) return;
                }}
              >
                <div className='space-y-2'>
                  <label className='text-sm font-medium' htmlFor='email'>
                    Email
                  </label>
                  <Input
                    id='email'
                    type='email'
                    placeholder='johndoe@mail.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete='email'
                    className='h-11 rounded-xl border-neutral-200'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium' htmlFor='password'>
                    Password
                  </label>
                  <div className='relative'>
                    <Input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='minimum 8 character'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete='current-password'
                      className='h-11 rounded-xl border-neutral-200 pr-11'
                    />
                    <button
                      type='button'
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  </div>
                </div>

                <Button
                  type='submit'
                  disabled={!canContinue}
                  className='h-11 w-full rounded-xl bg-[linear-gradient(180deg,#F8B04B_0%,#F19B2C_100%)] text-white shadow-[0_10px_22px_rgba(241,155,44,0.35)] hover:opacity-95 disabled:opacity-60'
                >
                  Sign In <span className='ml-1'>→</span>
                </Button>

                <div className='pt-1 text-center text-xs'>
                  <a className='font-medium text-foreground underline underline-offset-2' href='#'>
                    Forgot password?
                  </a>
                </div>
              </form>
            </div>

            <div className='mt-8 flex items-center justify-between text-xs text-muted-foreground'>
              <div>© {new Date().getFullYear()} Orion</div>
              <div className='flex items-center gap-5'>
                <a className='hover:text-foreground' href='#'>
                  Privacy Policy
                </a>
                <a className='hover:text-foreground' href='#'>
                  Support
                </a>
                <Link className='hover:text-foreground' to='/'>
                  Back
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

