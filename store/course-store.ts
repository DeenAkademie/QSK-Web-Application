import { create } from "zustand";
import { getUserCourseData } from "@/app/actions";

interface Section {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  unlocked: boolean;
  completed: boolean;
  completion_percent: number;
  videos: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    unlocked: boolean;
    completed: boolean;
    completion_percent: number;
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
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  modules: Module[];
  completed: boolean;
  completion_percent: number;
}

interface CourseState {
  course: Course | null;
  isLoading: boolean;
  error: string | null;
  fetchCourse: (moduleId?: string) => Promise<void>;
}

export const useCourseStore = create<CourseState>((set) => ({
  course: null,
  isLoading: false,
  error: null,
  fetchCourse: async (moduleId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { course, error } = await getUserCourseData(moduleId);
      if (error) {
        set({ error, isLoading: false });
      } else {
        set({ course: course as any, isLoading: false });
      }
    } catch (err) {
      set({ error: "Fehler beim Laden der Kurse", isLoading: false });
      console.error("Error loading courses:", err);
    }
  },
}));
