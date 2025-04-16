"use server";

import { encodedRedirect } from "@/utils/utils";
import { createAdminClient, createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// Interface für die standardisierte API-Antwort
interface ApiResponse<T = any> {
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
interface ProfileData {
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
    .from('lessons_structure')
    .select('lesson_no, num_exercises')
    .eq('lesson_no', lessonNo)
    .single();
    
  if (error) {
    console.error('Fehler beim Abrufen der Lektionsstruktur:', error);
    return null;
  }
  
  return lessonStructure?.num_exercises;
}

export async function getUserWeeklyProgress(): Promise<{
  data: {
    completed_exercises: number;
    earned_hasanat: number;
    progress_percentage: number;
  },
  error: null | Error
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
      .from('submitted_exercises')
      .select('count(*), sum(earned_hasanat)')
      .eq('client_id', userId)
      .gte('submitted_at', startDate.toISOString())
      .lte('submitted_at', endDate.toISOString())
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
      .from('clients_lesson_state')
      .select('lesson_no, exercise_no, exercise_passed_count')
      .eq('client_id', userId)
      .single();
      
    if (lessonError) {
      throw lessonError;
    }
    
    // Gesamtzahl der Übungen in dieser Lektion abrufen
    const { data: lessonStructure, error: structureError } = await supabase
      .from('lessons_structure')
      .select('num_exercises')
      .eq('lesson_no', lessonState.lesson_no)
      .single();
      
    if (structureError) {
      throw structureError;
    }
    
    // Fortschritt berechnen
    const totalExercisesCompleted = lessonState.exercise_passed_count || 0;
    const totalExercisesInLesson = lessonStructure.num_exercises || 1; // Vermeiden von Division durch Null
    
    // Prozent des Fortschritts berechnen (0-100)
    const progressPercentage = (totalExercisesCompleted / totalExercisesInLesson) * 100;
    
    return {
      data: {
        // @ts-ignore
        completed_exercises: parseInt(weeklyStats.count) || 0,
        // @ts-ignore
        earned_hasanat: parseInt(weeklyStats.sum) || 0,
        progress_percentage: progressPercentage
      },
      error: null
    };
    
  } catch (error) {
    console.error("Fehler beim Abrufen der Wochendaten:", error);
    return {
      data: {
        completed_exercises: 0,
        earned_hasanat: 0,
        progress_percentage: 0
      },
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}