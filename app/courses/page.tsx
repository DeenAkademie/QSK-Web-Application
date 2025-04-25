'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCourseStore } from '@/store/course-store';

export default function CoursesPage() {
  const router = useRouter();
  const { courses, isLoading, error, fetchCourses, setCurrentCourse } =
    useCourseStore();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCourseClick = (courseId: string) => {
    setCurrentCourse(courseId);
    router.push('/courses/modules');
  };

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
                Array.from({ length: 3 }).map((_, index) => (
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
              ) : courses && courses.length > 0 ? (
                courses.map((course) => (
                  <div
                    key={course.id}
                    className='border border-gray-200 rounded-lg overflow-hidden'
                  >
                    <div className='relative'>
                      <div
                        className='aspect-video bg-cover bg-center'
                        style={{
                          backgroundImage: course.thumbnail
                            ? `url(${course.thumbnail})`
                            : 'linear-gradient(to bottom right, #4AA4DE, #3993CD)',
                        }}
                      >
                        {!course.thumbnail && (
                          <div className='flex items-center justify-center h-full'>
                            <div className='text-white text-4xl font-bold'>
                              QSK
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Kurs-Fortschritt Badge */}
                      {course.completed ? (
                        <div className='absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full'>
                          Abgeschlossen
                        </div>
                      ) : (
                        <div className='absolute top-2 right-2 bg-[#4AA4DE] text-white text-xs px-2 py-1 rounded-full'>
                          {course.completion_percent || 0}% Fortschritt
                        </div>
                      )}
                    </div>

                    <div className='p-4'>
                      <h2 className='text-lg font-medium'>{course.title}</h2>
                      <p className='text-gray-500 text-sm mt-1'>
                        {course.description}
                      </p>

                      {/* Kurs-Fortschritt */}
                      <div className='mt-4 mb-4'>
                        <div className='flex justify-between mb-1'>
                          <span className='text-sm font-medium'>
                            Fortschritt
                          </span>
                          <span className='text-sm font-medium'>
                            {course.completion_percent || 0}%
                          </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-[#4AA4DE] h-2 rounded-full'
                            style={{
                              width: `${course.completion_percent || 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleCourseClick(course.id)}
                        className='w-full bg-[#4AA4DE] hover:bg-[#3993CD] text-white'
                      >
                        {course.completed ? 'Wiederholen' : 'Kurs starten'}
                      </Button>
                    </div>
                  </div>
                ))
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
