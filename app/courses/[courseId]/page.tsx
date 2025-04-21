'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LockIcon, CheckIcon, PlayIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCourseStore } from '@/store/course-store';

export default function CourseModulesPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { course, isLoading, error, fetchCourse } = useCourseStore();

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  if (isLoading) {
    return (
      <div className='p-6'>
        <div className='flex items-center mb-6'>
          <Link href='/courses' className='text-[#4AA4DE] hover:underline mr-2'>
            &larr; Zurück zu den Kursen
          </Link>
        </div>
        <div className='space-y-4'>
          <Skeleton className='h-12 w-1/2' />
          <Skeleton className='h-6 w-3/4' />
          <Skeleton className='h-64 w-full' />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='flex items-center mb-6'>
          <Link href='/courses' className='text-[#4AA4DE] hover:underline mr-2'>
            &larr; Zurück zu den Kursen
          </Link>
        </div>
        <div className='text-red-500 text-center py-4'>{error}</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className='p-6'>
        <div className='flex items-center mb-6'>
          <Link href='/courses' className='text-[#4AA4DE] hover:underline mr-2'>
            &larr; Zurück zu den Kursen
          </Link>
        </div>
        <div className='text-gray-500 text-center py-4'>
          Kurs nicht gefunden
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='flex items-center mb-6'>
        <Link href='/courses' className='text-[#4AA4DE] hover:underline mr-2'>
          &larr; Zurück zu den Kursen
        </Link>
      </div>

      <h1 className='text-2xl font-bold mb-1'>{course.title}</h1>
      <p className='mb-6 text-gray-600'>{course.description}</p>

      {/* Gesamtfortschritt für den Kurs */}
      <div className='mb-6'>
        <div className='flex justify-between mb-1'>
          <span className='text-sm font-semibold'>Gesamtfortschritt</span>
          <span className='text-sm font-medium'>
            {course.completion_percent || 0}%
          </span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2.5'>
          <div
            className='bg-[#4AA4DE] h-2.5 rounded-full'
            style={{ width: `${course.completion_percent || 0}%` }}
          ></div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {course?.modules?.map((module) => (
          <div
            key={module.id}
            className={`border ${
              module.unlocked
                ? module.completed
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200'
                : 'border-gray-200 bg-gray-50 opacity-75'
            } rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md`}
          >
            <div className='relative'>
              <div
                className='aspect-video bg-cover bg-center'
                style={{
                  backgroundImage: module.thumbnail
                    ? `url(${module.thumbnail})`
                    : 'linear-gradient(to bottom right, #4AA4DE, #3993CD)',
                }}
              >
                {!module.thumbnail && (
                  <div className='flex items-center justify-center h-full'>
                    <div className='text-white text-4xl font-bold'>QSK</div>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              {module.completed ? (
                <div className='absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full'>
                  Abgeschlossen
                </div>
              ) : module.unlocked ? (
                <div className='absolute top-2 right-2 bg-[#4AA4DE] text-white text-xs px-2 py-1 rounded-full'>
                  Verfügbar
                </div>
              ) : (
                <div className='absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full'>
                  Gesperrt
                </div>
              )}

              {/* Play Button oder Lock Icon */}
              <div className='absolute inset-0 flex items-center justify-center'>
                {module.unlocked ? (
                  <div className='rounded-full bg-white/80 p-3 shadow-md hover:bg-white transition-colors'>
                    <PlayIcon className='h-8 w-8 text-[#4AA4DE]' />
                  </div>
                ) : (
                  <div className='rounded-full bg-gray-200/80 p-3'>
                    <LockIcon className='h-8 w-8 text-gray-500' />
                  </div>
                )}
              </div>
            </div>

            <div className='p-4'>
              <h3 className='font-medium mb-1 truncate'>{module.title}</h3>
              <p className='text-sm text-gray-500 mb-4'>{module.description}</p>

              {/* Modul-Fortschritt */}
              <div className='mb-4'>
                <div className='flex justify-between mb-1'>
                  <span className='text-sm font-medium'>Fortschritt</span>
                  <span className='text-sm font-medium'>
                    {module.completion_percent || 0}%
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-[#4AA4DE] h-2 rounded-full'
                    style={{ width: `${module.completion_percent || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className='mt-4'>
                {module.unlocked ? (
                  <Button
                    onClick={() =>
                      router.push(`/courses/${courseId}/modules/${module.id}`)
                    }
                    className='w-full'
                    variant={module.completed ? 'outline' : 'default'}
                  >
                    {module.completed ? 'Wiederholen' : 'Ansehen'}
                  </Button>
                ) : (
                  <Button className='w-full' variant='outline' disabled>
                    <LockIcon className='mr-2 h-4 w-4' />
                    Gesperrt
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {course?.completed && (
        <div className='mt-8 p-4 bg-green-50 border border-green-200 rounded-md text-center'>
          <CheckIcon className='mx-auto h-12 w-12 text-green-500 mb-2' />
          <h3 className='text-xl font-bold text-green-700 mb-2'>
            Glückwunsch!
          </h3>
          <p className='text-green-700'>
            Du hast diesen Kurs vollständig abgeschlossen.
          </p>
        </div>
      )}
    </div>
  );
}
