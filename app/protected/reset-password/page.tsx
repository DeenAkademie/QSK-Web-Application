'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClientComponentClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setMessage('Passwort-Reset-Link wurde gesendet!');
    } catch (error) {
      setMessage(
        `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2'>
      <h1 className='text-2xl font-bold mb-4'>Passwort zurücksetzen</h1>

      {message && (
        <div
          className={`p-4 rounded-md ${message.includes('Fehler') ? 'bg-red-100' : 'bg-green-100'}`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleResetPassword} className='flex flex-col gap-4'>
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
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm'
          />
        </div>

        <button
          type='submit'
          disabled={loading}
          className='py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50'
        >
          {loading ? 'Wird gesendet...' : 'Link zum Zurücksetzen senden'}
        </button>
      </form>
    </div>
  );
}
