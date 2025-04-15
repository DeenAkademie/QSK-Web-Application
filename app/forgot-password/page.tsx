'use client';

import { useState } from 'react';
import { forgotPasswordAction } from '@/app/actions';
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
import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Formular-Daten für Server Action vorbereiten
      const formData = new FormData();
      formData.append('email', email);

      // Server Action aufrufen
      await forgotPasswordAction(formData);

      // Bei Erfolg Erfolgsmeldung anzeigen
      setSuccess(
        'Eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts wurde an deine E-Mail-Adresse gesendet.'
      );
      setEmail(''); // Formular zurücksetzen
    } catch (err) {
      console.error('Fehler beim Zurücksetzen des Passworts:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='flex justify-center items-center min-h-[calc(100vh-200px)] px-4'>
      <Card className='w-full max-w-md shadow-lg border-t-4 border-t-[#4AA4DE]'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Passwort zurücksetzen
          </CardTitle>
          <CardDescription className='text-center'>
            Gib deine E-Mail-Adresse ein, um dein Passwort zurückzusetzen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className='space-y-4'>
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

            {error && (
              <Alert
                variant='destructive'
                className='border-red-400 text-red-800 bg-red-50'
              >
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className='border-green-400 text-green-800 bg-green-50'>
                <CheckCircle className='h-4 w-4' />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button
              type='submit'
              disabled={isLoading}
              className='w-full bg-[#4AA4DE] hover:bg-[#3587BF] text-white'
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Wird verarbeitet...
                </>
              ) : (
                <>
                  <Mail className='mr-2 h-4 w-4' />
                  Link zusenden
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex flex-col space-y-2'>
          <div className='text-center text-sm'>
            Zurück zum{' '}
            <Link
              href='/sign-in'
              className='text-[#4AA4DE] hover:text-[#3587BF] transition-colors font-medium'
            >
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
