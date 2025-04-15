'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOutAction } from '@/app/actions';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient();

  // Benutzer beim Laden der Komponente abrufen
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          router.push('/sign-in');
          return;
        }

        setUser(session.user);
      } catch (err) {
        console.error('Fehler beim Laden des Benutzers:', err);
        setError(
          err instanceof Error
            ? err
            : new Error('Unbekannter Fehler beim Laden des Benutzers')
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router, supabase.auth]);

  // Wenn der Benutzer noch geladen wird
  if (isLoading) {
    return (
      <div className='flex h-full w-full items-center justify-center p-8'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-500'>Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  // Fehleranzeige, falls ein Fehler auftritt
  if (error) {
    return (
      <div className='flex h-full w-full items-center justify-center p-8'>
        <div className='max-w-md w-full bg-white shadow-lg rounded-lg p-6 border-t-4 border-red-500'>
          <h2 className='text-2xl font-bold text-red-600 mb-4'>
            Es ist ein Fehler aufgetreten
          </h2>
          <p className='text-gray-700 mb-4'>{error.message}</p>
          <button
            onClick={() => router.push('/sign-in')}
            className='w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded'
          >
            Zurück zum Login
          </button>
        </div>
      </div>
    );
  }

  // Wenn kein Benutzer gefunden wurde (sollte nicht vorkommen, da wir bereits umgeleitet hätten)
  if (!user) {
    return (
      <div className='flex h-full w-full items-center justify-center p-8'>
        <div className='text-center'>
          <p className='text-gray-700 mb-4'>Kein Benutzer angemeldet.</p>
          <Link
            href='/sign-in'
            className='bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded'
          >
            Zum Login
          </Link>
        </div>
      </div>
    );
  }

  // Dashboard-Ansicht
  return (
    <div className='max-w-6xl mx-auto p-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <p className='text-gray-600'>Willkommen zurück, {user.email}!</p>
      </div>

      {/* Benutzerinformationen */}
      <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
        <h2 className='text-xl font-semibold mb-4 border-b pb-2'>
          Deine Informationen
        </h2>

        <div className='grid gap-6 md:grid-cols-1'>
          <div>
            <h3 className='font-medium text-gray-700 mb-3'>Benutzerkonto</h3>
            <ul className='space-y-3'>
              <li className='flex'>
                <span className='font-medium w-32'>Email:</span>
                <span className='text-gray-600'>{user.email}</span>
              </li>
              <li className='flex'>
                <span className='font-medium w-32'>Benutzer-ID:</span>
                <span className='text-gray-600'>{user.id}</span>
              </li>
              <li className='flex'>
                <span className='font-medium w-32'>Email bestätigt:</span>
                <span
                  className={
                    user.email_confirmed_at ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {user.email_confirmed_at ? 'Ja' : 'Nein'}
                </span>
              </li>
              <li className='flex'>
                <span className='font-medium w-32'>Anbieter:</span>
                <span className='text-gray-600'>
                  {user.app_metadata?.provider || 'Email'}
                </span>
              </li>
              <li className='flex'>
                <span className='font-medium w-32'>Rolle:</span>
                <span className='text-gray-600'>{user.role}</span>
              </li>
              <li className='flex'>
                <span className='font-medium w-32'>Letzte Anmeldung:</span>
                <span className='text-gray-600'>
                  {new Date(
                    user.last_sign_in_at || Date.now()
                  ).toLocaleString()}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Aktionen */}
      <div className='bg-white rounded-lg shadow-md p-6'>
        <h2 className='text-xl font-semibold mb-4 border-b pb-2'>
          Schnellzugriff
        </h2>

        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
          <Link
            href='/profile'
            className='bg-gray-100 hover:bg-gray-200 p-4 rounded-lg text-center transition-colors'
          >
            <h3 className='font-medium mb-1'>Profil bearbeiten</h3>
            <p className='text-sm text-gray-600'>
              Aktualisiere deine persönlichen Daten
            </p>
          </Link>

          <Link
            href='/settings'
            className='bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center transition-colors'
          >
            <h3 className='font-medium mb-1 text-blue-700'>Einstellungen</h3>
            <p className='text-sm text-gray-600'>Passwort ändern & mehr</p>
          </Link>

          <Link
            href='/support'
            className='bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center transition-colors'
          >
            <h3 className='font-medium mb-1 text-purple-700'>Support</h3>
            <p className='text-sm text-gray-600'>Hilfe & Unterstützung</p>
          </Link>
        </div>
      </div>

      {/* Abmelde-Button */}
      <div className='mt-8 text-center'>
        <button
          onClick={() => signOutAction()}
          className='text-red-600 hover:text-red-800 font-medium transition-colors'
        >
          Abmelden
        </button>
      </div>
    </div>
  );
}
