'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LockIcon, CheckIcon, PlayIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCourseStore } from '@/store/course-store';

export default function ModuleSectionsPage() {
  const router = useRouter();
  const { currentCourse, isLoading, error, fetchCourses } = useCourseStore();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (isLoading) {
    return (
      <div className='p-6'>
        <div className='flex items-center mb-6'>
          <Link
            href='/courses/modules'
            className='text-[#4AA4DE] hover:underline mr-2'
          >
            &larr; Zurück zu den Modulen
          </Link>
        </div>
        <div className='space-y-4'>
          <Skeleton className='h-12 w-1/2' />
          <Skeleton className='h-6 w-3/4' />
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-64 w-full' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentCourse) {
    return (
      <div className='p-6'>
        <div className='flex items-center mb-6'>
          <Link
            href='/courses/modules'
            className='text-[#4AA4DE] hover:underline mr-2'
          >
            &larr; Zurück zu den Modulen
          </Link>
        </div>
        <div className='text-red-500 text-center py-4'>{error}</div>
      </div>
    );
  }

  const currentModule = currentCourse.modules.find(
    (m) => m.id === currentCourse.currentModuleId
  );

  if (!currentModule) {
    return (
      <div className='p-6'>
        <div className='flex items-center mb-6'>
          <Link
            href='/courses/modules'
            className='text-[#4AA4DE] hover:underline mr-2'
          >
            &larr; Zurück zu den Modulen
          </Link>
        </div>
        <div className='text-gray-500 text-center py-4'>
          Modul nicht gefunden
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='flex items-center mb-6'>
        <Link
          href='/courses/modules'
          className='text-[#4AA4DE] hover:underline mr-2'
        >
          &larr; Zurück zu den Modulen
        </Link>
      </div>

      {/* Module Header */}
      <div className='mb-8'>
        <h1 className='text-2xl font-bold mb-2'>{currentModule.title}</h1>
        <p className='text-gray-600'>{currentModule.description}</p>

        {/* Module Progress */}
        <div className='mt-4'>
          <div className='flex justify-between mb-1'>
            <span className='text-sm font-medium'>Modul-Fortschritt</span>
            <span className='text-sm font-medium'>
              {currentModule.completion_percent || 0}%
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-[#4AA4DE] h-2 rounded-full'
              style={{ width: `${currentModule.completion_percent || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Sections List */}
      <div className='space-y-8'>
        {currentModule.sections?.map((section) => (
          <div key={section.id} className='border rounded-lg overflow-hidden'>
            {/* Section Header */}
            <div className='p-6 bg-gray-50 border-b'>
              <h2 className='text-xl font-bold mb-2'>{section.title}</h2>
              <p className='text-gray-600 mb-4'>{section.description}</p>

              {/* Section Progress */}
              <div className='flex justify-between mb-1'>
                <span className='text-sm font-medium'>Section-Fortschritt</span>
                <span className='text-sm font-medium'>
                  {section.completion_percent || 0}%
                </span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-[#4AA4DE] h-2 rounded-full'
                  style={{ width: `${section.completion_percent || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Videos Grid */}
            <div className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {section.videos?.map((video) => (
                  <div
                    key={video.id}
                    className={`border ${
                      video.unlocked
                        ? video.completed
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200'
                        : 'border-gray-200 bg-gray-50 opacity-75'
                    } rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md`}
                  >
                    <div className='relative'>
                      <div
                        className='aspect-video bg-cover bg-center'
                        style={{
                          backgroundImage: video.thumbnail
                            ? `url(${video.thumbnail})`
                            : 'linear-gradient(to bottom right, #4AA4DE, #3993CD)',
                        }}
                      >
                        {!video.thumbnail && (
                          <div className='flex items-center justify-center h-full'>
                            <div className='text-white text-4xl font-bold'>
                              QSK
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      {video.completed ? (
                        <div className='absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full'>
                          Abgeschlossen
                        </div>
                      ) : video.unlocked ? (
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
                        {video.unlocked ? (
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
                      <h3 className='font-medium mb-1 truncate'>
                        {video.title}
                      </h3>
                      <p className='text-sm text-gray-500 mb-4'>
                        {video.description}
                      </p>

                      {/* Video Progress */}
                      <div className='mb-4'>
                        <div className='flex justify-between mb-1'>
                          <span className='text-sm font-medium'>
                            Fortschritt
                          </span>
                          <span className='text-sm font-medium'>
                            {video.completion_percent || 0}%
                          </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-[#4AA4DE] h-2 rounded-full'
                            style={{
                              width: `${video.completion_percent || 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className='mt-4'>
                        {video.unlocked ? (
                          <Button
                            onClick={() =>
                              router.push(
                                `/courses/modules/sections/videos/${video.id}`
                              )
                            }
                            className='w-full'
                            variant={video.completed ? 'outline' : 'default'}
                          >
                            {video.completed ? 'Wiederholen' : 'Ansehen'}
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
            </div>
          </div>
        ))}
      </div>

      {currentModule.completed && (
        <div className='mt-8 p-4 bg-green-50 border border-green-200 rounded-md text-center'>
          <CheckIcon className='mx-auto h-12 w-12 text-green-500 mb-2' />
          <h3 className='text-xl font-bold text-green-700 mb-2'>
            Glückwunsch!
          </h3>
          <p className='text-green-700'>
            Du hast dieses Modul vollständig abgeschlossen.
          </p>
        </div>
      )}
    </div>
  );
}
