'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getProfileAction } from '@/app/actions';
import { User } from '@supabase/supabase-js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProfileData {
  user_name: string;
  first_name: string;
  last_name: string;
  gender: string;
  email: string;
}

interface ClientsSettings {
  id?: string;
  client_id: string;
  language: string;
  notification_live_call: boolean;
  notification_learn_reminders: boolean;
  notification_feature_updates: boolean;
}

export default function Profile() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    user_name: '',
    first_name: '',
    last_name: '',
    gender: '',
    email: '',
  });
  const [clientsSettings, setClientsSettings] = useState<ClientsSettings>({
    client_id: '',
    language: 'de',
    notification_live_call: true,
    notification_learn_reminders: true,
    notification_feature_updates: true,
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState<{ type: string; text: string }>({
    type: '',
    text: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Server Action für Profildaten verwenden
        const profileDataResponse = await getProfileAction();

        if (!profileDataResponse.user.id) {
          router.push('/sign-in');
          return;
        }

        setUser({
          id: profileDataResponse.user.id,
          email: profileDataResponse.user.email || '',
          created_at: profileDataResponse.user.created_at || '',
        } as User);

        // Profildaten aus dem Client-Objekt extrahieren
        if (profileDataResponse.client) {
          setProfileData({
            user_name: profileDataResponse.client.user_name || '',
            first_name: profileDataResponse.client.first_name || '',
            last_name: profileDataResponse.client.last_name || '',
            gender: profileDataResponse.client.gender || '',
            email: profileDataResponse.client.email || '',
          });

          if (profileDataResponse.clients_settings) {
            setClientsSettings({
              ...clientsSettings,
              ...profileDataResponse.clients_settings,
              client_id: profileDataResponse.user.id,
            });
          } else {
            // Defaults setzen mit der user ID, falls keine Settings existieren
            setClientsSettings({
              ...clientsSettings,
              client_id: profileDataResponse.user.id,
            });
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden des Profils:', error);
        setMessage({
          type: 'error',
          text: 'Profildaten konnten nicht geladen werden.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setProfileData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, type, checked } = e.target;

    setClientsSettings((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : e.target.value,
    }));
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
        .eq('client_id', user.id);

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

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);

    try {
      if (!user) {
        throw new Error('Kein Benutzer angemeldet');
      }

      // Wenn eine ID existiert, update verwenden, sonst insert
      if (clientsSettings.id) {
        const { error } = await supabase
          .from('clients_settings')
          .update({
            language: clientsSettings.language,
            notification_live_call: clientsSettings.notification_live_call,
            notification_learn_reminders:
              clientsSettings.notification_learn_reminders,
            notification_feature_updates:
              clientsSettings.notification_feature_updates,
          })
          .eq('id', clientsSettings.id);

        if (error) throw error;
      }

      setMessage({
        type: 'success',
        text: 'Einstellungen erfolgreich aktualisiert!',
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: unknown) {
      console.error('Fehler beim Aktualisieren der Einstellungen:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Ein Fehler ist aufgetreten.',
      });
    } finally {
      setSettingsLoading(false);
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
        <Alert
          className={`mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}
        >
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs
        defaultValue='profile'
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full'
      >
        <TabsList className='grid w-full grid-cols-3 mb-8'>
          <TabsTrigger value='profile'>Profildaten</TabsTrigger>
          <TabsTrigger value='settings'>Einstellungen</TabsTrigger>
          <TabsTrigger value='password'>Passwort ändern</TabsTrigger>
        </TabsList>

        <TabsContent value='profile'>
          <form onSubmit={handleProfileSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='user_name'>Benutzername</Label>
              <Input
                id='user_name'
                value={profileData.user_name}
                onChange={handleProfileChange}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>E-Mail</Label>
              <Input
                id='email'
                type='email'
                value={profileData.email}
                disabled
                className='bg-muted'
              />
              <p className='text-xs text-muted-foreground'>
                E-Mail kann nicht geändert werden
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='first_name'>Vorname</Label>
                <Input
                  id='first_name'
                  value={profileData.first_name}
                  onChange={handleProfileChange}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='last_name'>Nachname</Label>
                <Input
                  id='last_name'
                  value={profileData.last_name}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='gender'>Geschlecht</Label>
              <Select
                value={profileData.gender || undefined}
                onValueChange={(value) =>
                  setProfileData((prev) => ({ ...prev, gender: value }))
                }
              >
                <SelectTrigger id='gender'>
                  <SelectValue placeholder='Bitte wählen' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Bitte wählen</SelectItem>
                  <SelectItem value='male'>Männlich</SelectItem>
                  <SelectItem value='female'>Weiblich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-center justify-between pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push('/')}
              >
                Zurück zum Dashboard
              </Button>

              <Button type='submit' disabled={profileLoading}>
                {profileLoading ? 'Speichert...' : 'Profil speichern'}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value='settings'>
          <form onSubmit={handleSettingsSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='language'>Sprache</Label>
              <Select
                value={clientsSettings.language}
                onValueChange={(value) =>
                  setClientsSettings((prev) => ({ ...prev, language: value }))
                }
              >
                <SelectTrigger id='language'>
                  <SelectValue placeholder='Sprache wählen' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='de'>Deutsch</SelectItem>
                  <SelectItem value='en'>Englisch</SelectItem>
                  <SelectItem value='tr'>Türkisch</SelectItem>
                  <SelectItem value='ar'>Arabisch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-4'>
              <h3 className='font-medium'>Benachrichtigungen</h3>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='notification_live_call'
                  checked={clientsSettings.notification_live_call}
                  onCheckedChange={(checked) =>
                    setClientsSettings((prev) => ({
                      ...prev,
                      notification_live_call: checked as boolean,
                    }))
                  }
                />
                <Label
                  htmlFor='notification_live_call'
                  className='cursor-pointer'
                >
                  Live-Anrufe und Veranstaltungen
                </Label>
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='notification_learn_reminders'
                  checked={clientsSettings.notification_learn_reminders}
                  onCheckedChange={(checked) =>
                    setClientsSettings((prev) => ({
                      ...prev,
                      notification_learn_reminders: checked as boolean,
                    }))
                  }
                />
                <Label
                  htmlFor='notification_learn_reminders'
                  className='cursor-pointer'
                >
                  Lern-Erinnerungen
                </Label>
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='notification_feature_updates'
                  checked={clientsSettings.notification_feature_updates}
                  onCheckedChange={(checked) =>
                    setClientsSettings((prev) => ({
                      ...prev,
                      notification_feature_updates: checked as boolean,
                    }))
                  }
                />
                <Label
                  htmlFor='notification_feature_updates'
                  className='cursor-pointer'
                >
                  Neue Funktionen und Updates
                </Label>
              </div>
            </div>

            <div className='flex items-center justify-between pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push('/')}
              >
                Zurück zum Dashboard
              </Button>

              <Button type='submit' disabled={settingsLoading}>
                {settingsLoading ? 'Speichert...' : 'Einstellungen speichern'}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value='password'>
          <form onSubmit={handlePasswordSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='password'>Neues Passwort</Label>
              <Input
                id='password'
                type='password'
                value={passwordData.password}
                onChange={handlePasswordChange}
                minLength={6}
                required
              />
              <p className='text-xs text-muted-foreground'>
                Mindestens 6 Zeichen
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Passwort bestätigen</Label>
              <Input
                id='confirmPassword'
                type='password'
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className='flex items-center justify-between pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push('/')}
              >
                Zurück zum Dashboard
              </Button>

              <Button type='submit' disabled={passwordLoading}>
                {passwordLoading ? 'Wird geändert...' : 'Passwort ändern'}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
