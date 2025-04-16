'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { getProfileAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

// Define the badge and plan types to avoid using 'any'
interface Badge {
  id: string | number;
  title: string;
  svg?: string;
}

interface Plan {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_days: number | null;
  features: string[] | null;
}

interface ClientData {
  auth_id: string;
  user_name: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  role?: string;
  is_active?: boolean;
  updated_at?: string;
  plan_id?: string;
  plan?: Plan;
}

interface ClientLessonState {
  id?: string;
  user_id: string;
  current_lesson?: number;
  completed_lessons?: number[];
  progress?: number;
  hasanat_counter?: number;
  last_activity_date?: string;
}

export function ProfileSidebar() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [lessonState, setLessonState] = useState<ClientLessonState | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch user profile data from the server action
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isAuthenticated || !user || authLoading) return;

      try {
        setIsLoading(true);

        // Server-Action aufrufen, die RLS-Beschränkungen umgeht
        console.log('Rufe serverseitige Profile-Action auf...');
        const profileData = await getProfileAction();

        console.log('Profildaten erhalten:', profileData);

        if (profileData.client) {
          setClientData({
            ...profileData.client,
            plan: profileData.plan,
          });
        }

        if (profileData.lesson_state) {
          setLessonState(profileData.lesson_state);
        }
      } catch (e) {
        console.error('Fehler beim Laden der Profildaten:', e);
        setError('Fehler beim Laden des Profils');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user, isAuthenticated, authLoading, router]);

  // Show loading skeleton while fetching data
  if (isLoading || authLoading) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-100 p-6'>
        <div className='flex flex-col items-center'>
          <div className='relative mb-4'>
            <Skeleton className='w-20 h-20 rounded-full' />
          </div>
          <Skeleton className='h-6 w-32 mb-1' />
          <Skeleton className='h-4 w-24 mb-6' />
        </div>
        <div className='space-y-4'>
          <Skeleton className='h-16 w-full rounded-lg' />
          <Skeleton className='h-16 w-full rounded-lg' />
          <Skeleton className='h-32 w-full rounded-lg' />
        </div>
      </div>
    );
  }

  // Show error message if fetching failed
  if (error || !clientData) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-100 p-6'>
        <div className='text-center'>
          <p className='text-red-500'>
            {error || 'Profil konnte nicht geladen werden'}
          </p>
        </div>
      </div>
    );
  }

  // Get the correct avatar URL or fallback to placeholder
  const avatarSrc = clientData.first_name
    ? `/img/avatar-placeholder.svg`
    : '/img/avatar-placeholder.svg';

  // Format member_since based on user creation date
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('de-DE', {
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('de-DE', {
        month: 'long',
        year: 'numeric',
      });

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-100 p-6'>
      <div className='flex flex-col items-center'>
        <div className='relative mb-4'>
          <div className='w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden'>
            <Image
              src={avatarSrc}
              alt='Profil'
              width={60}
              height={60}
              className='rounded-full'
            />
          </div>
          <Link
            href='/profile'
            aria-label='Profil bearbeiten'
            prefetch={true}
            scroll={false}
          >
            <div className='absolute -bottom-2 -right-2 bg-[#4AA4DE] rounded-full p-1.5 cursor-pointer transition-transform hover:scale-110 hover:shadow-md'>
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'
                  fill='white'
                />
              </svg>
            </div>
          </Link>
        </div>
        <h2 className='text-xl font-bold mb-1'>
          {clientData.first_name || clientData.user_name}
        </h2>
        <p className='text-gray-500 text-sm mb-6'>@{clientData.user_name}</p>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
              <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path d='M12 2L1 21h22L12 2z' fill='#4AA4DE' />
              </svg>
            </div>
            <div>
              <p className='font-medium'>
                {clientData.plan?.title || 'Quran LeseHack'}
              </p>
              <p className='text-xs text-gray-500'>Aktueller Kurs</p>
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
              <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z'
                  fill='#4AA4DE'
                />
              </svg>
            </div>
            <div>
              <p className='font-medium'>{memberSince}</p>
              <p className='text-xs text-gray-500'>Mitglied seit</p>
            </div>
          </div>
        </div>

        {/* Hasanat Counter Box */}
        <div
          className='rounded-lg p-4 relative overflow-hidden'
          style={{
            backgroundImage: 'url("/hasanat-counter.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className='flex items-center justify-between relative z-10'>
            <div>
              <p className='text-white text-sm font-medium mb-1'>
                Deine Hasanat
              </p>
              <p className='text-white text-2xl font-bold'>
                {lessonState?.hasanat_counter || 0}
              </p>
            </div>
            <div className='relative w-16 h-16'>
              <Image
                src='/img/coins-stack.svg'
                alt='Hasanat Münzen'
                width={64}
                height={64}
                className='object-contain'
              />
            </div>
          </div>
          <div className='mt-3 pt-3 border-t border-blue-300/30 relative z-10'>
            <div className='flex justify-between items-center'>
              <p className='text-white text-xs'>Heute gesammelt</p>
              <p className='text-white text-sm font-bold'>+{0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
