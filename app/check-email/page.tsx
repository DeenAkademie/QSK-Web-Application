'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CheckEmail() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setEmail(session?.user?.email || null);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserEmail();
  }, []);

  const handleResendEmail = async () => {
    if (!email || resending) return;

    setResending(true);
    setResendSuccess(false);

    try {
      const supabase = createClient();
      await supabase.auth.resend({
        type: 'signup',
        email,
      });
      setResendSuccess(true);
    } catch (error) {
      console.error('Error resending confirmation email:', error);
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-200px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#4AA4DE]'></div>
      </div>
    );
  }

  return (
    <div className='flex justify-center items-center min-h-[calc(100vh-200px)] px-4 py-8'>
      <Card className='w-full max-w-md shadow-lg border-t-4 border-t-[#4AA4DE]'>
        <CardHeader className='space-y-1'>
          <div className='flex justify-center mb-4'>
            <div className='bg-blue-50 p-3 rounded-full'>
              <Mail className='h-10 w-10 text-[#4AA4DE]' />
            </div>
          </div>
          <CardTitle className='text-2xl font-bold text-center'>
            E-Mail-Bestätigung erforderlich
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 text-center'>
          <p className='text-gray-600'>
            Wir haben einen Bestätigungslink an{' '}
            <span className='font-semibold'>
              {email || 'deine E-Mail-Adresse'}
            </span>{' '}
            gesendet.
          </p>
          <p className='text-gray-600'>
            Bitte überprüfe dein Postfach und klicke auf den Link, um deine
            Registrierung abzuschließen.
          </p>

          {resendSuccess && (
            <Alert className='border-green-400 text-green-800 bg-green-50'>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription>
                Ein neuer Bestätigungslink wurde erfolgreich gesendet!
              </AlertDescription>
            </Alert>
          )}

          <div className='flex flex-col sm:flex-row gap-3 pt-4'>
            <Button asChild variant='outline' className='flex-1'>
              <Link
                href='/sign-in'
                className='flex items-center justify-center'
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Zurück zur Anmeldung
              </Link>
            </Button>
            <Button
              onClick={handleResendEmail}
              disabled={!email || resending}
              className='flex-1 bg-[#4AA4DE] hover:bg-[#3587BF] text-white'
            >
              {resending ? (
                <>
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Link erneut senden
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <p className='text-xs text-gray-500 text-center w-full'>
            Wenn du keine E-Mail erhalten hast, überprüfe bitte deinen
            Spam-Ordner oder registriere dich erneut mit einer korrekten
            E-Mail-Adresse.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
