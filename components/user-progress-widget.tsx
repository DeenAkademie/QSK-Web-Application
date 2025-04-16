'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import {
  getLessonStructureMaxExercisesCount,
  getProfileAction,
} from '@/app/actions';
import { useRouter } from 'next/navigation';

interface ClientsLessonState {
  id?: string;
  client_id: string;
  lesson_no: number;
  exercise_no: number;
  exercise_passed_count: number;
  hasanat_counter: number;
}

export function UserProgressWidget() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lessonProgressPercent, setLessonProgressPercent] = useState(0);
  const [message, setMessage] = useState<{ type: string; text: string }>({
    type: '',
    text: '',
  });
  const [clientsLessonState, setClientsLessonState] =
    useState<ClientsLessonState | null>(null);

  // Berechne den Fortschritt in Prozent

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Server Action für Profildaten verwenden
        const profileDataResponse = await getProfileAction();

        // Beispiel für die Verwendung
        const exercisesCount = await getLessonStructureMaxExercisesCount(
          profileDataResponse.lesson_state.lesson_no
        );

        // Profildaten aus dem Client-Objekt extrahieren
        if (profileDataResponse.lesson_state) {
          setClientsLessonState({
            ...profileDataResponse.lesson_state,
            client_id: profileDataResponse.user.id,
          });

          const lessonProgressPercent =
            ((profileDataResponse.lesson_state.exercise_no - 1) /
              exercisesCount) *
            100;

          setLessonProgressPercent(lessonProgressPercent);
        } else {
          // Defaults setzen mit der user ID, falls keine Settings existieren
          setClientsLessonState({
            client_id: profileDataResponse.user.id,
            lesson_no: 1,
            exercise_no: 1,
            exercise_passed_count: 0,
            hasanat_counter: 0,
          });
        }
      } catch (error) {
        console.error('Fehler beim Laden des Fortschritts:', error);
        setMessage({
          type: 'error',
          text: 'Benutzer Fortschritt konnten nicht geladen werden.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // Lade-Zustand anzeigen
  if (loading || !clientsLessonState) {
    return <ProgressWidgetSkeleton />;
  }

  return (
    <Card className='w-full shadow-md border-0'>
      <CardHeader className='pb-2 border-b'>
        <CardTitle className='text-xl font-semibold'>
          Deine letzte Übung
        </CardTitle>
      </CardHeader>
      <CardContent className='p-6'>
        <div className='grid grid-cols-3 gap-6 mb-6'>
          <div className='bg-slate-50 rounded-xl p-4 text-center shadow-sm'>
            <p className='text-3xl font-bold text-primary'>
              {clientsLessonState.lesson_no}
            </p>
            <p className='text-sm text-slate-600 mt-1'>Aktuelle Lektion</p>
          </div>
          <div className='bg-slate-50 rounded-xl p-4 text-center shadow-sm'>
            <p className='text-3xl font-bold text-primary'>
              {clientsLessonState.exercise_no}
            </p>
            <p className='text-sm text-slate-600 mt-1'>Aktuelle Übung</p>
          </div>
          <div className='bg-slate-50 rounded-xl p-4 text-center shadow-sm'>
            <p className='text-3xl font-bold text-primary'>
              {clientsLessonState.exercise_passed_count}
            </p>
            <p className='text-sm text-slate-600 mt-1'>Abgeschlossen</p>
          </div>
        </div>

        <div className='space-y-2 mb-6'>
          <div className='flex justify-between text-sm'>
            <span className='font-medium'>Gesamtfortschritt</span>
            <span className='font-medium text-primary'>
              {Math.round(lessonProgressPercent)}%
            </span>
          </div>
          <Progress
            value={lessonProgressPercent}
            className='h-3 rounded-full bg-slate-100'
          />
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='bg-amber-100 p-1.5 rounded-full'>
              <Image
                src='/img/coins-stack.svg'
                alt='Hasanat'
                width={24}
                height={24}
                className='h-6 w-6'
              />
            </div>
            <span className='font-medium text-slate-800'>
              {clientsLessonState.hasanat_counter} Hasanat
            </span>
          </div>
          <Button
            className='bg-primary hover:bg-primary/90 text-white px-6 rounded-full'
            asChild
          >
            <Link href='/lektionen'>Weiter lernen</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton-Komponente für den Ladezustand
function ProgressWidgetSkeleton() {
  return (
    <Card className='w-full shadow-md border-0'>
      <CardHeader className='pb-2 border-b'>
        <Skeleton className='h-6 w-48' />
      </CardHeader>
      <CardContent className='p-6'>
        <div className='grid grid-cols-3 gap-6 mb-6'>
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className='bg-slate-50 rounded-xl p-4 text-center shadow-sm'
            >
              <Skeleton className='h-8 w-16 mx-auto mb-2' />
              <Skeleton className='h-4 w-24 mx-auto' />
            </div>
          ))}
        </div>
        <div className='space-y-2 mb-6'>
          <div className='flex justify-between'>
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-4 w-12' />
          </div>
          <Skeleton className='h-3 w-full' />
        </div>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-9 w-9 rounded-full' />
            <Skeleton className='h-5 w-32' />
          </div>
          <Skeleton className='h-9 w-32 rounded-full' />
        </div>
      </CardContent>
    </Card>
  );
}
