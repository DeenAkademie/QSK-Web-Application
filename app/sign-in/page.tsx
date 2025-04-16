'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, LockIcon, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function SignIn() {
  const router = useRouter();
  const { refreshAuth, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  // Redirect wenn bereits angemeldet
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Formular-Daten für Server Action vorbereiten
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      // Server Action aufrufen und Ergebnis verarbeiten
      const result = await signInAction(formData);

      if (result.success) {
        // Erfolg anzeigen
        setLoginSuccess(true);

        // Kurz warten und dann Auth-Context aktualisieren
        setTimeout(async () => {
          await refreshAuth();
          // Nach Aktualisierung zum angegebenen Ziel weiterleiten
          router.push(redirectTo || '/');
        }, 500);
      } else if (result.error) {
        // Bei Fehlern die Fehlermeldung anzeigen
        setError(result.error);
        setIsLoading(false);
      }
    } catch (err) {
      // Nur für unerwartete Fehler
      console.error('Unerwarteter Anmeldefehler:', err);
      setError(
        'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      );
      setIsLoading(false);
    }
  }

  return (
    <div className='flex justify-center items-center min-h-[calc(100vh-200px)] px-4'>
      <Card className='w-full max-w-md shadow-lg border-t-4 border-t-[#4AA4DE]'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Anmelden
          </CardTitle>
          <CardDescription className='text-center'>
            Melde dich an, um auf deinen Account zuzugreifen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>E-Mail</Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='you@example.com'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full'
              />
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password'>Passwort</Label>
                <Link
                  href='/forgot-password'
                  className='text-sm text-[#4AA4DE] hover:text-[#3587BF] transition-colors'
                >
                  Passwort vergessen?
                </Link>
              </div>
              <Input
                id='password'
                name='password'
                type='password'
                placeholder='••••••••'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full'
              />
            </div>

            {error && (
              <Alert
                variant='destructive'
                className='border-red-400 text-red-800 bg-red-50 flex items-start'
              >
                <div className='mr-2 mt-0.5'>
                  {error.includes('Passwort') || error.includes('E-Mail') ? (
                    <LockIcon className='h-5 w-5' />
                  ) : (
                    <AlertCircle className='h-5 w-5' />
                  )}
                </div>
                <AlertDescription>
                  <p className='font-medium'>{error}</p>
                  {(error.includes('Passwort') || error.includes('E-Mail')) && (
                    <p className='text-sm mt-1'>
                      Bitte überprüfen Sie Ihre Anmeldedaten oder{' '}
                      <Link
                        href='/forgot-password'
                        className='text-red-800 underline'
                      >
                        setzen Sie Ihr Passwort zurück
                      </Link>
                      .
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {loginSuccess && (
              <Alert className='border-green-400 text-green-800 bg-green-50 flex items-start'>
                <div className='mr-2 mt-0.5'>
                  <CheckCircle className='h-5 w-5' />
                </div>
                <AlertDescription>
                  <p className='font-medium'>Erfolgreich angemeldet!</p>
                  <p className='text-sm mt-1'>Sie werden weitergeleitet...</p>
                </AlertDescription>
              </Alert>
            )}

            <Button
              type='submit'
              disabled={isLoading || loginSuccess}
              className='w-full bg-[#4AA4DE] hover:bg-[#3587BF] text-white'
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Wird angemeldet...
                </>
              ) : (
                'Anmelden'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex flex-col space-y-2'>
          <div className='text-center text-sm'>
            Noch kein Konto?{' '}
            <Link
              href='/sign-up'
              className='text-[#4AA4DE] hover:text-[#3587BF] transition-colors font-medium'
            >
              Jetzt registrieren
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
