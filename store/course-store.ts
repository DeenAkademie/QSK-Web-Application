import { create } from "zustand";
import { getUserCoursesData } from "@/app/actions";

interface Section {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  unlocked: boolean;
  completed: boolean;
  completion_percent: number;
  currentVideoId?: string;
  videos: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    unlocked: boolean;
    completed: boolean;
    completion_percent: number;
    vimeo_id?: string;
    exercise_id?: string;
  }[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  sections: Section[];
  unlocked: boolean;
  completed: boolean;
  completion_percent: number;
  currentSectionId?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  modules: Module[];
  completed: boolean;
  completion_percent: number;
  currentModuleId?: string;
}

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  fetchCourses: () => Promise<void>;
  setCurrentCourse: (courseId: string) => void;
  setCurrentModuleId: (moduleId: string) => void;
  setCurrentSectionId: (sectionId: string) => void;
  setCurrentVideoId: (videoId: string) => void;
  markVideoAsCompleted: (videoId: string) => Promise<void>;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  currentCourse: null,
  isLoading: false,
  error: null,
  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const { courses, error } = await getUserCoursesData();
      if (error) {
        set({ error, isLoading: false });
      } else {
        set({ courses: courses as any[], isLoading: false });
        localStorage.setItem('courseData', JSON.stringify(courses));
      }
    } catch (err) {
      set({ error: "Fehler beim Laden der Kurse", isLoading: false });
      console.error("Error loading courses:", err);
    }
  },
  setCurrentCourse: (courseId: string) => {
    set((state) => {
      const course = state.courses.find((c) => c.id === courseId);
      const updatedState = {
        ...state,
        currentCourse: course || null,
      };
      localStorage.setItem('courseState', JSON.stringify(updatedState));
      return updatedState;
    });
  },
  setCurrentModuleId: (moduleId: string) => {
    set((state) => {
      if (!state.currentCourse) return state;
      const updatedState = {
        ...state,
        currentCourse: {
          ...state.currentCourse,
          currentModuleId: moduleId,
        },
      };
      localStorage.setItem('courseState', JSON.stringify(updatedState));
      return updatedState;
    });
  },
  setCurrentSectionId: (sectionId: string) => {
    set((state) => {
      if (!state.currentCourse) return state;
      const currentModule = state.currentCourse.modules.find(
        (m) => m.id === state.currentCourse.currentModuleId
      );
      if (!currentModule) return state;

      const updatedState = {
        ...state,
        currentCourse: {
          ...state.currentCourse,
          modules: state.currentCourse.modules.map((m) =>
            m.id === currentModule.id
              ? { ...m, currentSectionId: sectionId }
              : m
          ),
        },
      };
      localStorage.setItem('courseState', JSON.stringify(updatedState));
      return updatedState;
    });
  },
  setCurrentVideoId: (videoId: string) => {
    set((state) => {
      if (!state.currentCourse) return state;
      const currentModule = state.currentCourse.modules.find(
        (m) => m.id === state.currentCourse.currentModuleId
      );
      if (!currentModule) return state;

      const currentSection = currentModule.sections.find(
        (s) => s.id === currentModule.currentSectionId
      );
      if (!currentSection) return state;

      const updatedState = {
        ...state,
        currentCourse: {
          ...state.currentCourse,
          modules: state.currentCourse.modules.map((m) =>
            m.id === currentModule.id
              ? {
                  ...m,
                  sections: m.sections.map((s) =>
                    s.id === currentSection.id
                      ? { ...s, currentVideoId: videoId }
                      : s
                  ),
                }
              : m
          ),
        },
      };
      localStorage.setItem('courseState', JSON.stringify(updatedState));
      return updatedState;
    });
  },
  markVideoAsCompleted: async (videoId: string) => {
    set((state) => {
      if (!state.currentCourse) return state;

      const updatedModules = state.currentCourse.modules.map((module) => {
        const updatedSections = module.sections.map((section) => {
          const updatedVideos = section.videos.map((video) => {
            if (video.id === videoId) {
              return { ...video, completed: true, completion_percent: 100 };
            }
            return video;
          });

          // Update section progress
          const completedVideos = updatedVideos.filter((v) => v.completed).length;
          const totalVideos = updatedVideos.length;
          const completionPercent = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

          // Unlock next video if previous is completed
          updatedVideos.forEach((video, index) => {
            if (index > 0) {
              video.unlocked = updatedVideos[index - 1].completed;
            }
          });

          return {
            ...section,
            completed: completionPercent === 100,
            completion_percent: completionPercent,
            videos: updatedVideos,
          };
        });

        // Update module progress
        const completedSections = updatedSections.filter((s) => s.completed).length;
        const totalSections = updatedSections.length;
        const completionPercent = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

        // Unlock next section if previous is completed
        updatedSections.forEach((section, index) => {
          if (index > 0) {
            section.unlocked = updatedSections[index - 1].completed;
          }
        });

        return {
          ...module,
          completed: completionPercent === 100,
          completion_percent: completionPercent,
          sections: updatedSections,
        };
      });

      // Update course progress
      const completedModules = updatedModules.filter((m) => m.completed).length;
      const totalModules = updatedModules.length;
      const courseCompletionPercent = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

      // Update both currentCourse and courses array
      const updatedCourse = {
        ...state.currentCourse,
        completed: courseCompletionPercent === 100,
        completion_percent: courseCompletionPercent,
        modules: updatedModules,
      };

      return {
        ...state,
        currentCourse: updatedCourse,
        courses: state.courses.map((c) =>
          c.id === updatedCourse.id ? updatedCourse : c
        ),
      };
    });
  },
}));

if (typeof window !== 'undefined') {
  const savedState = localStorage.getItem('courseState');
  const savedCourses = localStorage.getItem('courseData');
  
  if (savedState) {
    const parsedState = JSON.parse(savedState);
    useCourseStore.setState(parsedState);
  }
  
  if (savedCourses) {
    const parsedCourses = JSON.parse(savedCourses);
    useCourseStore.setState({ courses: parsedCourses });
  }
}
