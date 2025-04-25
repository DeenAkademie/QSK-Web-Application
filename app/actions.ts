"use server";

import { encodedRedirect } from "@/utils/utils";
import { createAdminClient, createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Course } from "@/store/course-store";

// export Interface für die standardisierte API-Antwort
export interface ApiResponse<T = any> {
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

const SUPABASE_FUNCTIONS_URL = "http://localhost:54321/functions/v1";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return {
      success: false,
      error: "E-Mail und Passwort sind erforderlich",
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  try {
    // Erstelle Supabase-Client für Auth-Token
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!authToken) {
      console.error("Kein Auth-Token verfügbar für Edge-Function-Aufruf");
      return {
        success: false,
        error: "Authentifizierungsfehler",
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Bereite die Daten für die Edge Function vor
    const userData = {
      email,
      password,
      userName: email.split("@")[0], // Default username aus Email
      firstName: formData.get("firstName")?.toString() || null,
      lastName: formData.get("lastName")?.toString() || null,
      gender: formData.get("gender")?.toString() || null,
      role: "user",
    };

    console.log(
      "Rufe Edge Function auf:",
      `${SUPABASE_FUNCTIONS_URL}/create-user`,
    );

    try {
      // Rufe die Edge Function auf MIT Authorization-Header
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(userData),
      });

      console.log("Response Status:", response.status);

      // Parse die JSON-Antwort
      const responseData = await response.json() as ApiResponse;

      // Einfacher Check ob Success true ist
      if (responseData.success) {
        return {
          success: true,
          data: {
            message:
              "Vielen Dank für Ihre Registrierung! Bitte überprüfen Sie Ihre E-Mail für einen Bestätigungslink.",
            user: responseData.data?.user,
            client: responseData.data?.client,
          },
          meta: responseData.meta || {
            timestamp: new Date().toISOString(),
          },
        };
      } else {
        // Gib den Fehler zurück, wenn success false ist
        return {
          success: false,
          error: responseData.error || "Benutzererstellung fehlgeschlagen",
          meta: responseData.meta || {
            timestamp: new Date().toISOString(),
          },
        };
      }
    } catch (edgeError) {
      console.error("Edge Function Fehler:", edgeError);

      // Fallback zur direkten Supabase Auth API
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            userName: userData.userName,
            firstName: userData.firstName,
            lastName: userData.lastName,
            gender: userData.gender,
            role: userData.role,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }

      return {
        success: true,
        data: {
          message:
            "Vielen Dank für Ihre Registrierung! Bitte überprüfen Sie Ihre E-Mail für einen Bestätigungslink.",
          user: data.user,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    }
  } catch (error) {
    console.error("SignUp Error:", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Registrierung fehlgeschlagen",
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  try {
    // Authentifizierung versuchen
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Benutzerfreundlichere Fehlermeldungen
      let errorMessage = "Bei der Anmeldung ist ein Fehler aufgetreten.";

      switch (error.message) {
        case "Invalid login credentials":
        case "Invalid email or password":
          errorMessage = "Ungültige E-Mail oder falsches Passwort.";
          break;
        case "Email not confirmed":
          errorMessage = "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.";
          break;
        case "User not found":
          errorMessage = "Es existiert kein Konto mit dieser E-Mail-Adresse.";
          break;
        case "Too many requests":
          errorMessage =
            "Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.";
          break;
        default:
          errorMessage = error.message;
          break;
      }

      return { success: false, error: errorMessage };
    }

    // Überprüfen, ob die Sitzung wirklich erstellt wurde
    if (!data.session) {
      return {
        success: false,
        error:
          "Die Anmeldung war erfolgreich, aber die Sitzung konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
      };
    }

    console.log("Anmeldung erfolgreich", {
      user: data.user?.email,
      session: data.session ? "vorhanden" : "fehlt",
      sessionExpiry: data.session?.expires_at,
    });

    // Bei erfolgreicher Anmeldung
    return { success: true, redirectTo: "/" };
  } catch (unexpectedError) {
    console.error("Unerwarteter Fehler bei der Anmeldung:", unexpectedError);
    return {
      success: false,
      error:
        "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
    };
  }
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();

  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo:
      `${SUPABASE_FUNCTIONS_URL}/auth/callback?redirect_to=/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "//reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "//reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "//reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "//reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();

  try {
    // Sitzung beenden
    const { error } = await supabase.auth.signOut({ scope: "global" });

    if (error) {
      console.error("Fehler beim Abmelden:", error);
      return { success: false, error: error.message };
    }

    // Erfolgreiche Abmeldung
    return { success: true, redirectTo: "/sign-in" };
  } catch (err) {
    console.error("Unerwarteter Fehler beim Abmelden:", err);
    return { success: false, error: "Ein Fehler ist aufgetreten." };
  }
};

/**
 * Profil-Datenstrukturen
 */
export interface ProfileData {
  client: {
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
  } | null;
  plan: any | null;
  lesson_state: any | null;
  clients_settings: any | null;
  user: {
    id: string;
    email?: string;
    created_at?: string;
  };
}

/**
 * Lädt oder erstellt Profildaten für den angemeldeten Benutzer
 * Diese serverseitige Action umgeht die RLS-Beschränkungen
 */
export async function getProfileAction(): Promise<ProfileData> {
  const supabase = await createAdminClient();

  // Aktuelle Session prüfen mit getUser() für sicherere Authentifizierung
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      client: null,
      plan: null,
      lesson_state: null,
      clients_settings: null,
      user: { id: "" },
    };
  }

  const userId = userData.user.id;
  // 1. Versuche Client zu laden

  let { data: clientData, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("client_id", userId)
    .single();

  // 2. Plan-Daten laden, falls vorhanden
  let planData = null;
  if (clientData?.plan_id) {
    const { data: plan } = await supabase
      .from("plans")
      .select("*")
      .eq("id", clientData.plan_id)
      .single();

    planData = plan;
  }

  // 3. Lesson-State laden
  const { data: lessonState } = await supabase
    .from("clients_lesson_state")
    .select("*")
    .eq("client_id", userId)
    .single();

  // 4. Client-Settings laden
  let { data: clientsSettings, error: clientsSettingsError } = await supabase
    .from("clients_settings")
    .select("*")
    .eq("client_id", userId)
    .single();

  // Vollständige Daten zurückgeben
  return {
    client: clientData,
    plan: planData,
    lesson_state: lessonState,
    clients_settings: clientsSettings,
    user: {
      id: userId,
      email: userData.user.email,
      created_at: userData.user.created_at,
    },
  };
}

// Neue Helper-Funktion zum Löschen von Benutzern mit dem Admin-Client
export async function deleteUserAction(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createAdminClient();

    // 1. Versuche, den Benutzer aus der auth.users-Tabelle zu löschen
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
      userId,
    );

    if (authDeleteError) {
      console.error("Fehler beim Löschen des Benutzers:", authDeleteError);

      // 2. Fallback: Wenn direktes Löschen nicht klappt, Benutzer deaktivieren
      const { error: updateError } = await supabase
        .from("clients")
        .update({ is_active: false })
        .eq("auth_id", userId);

      if (updateError) {
        return {
          success: false,
          error:
            `Benutzer konnte weder gelöscht noch deaktiviert werden: ${authDeleteError.message}`,
        };
      }

      return {
        success: true,
        error:
          `Benutzer konnte nicht gelöscht werden, wurde aber deaktiviert: ${authDeleteError.message}`,
      };
    }

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error
        ? e.message
        : "Unbekannter Fehler beim Löschen des Benutzers",
    };
  }
}

export async function getLessonsStructureAction() {
  const supabase = await createAdminClient();

  const { data: lessonsStructure } = await supabase
    .from("lessons_structure")
    .select("*");

  return lessonsStructure;
}

export async function getLessonStateAction(clientId: string) {
  const supabase = await createAdminClient();

  const { data: lessonState } = await supabase
    .from("clients_lesson_state")
    .select("*")
    .eq("client_id", clientId)
    .single();

  return lessonState;
}

export async function getLessonStructureMaxExercisesCount(lessonNo: number) {
  const supabase = await createAdminClient();

  // Suche nach der entsprechenden Lektion
  const { data: lessonStructure, error } = await supabase
    .from("lessons_structure")
    .select("lesson_no, num_exercises")
    .eq("lesson_no", lessonNo)
    .single();

  if (error) {
    console.error("Fehler beim Abrufen der Lektionsstruktur:", error);
    return null;
  }

  return lessonStructure?.num_exercises;
}

export async function getUserWeeklyProgress(): Promise<{
  data: {
    completed_exercises: number;
    earned_hasanat: number;
    progress_percentage: number;
  };
  error: null | Error;
}> {
  try {
    const supabase = await createAdminClient();

    // Zeitraum: letzte 7 Tage
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // 1. Abgeschlossene Übungen und Hasanat in den letzten 7 Tagen abrufen
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error("Nicht authentifiziert");
    }

    const userId = userData.user.id;

    const { data: weeklyStats, error: weeklyStatsError } = await supabase
      .from("submitted_exercises")
      .select("count(*), sum(earned_hasanat)")
      .eq("client_id", userId)
      .gte("submitted_at", startDate.toISOString())
      .lte("submitted_at", endDate.toISOString())
      .single();

    if (weeklyStatsError) {
      throw weeklyStatsError;
    }

    // 2. Fortschrittsprozent berechnen
    // Um den Fortschritt zu berechnen, müssen wir wissen:
    // - Wie viele Übungen hat der Benutzer insgesamt gemacht
    // - Wie viele Übungen gibt es in seinen aktuellen Lektionen

    // Aktuelle Lektion des Benutzers abrufen
    const { data: lessonState, error: lessonError } = await supabase
      .from("clients_lesson_state")
      .select("lesson_no, exercise_no, exercise_passed_count")
      .eq("client_id", userId)
      .single();

    if (lessonError) {
      throw lessonError;
    }

    // Gesamtzahl der Übungen in dieser Lektion abrufen
    const { data: lessonStructure, error: structureError } = await supabase
      .from("lessons_structure")
      .select("num_exercises")
      .eq("lesson_no", lessonState.lesson_no)
      .single();

    if (structureError) {
      throw structureError;
    }

    // Fortschritt berechnen
    const totalExercisesCompleted = lessonState.exercise_passed_count || 0;
    const totalExercisesInLesson = lessonStructure.num_exercises || 1; // Vermeiden von Division durch Null

    // Prozent des Fortschritts berechnen (0-100)
    const progressPercentage =
      (totalExercisesCompleted / totalExercisesInLesson) * 100;

    return {
      data: {
        // @ts-ignore
        completed_exercises: parseInt(weeklyStats.count) || 0,
        // @ts-ignore
        earned_hasanat: parseInt(weeklyStats.sum) || 0,
        progress_percentage: progressPercentage,
      },
      error: null,
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der Wochendaten:", error);
    return {
      data: {
        completed_exercises: 0,
        earned_hasanat: 0,
        progress_percentage: 0,
      },
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// Video-Datenstrukturen
export interface VideoProgress {
  status: string;
  progress_percent: number;
  last_position_seconds: number;
}

export interface Video {
  id: string;
  title: string;
  section_id: string;
  thumbnail: string;
  vimeo_id: string | null;
  exercise_id: string | null;
  display_order: number | null;
  completed: boolean;
  progress: VideoProgress;
}

export interface Section {
  id: string;
  module_id: string;
  title: string;
  display_order: number;
  completed: boolean;
  completion_percent: number;
  videos: Video[];
}

export interface VideoModule {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  display_order: number;
  completed: boolean;
  completion_percent: number;
  sections: Section[];
}

export async function getAllVideos(): Promise<VideoModule[]> {
  try {
    const supabase = await createAdminClient();

    const { data: modules, error } = await supabase
      .from("course_modules")
      .select(`
        *,
        course_sections (
          *,
          course_videos (
            *,
            clients_course_progress!inner (
              updated_at
            )
          )
        )
      `)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching videos:", error);
      throw error;
    }

    return modules.map((module: any) => ({
      id: module.id,
      title: module.title,
      description: module.description || "",
      thumbnail: module.thumbnail,
      display_order: module.display_order,
      completed: false,
      completion_percent: 0,
      sections: module.course_sections.map((section: any) => ({
        id: section.id,
        module_id: section.module_id,
        title: section.title,
        display_order: section.display_order,
        completed: false,
        completion_percent: 0,
        videos: section.course_videos.map((video: any) => ({
          id: video.id,
          title: video.title,
          section_id: video.section_id,
          thumbnail: video.thumbnail,
          vimeo_id: video.vimeo_id,
          exercise_id: video.exercise_id,
          display_order: video.display_order,
          completed: !!video.clients_course_progress?.[0],
          progress: {
            status: video.clients_course_progress?.[0] ? "completed" : "locked",
            progress_percent: video.clients_course_progress?.[0] ? 100 : 0,
            last_position_seconds: 0,
          },
        })),
      })),
    }));
  } catch (error) {
    console.error("Error in getAllVideos:", error);
    throw error;
  }
}

export async function getVideo(videoId: string): Promise<{
  video: Video | null;
  nextVideo: Video | null;
  prevVideo: Video | null;
  module: VideoModule | null;
  section: Section | null;
}> {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase.functions.invoke("video_get", {
      body: { video_id: videoId },
    });

    if (error) {
      console.error("Error fetching video:", error);
      return {
        video: null,
        nextVideo: null,
        prevVideo: null,
        module: null,
        section: null,
      };
    }

    if (data?.data?.video) {
      const videoData = data.data.video;
      const completed = !!videoData.clients_course_progress?.[0];

      const video: Video = {
        id: videoData.id,
        title: videoData.title,
        section_id: videoData.section_id,
        thumbnail: videoData.thumbnail,
        vimeo_id: videoData.vimeo_id,
        exercise_id: videoData.exercise_id,
        display_order: videoData.display_order,
        completed,
        progress: {
          status: completed ? "completed" : "locked",
          progress_percent: completed ? 100 : 0,
          last_position_seconds: 0,
        },
      };

      const moduleObj: VideoModule = {
        id: videoData.module_id,
        title: videoData.module_title,
        description: videoData.module_description || "",
        thumbnail: videoData.module_thumbnail,
        display_order: videoData.module_display_order,
        completed: false,
        completion_percent: 0,
        sections: [],
      };

      const sectionObj: Section = {
        id: videoData.section_id,
        module_id: videoData.module_id,
        title: videoData.section_title,
        display_order: videoData.section_display_order,
        completed: false,
        completion_percent: 0,
        videos: [],
      };

      let nextVideoObj: Video | null = null;
      if (videoData.next_video_id) {
        nextVideoObj = {
          id: videoData.next_video_id,
          title: videoData.next_video_title || "",
          section_id: videoData.next_video_section_id,
          thumbnail: videoData.next_video_thumbnail || "",
          vimeo_id: videoData.next_video_vimeo_id,
          exercise_id: videoData.next_video_exercise_id,
          display_order: videoData.next_video_display_order,
          completed: false,
          progress: {
            status: "locked",
            progress_percent: 0,
            last_position_seconds: 0,
          },
        };
      }

      let prevVideoObj: Video | null = null;
      if (videoData.prev_video_id) {
        prevVideoObj = {
          id: videoData.prev_video_id,
          title: videoData.prev_video_title || "",
          section_id: videoData.prev_video_section_id,
          thumbnail: videoData.prev_video_thumbnail || "",
          vimeo_id: videoData.prev_video_vimeo_id,
          exercise_id: videoData.prev_video_exercise_id,
          display_order: videoData.prev_video_display_order,
          completed: false,
          progress: {
            status: "locked",
            progress_percent: 0,
            last_position_seconds: 0,
          },
        };
      }

      return {
        video,
        nextVideo: nextVideoObj,
        prevVideo: prevVideoObj,
        module: moduleObj,
        section: sectionObj,
      };
    }

    return {
      video: null,
      nextVideo: null,
      prevVideo: null,
      module: null,
      section: null,
    };
  } catch (error) {
    console.error("Error in getVideo:", error);
    return {
      video: null,
      nextVideo: null,
      prevVideo: null,
      module: null,
      section: null,
    };
  }
}

export async function markVideoAsCompleted(
  videoId: string,
): Promise<VideoProgress | null> {
  try {
    if (!videoId) {
      console.error("Ungültige Video-ID:", videoId);
      return null;
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase.functions.invoke(
      "video_progress_update",
      {
        body: {
          video_id: videoId,
          mark_completed: true,
        },
      },
    );

    if (error) {
      console.error("Error marking video as completed:", error);
      return null;
    }

    return {
      status: "completed",
      progress_percent: 100,
      last_position_seconds: 0,
    };
  } catch (error) {
    console.error("Error in markVideoAsCompleted:", error);
    return null;
  }
}

export async function getUserCoursesData(): Promise<{
  courses: Course[];
  error?: string;
}> {
  try {
    const supabase = await createAdminClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error("Nicht authentifiziert");
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("plan_id")
      .eq("client_id", userData.user.id)
      .single();

    if (clientError || !client) {
      return { courses: [], error: "Client not found" };
    }

    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select(`
        *,
        course_modules!course_modules_course_id_fkey (
          *,
          course_sections!course_sections_module_id_fkey (
            *,
            course_videos!course_videos_section_id_fkey (
              *,
              clients_course_progress!clients_course_progress_video_id_fkey (
                updated_at
              )
            )
          )
        )
      `)
      .eq("plan_id", client.plan_id);

    if (coursesError || !courses) {
      return { courses: [], error: "Courses not found" };
    }

    // Process each course
    const processedCourses = courses.map((course: any) => {
      // Calculate module and section progress
      const modules = course.course_modules.map((module: any) => {
        const sections = module.course_sections.map((section: any) => {
          const videos = section.course_videos.map((video: any) => {
            const completed = !!video.clients_course_progress?.[0];
            return {
              id: video.id,
              title: video.title,
              section_id: video.section_id,
              thumbnail: video.thumbnail,
              vimeo_id: video.vimeo_id,
              exercise_id: video.exercise_id,
              display_order: video.display_order,
              completed,
              unlocked: true, // First video is always unlocked
              completion_percent: completed ? 100 : 0,
            };
          });

          // Calculate section progress
          const completedVideos = videos.filter((v: any) => v.completed).length;
          const totalVideos = videos.length;
          const completionPercent = totalVideos > 0
            ? (completedVideos / totalVideos) * 100
            : 0;

          // Unlock next video if previous is completed
          videos.forEach((video: any, index: number) => {
            if (index > 0) {
              video.unlocked = videos[index - 1].completed;
            }
          });

          return {
            id: section.id,
            module_id: section.module_id,
            title: section.title,
            display_order: section.display_order,
            completed: completionPercent === 100,
            unlocked: true, // First section is always unlocked
            completion_percent: completionPercent,
            videos,
          };
        });

        // Calculate module progress
        const completedSections = sections.filter((s: any) =>
          s.completed
        ).length;
        const totalSections = sections.length;
        const completionPercent = totalSections > 0
          ? (completedSections / totalSections) * 100
          : 0;

        // Unlock next section if previous is completed
        sections.forEach((section: any, index: number) => {
          if (index > 0) {
            section.unlocked = sections[index - 1].completed;
          }
        });

        return {
          id: module.id,
          title: module.title,
          description: module.description || "",
          thumbnail: module.thumbnail,
          display_order: module.display_order,
          completed: completionPercent === 100,
          unlocked: true, // First module is always unlocked
          completion_percent: completionPercent,
          sections,
        };
      });

      // Calculate course progress
      const completedModules = modules.filter((m: any) => m.completed).length;
      const totalModules = modules.length;
      const courseCompletionPercent = totalModules > 0
        ? (completedModules / totalModules) * 100
        : 0;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        completed: courseCompletionPercent === 100,
        completion_percent: courseCompletionPercent,
        modules,
      };
    });

    return { courses: processedCourses };
  } catch (error) {
    console.error("Error in getUserCoursesData:", error);
    return { courses: [], error: "Internal server error" };
  }
}
