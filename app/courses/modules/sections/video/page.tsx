'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LockIcon, CheckIcon, PlayIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCourseStore } from '@/store/course-store';
import { VideoPlayer } from '@/components/video-player';
import { markVideoAsCompleted } from '@/app/actions';

export default function VideoPage() {
  const router = useRouter();
  const { currentCourse, isLoading, error, fetchCourses } = useCourseStore();

  useEffect(() => {
    fetchCourses();
  }, []);

  if (isLoading) {
    return (
      <div className='p-6'>
        <div className='flex items-center mb-6'>
          <Link
            href='/courses/modules/sections'
            className='text-[#4AA4DE] hover:underline mr-2'
          >
            &larr; Zurück zu den Sections
          </Link>
        </div>
        <div className='space-y-4'>
          <Skeleton className='h-12 w-1/2' />
          <Skeleton className='h-6 w-3/4' />
          <Skeleton className='aspect-video w-full' />
        </div>
      </div>
    );
  }

  if (error || !currentCourse) {
    return (
      <div className='p-6'>
        <div className='flex items-center mb-6'>
          <Link
            href='/courses/modules/sections'
            className='text-[#4AA4DE] hover:underline mr-2'
          >
            &larr; Zurück zu den Sections
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
            href='/courses/modules/sections'
            className='text-[#4AA4DE] hover:underline mr-2'
          >
            &larr; Zurück zu den Sections
          </Link>
        </div>
        <div className='text-gray-500 text-center py-4'>
          Modul nicht gefunden
        </div>
      </div>
    );
  }

  const currentSection = currentModule.sections.find(
    (s) => s.id === currentModule.currentSectionId
  );

  if (!currentSection) {
    return (
      <div className='p-6'>
        <div className='flex items-center mb-6'>
          <Link
            href='/courses/modules/sections'
            className='text-[#4AA4DE] hover:underline mr-2'
          >
            &larr; Zurück zu den Sections
          </Link>
        </div>
        <div className='text-gray-500 text-center py-4'>
          Section nicht gefunden
        </div>
      </div>
    );
  }

  const currentVideo = currentSection.videos.find(
    (v) => v.id === currentSection.currentVideoId
  );

  if (!currentVideo) {
    return (
      <div className='p-6'>
        <div className='flex items-center mb-6'>
          <Link
            href='/courses/modules/sections'
            className='text-[#4AA4DE] hover:underline mr-2'
          >
            &larr; Zurück zu den Sections
          </Link>
        </div>
        <div className='text-gray-500 text-center py-4'>
          Video nicht gefunden
        </div>
      </div>
    );
  }

  const handleVideoComplete = async () => {
    try {
      await markVideoAsCompleted(currentVideo.id);
      // Aktualisiere den Store nach dem Abschließen des Videos
      fetchCourses();
    } catch (error) {
      console.error(
        'Fehler beim Markieren des Videos als abgeschlossen:',
        error
      );
    }
  };

  return (
    <div className='p-6'>
      <div className='flex items-center mb-6'>
        <Link
          href='/courses/modules/sections'
          className='text-[#4AA4DE] hover:underline mr-2'
        >
          &larr; Zurück zu den Sections
        </Link>
      </div>

      {/* Video Header */}
      <div className='mb-8'>
        <h1 className='text-2xl font-bold mb-2'>{currentVideo.title}</h1>
        <p className='text-gray-600'>{currentVideo.description}</p>
      </div>

      {/* Video Player */}
      <div className='mb-8'>
        <VideoPlayer
          videoId={currentVideo.vimeo_id || ''}
          onComplete={handleVideoComplete}
          className='w-full'
        />
      </div>

      {/* Navigation Buttons */}
      <div className='flex justify-between mt-8'>
        <Button
          onClick={() => router.push('/courses/modules/sections')}
          variant='outline'
        >
          Zurück zu den Sections
        </Button>
        {currentVideo.exercise_id && (
          <Button
            onClick={() =>
              router.push(`/exercises/${currentVideo.exercise_id}`)
            }
            variant='default'
          >
            Zu den Übungen
          </Button>
        )}
      </div>
    </div>
  );
}
