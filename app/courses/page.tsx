'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useCourseStore } from '@/store/course-store';

export default function CoursesPage() {
  const { course, isLoading, error, fetchCourse } = useCourseStore();

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  return (
    <div className='p-6'>
      <div className='flex items-center mb-6'>
        <Link href='/' className='text-[#4AA4DE] hover:underline mr-2'>
          &larr; Zurück zum Dashboard
        </Link>
      </div>

      <h1 className='text-2xl font-bold mb-1'>Deine Kurse</h1>
      <p className='text-gray-500 mb-6'>
        Wähle einen Kurs aus, um mit dem Lernen zu beginnen
      </p>

      <div>
        <div className='bg-[#4AA4DE] text-white p-3 rounded-t-lg'>
          Verfügbare Kurse
        </div>
        <div className='border border-gray-200 rounded-b-lg p-6'>
          {error ? (
            <div className='text-red-500 text-center py-4'>{error}</div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {isLoading ? (
                Array.from({ length: 1 }).map((_, index) => (
                  <div
                    key={index}
                    className='border border-gray-200 rounded-lg'
                  >
                    <Skeleton className='h-[180px] w-full rounded-t-lg' />
                    <div className='p-4'>
                      <Skeleton className='h-6 w-3/4 mb-2' />
                      <Skeleton className='h-4 w-1/2 mb-4' />
                      <Skeleton className='h-10 w-full' />
                    </div>
                  </div>
                ))
              ) : course ? (
                <div className='border border-gray-200 rounded-lg overflow-hidden'>
                  <div className='relative'>
                    <div className='aspect-video bg-gradient-to-br from-[#4AA4DE] to-[#3993CD] flex items-center justify-center'>
                      <div className='text-white text-4xl font-bold'>QSK</div>
                    </div>
                  </div>
                  <div className='p-4'>
                    <h2 className='text-lg font-medium'>{course.title}</h2>
                    <p className='text-gray-500 text-sm mt-1'>
                      {course.description}
                    </p>
                    <Button
                      asChild
                      className='w-full mt-3 bg-[#4AA4DE] hover:bg-[#3993CD] text-white'
                    >
                      <Link href={`/courses/${course.id}`}>Kurs starten</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='text-gray-500 text-center py-4'>
                  Keine Kurse verfügbar
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
