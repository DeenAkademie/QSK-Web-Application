// app/auth/signin/page.tsx
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const supabase = createClientComponentClient();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unbekannter Fehler bei der Anmeldung'
      );
    } finally {
      setLoading(false);
    }
  }

  // CopeCart Login-Option
  const handleCopeCartLogin = async () => {
    setLoading(true);
    const orderEmail = prompt(
      'Bitte gib die E-Mail-Adresse ein, mit der du bei CopeCart bestellt hast:'
    );

    if (!orderEmail) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        'verify-copecart-purchase',
        {
          body: { email: orderEmail },
        }
      );

      if (error || !data.exists) {
        throw new Error('Kein aktiver Kauf mit dieser E-Mail gefunden.');
      }

      // E-Mail mit temporärem Passwort oder Magic Link senden
      await supabase.functions.invoke('send-login-link', {
        body: { email: orderEmail },
      });

      alert('Wir haben dir einen Login-Link per E-Mail gesendet!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2'>
      <h1 className='text-2xl font-bold mb-4'>Anmelden</h1>
      <form onSubmit={handleSignIn} className='flex flex-col gap-4'>
        <div>
          <label htmlFor='email' className='block text-sm font-medium'>
            Email
          </label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500'
          />
        </div>

        <div>
          <label htmlFor='password' className='block text-sm font-medium'>
            Passwort
          </label>
          <input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500'
          />
        </div>

        <button
          type='submit'
          disabled={loading}
          className='py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50'
        >
          {loading ? 'Anmeldung...' : 'Anmelden'}
        </button>

        <p className='text-sm text-center'>
          Noch kein Konto?{' '}
          <Link href='/sign-up' className='text-green-600 hover:underline'>
            Registrieren
          </Link>
        </p>
      </form>

      <div className='mt-6'>
        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-300' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='bg-white px-2 text-gray-500'>Oder</span>
          </div>
        </div>

        <button
          type='button'
          onClick={handleCopeCartLogin}
          className='mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          Mit CopeCart-Kauf anmelden
        </button>
      </div>
    </div>
  );
}
