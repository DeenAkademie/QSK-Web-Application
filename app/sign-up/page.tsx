'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUpAction } from '@/app/actions';
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
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Interface für die standardisierte API-Antwort
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    timestamp: string;
    request_id?: string;
    operation?: string;
    [key: string]: any;
  };
}

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      setIsLoading(false);
      return;
    }

    try {
      // Formular-Daten für Server Action vorbereiten
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('gender', gender);

      // Server Action aufrufen
      const response = (await signUpAction(formData)) as ApiResponse;

      if (response.success && response.data) {
        // Bei Erfolg kurz Erfolgsmeldung anzeigen
        setSuccess(response.data.message || 'Registrierung erfolgreich!');

        // Formular zurücksetzen
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setGender('');

        // Nach kurzer Verzögerung zur Check-Email-Seite weiterleiten
        setTimeout(() => {
          router.push('/check-email');
        }, 1500);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      console.error('Registrierungsfehler:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Bei der Registrierung ist ein Fehler aufgetreten.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='flex justify-center items-center min-h-[calc(100vh-200px)] px-4 py-8'>
      <Card className='w-full max-w-md shadow-lg border-t-4 border-t-[#4AA4DE]'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Registrieren
          </CardTitle>
          <CardDescription className='text-center'>
            Erstelle ein Konto, um alle Features zu nutzen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>E-Mail*</Label>
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
              <Label htmlFor='password'>Passwort*</Label>
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
              <p className='text-xs text-gray-500'>
                Das Passwort muss mindestens 8 Zeichen lang sein.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>Vorname</Label>
                <Input
                  id='firstName'
                  name='firstName'
                  type='text'
                  placeholder='Max'
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className='w-full'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='lastName'>Nachname</Label>
                <Input
                  id='lastName'
                  name='lastName'
                  type='text'
                  placeholder='Mustermann'
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className='w-full'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='gender'>Geschlecht</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Bitte wählen' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='male'>Männlich</SelectItem>
                  <SelectItem value='female'>Weiblich</SelectItem>
                </SelectContent>
              </Select>
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
                  Wird registriert...
                </>
              ) : (
                'Registrieren'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex flex-col space-y-2'>
          <div className='text-center text-sm'>
            Bereits ein Konto?{' '}
            <Link
              href='/sign-in'
              className='text-[#4AA4DE] hover:text-[#3587BF] transition-colors font-medium'
            >
              Jetzt anmelden
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
