'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface ProfileData {
  user_name: string;
  first_name: string;
  last_name: string;
  gender: string;
}

export default function Profile() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    user_name: '',
    first_name: '',
    last_name: '',
    gender: '',
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' oder 'password'
  const [message, setMessage] = useState<{ type: string; text: string }>({
    type: '',
    text: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.push('/sign-in');
        return;
      }

      setUser(userData.user);

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('user_name, first_name, last_name, gender')
        .eq('auth_id', userData.user.id)
        .single();

      if (!clientError && clientData) {
        setProfileData({
          user_name: clientData.user_name || '',
          first_name: clientData.first_name || '',
          last_name: clientData.last_name || '',
          gender: clientData.gender || '',
        });
      }

      setLoading(false);
    };

    fetchProfile();
  }, [router, supabase]);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setProfileData((prev) => ({ ...prev, [id]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [id]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      if (!user) {
        throw new Error('Kein Benutzer angemeldet');
      }

      const { error } = await supabase
        .from('clients')
        .update({
          user_name: profileData.user_name,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          gender: profileData.gender,
        })
        .eq('auth_id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: unknown) {
      console.error('Fehler beim Aktualisieren des Profils:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Ein Fehler ist aufgetreten.',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);

    try {
      // Passwort-Validierung
      if (passwordData.password.length < 6) {
        throw new Error('Das Passwort muss mindestens 6 Zeichen lang sein');
      }

      if (passwordData.password !== passwordData.confirmPassword) {
        throw new Error('Die Passwörter stimmen nicht überein');
      }

      // Passwort ändern
      const { error } = await supabase.auth.updateUser({
        password: passwordData.password,
      });

      if (error) throw error;

      // Zurücksetzen des Formulars
      setPasswordData({
        password: '',
        confirmPassword: '',
      });

      setMessage({ type: 'success', text: 'Passwort erfolgreich geändert!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: unknown) {
      console.error('Fehler beim Ändern des Passworts:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Ein Fehler ist aufgetreten.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex-1 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='flex-1 w-full max-w-3xl mx-auto py-8 px-4'>
      <h1 className='text-3xl font-bold mb-8'>Profil</h1>

      {message.text && (
        <div
          className={`p-4 rounded-md mb-6 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className='flex border-b mb-8'>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'profile'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Profildaten
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'password'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Passwort ändern
        </button>
      </div>

      {/* Profil-Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className='space-y-6'>
          <div>
            <label
              htmlFor='user_name'
              className='block text-sm font-medium mb-1'
            >
              Benutzername
            </label>
            <input
              id='user_name'
              type='text'
              value={profileData.user_name}
              onChange={handleProfileChange}
              className='block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label
                htmlFor='first_name'
                className='block text-sm font-medium mb-1'
              >
                Vorname
              </label>
              <input
                id='first_name'
                type='text'
                value={profileData.first_name}
                onChange={handleProfileChange}
                className='block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            <div>
              <label
                htmlFor='last_name'
                className='block text-sm font-medium mb-1'
              >
                Nachname
              </label>
              <input
                id='last_name'
                type='text'
                value={profileData.last_name}
                onChange={handleProfileChange}
                className='block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
          </div>

          <div>
            <label htmlFor='gender' className='block text-sm font-medium mb-1'>
              Geschlecht
            </label>
            <select
              id='gender'
              value={profileData.gender}
              onChange={handleProfileChange}
              className='block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value=''>Bitte wählen</option>
              <option value='male'>Männlich</option>
              <option value='female'>Weiblich</option>
              <option value='diverse'>Divers</option>
            </select>
          </div>

          <div className='flex items-center justify-between pt-4'>
            <button
              type='button'
              onClick={() => router.push('/dashboard')}
              className='text-blue-600 hover:underline'
            >
              Zurück zum Dashboard
            </button>

            <button
              type='submit'
              disabled={profileLoading}
              className='bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition disabled:opacity-50'
            >
              {profileLoading ? 'Speichert...' : 'Profil speichern'}
            </button>
          </div>
        </form>
      )}

      {/* Passwort-Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className='space-y-6'>
          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium mb-1'
            >
              Neues Passwort
            </label>
            <input
              id='password'
              type='password'
              value={passwordData.password}
              onChange={handlePasswordChange}
              minLength={6}
              required
              className='block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
            <p className='mt-1 text-xs text-gray-500'>Mindestens 6 Zeichen</p>
          </div>

          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium mb-1'
            >
              Passwort bestätigen
            </label>
            <input
              id='confirmPassword'
              type='password'
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              className='block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <div className='flex items-center justify-between pt-4'>
            <button
              type='button'
              onClick={() => router.push('/dashboard')}
              className='text-blue-600 hover:underline'
            >
              Zurück zum Dashboard
            </button>

            <button
              type='submit'
              disabled={passwordLoading}
              className='bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition disabled:opacity-50'
            >
              {passwordLoading ? 'Wird geändert...' : 'Passwort ändern'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
