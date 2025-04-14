// app/(auth-pages)/sign-up/page.tsx
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userName: '',
    firstName: '',
    lastName: '',
    gender: '',
    role: 'user',
  });

  const supabase = createClientComponentClient();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Alles in einer Edge Function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: formData,
      });

      if (error || !data.success) {
        throw new Error(
          error?.message || data?.error || 'Registrierung fehlgeschlagen'
        );
      }

      // Nach erfolgreicher Registrierung automatisch anmelden
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      // Weiterleitung
      router.push('/dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2'>
      <h1 className='text-2xl font-bold mb-4'>Registrierung</h1>
      <form onSubmit={handleSignUp} className='flex flex-col gap-4'>
        <div>
          <label htmlFor='email' className='block text-sm font-medium'>
            Email
          </label>
          <input
            id='email'
            type='email'
            value={formData.email}
            onChange={handleChange}
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
            value={formData.password}
            onChange={handleChange}
            required
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500'
          />
        </div>

        <div>
          <label htmlFor='userName' className='block text-sm font-medium'>
            Benutzername
          </label>
          <input
            id='userName'
            type='text'
            value={formData.userName}
            onChange={handleChange}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500'
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label htmlFor='firstName' className='block text-sm font-medium'>
              Vorname
            </label>
            <input
              id='firstName'
              type='text'
              value={formData.firstName}
              onChange={handleChange}
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500'
            />
          </div>

          <div>
            <label htmlFor='lastName' className='block text-sm font-medium'>
              Nachname
            </label>
            <input
              id='lastName'
              type='text'
              value={formData.lastName}
              onChange={handleChange}
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500'
            />
          </div>
        </div>

        <div>
          <label htmlFor='gender' className='block text-sm font-medium'>
            Geschlecht
          </label>
          <select
            id='gender'
            value={formData.gender}
            onChange={handleChange}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500'
          >
            <option value=''>Bitte wählen</option>
            <option value='male'>Männlich</option>
            <option value='female'>Weiblich</option>
            <option value='diverse'>Divers</option>
          </select>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50'
        >
          {loading ? 'Registrierung läuft...' : 'Registrieren'}
        </button>
      </form>
    </div>
  );
}
