"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
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
    const authToken = session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    console.log("Rufe Edge Function auf:", `${SUPABASE_FUNCTIONS_URL}/create-user`);

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
            message: "Vielen Dank für Ihre Registrierung! Bitte überprüfen Sie Ihre E-Mail für einen Bestätigungslink.",
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
          message: "Vielen Dank für Ihre Registrierung! Bitte überprüfen Sie Ihre E-Mail für einen Bestätigungslink.",
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
      error: error instanceof Error ? error.message : "Registrierung fehlgeschlagen",
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
          errorMessage = "Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.";
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
        error: "Die Anmeldung war erfolgreich, aber die Sitzung konnte nicht erstellt werden. Bitte versuchen Sie es erneut." 
      };
    }
    
    console.log("Anmeldung erfolgreich", {
      user: data.user?.email, 
      session: data.session ? "vorhanden" : "fehlt",
      sessionExpiry: data.session?.expires_at
    });

    // Bei erfolgreicher Anmeldung
    return { success: true, redirectTo: "/" };
  } catch (unexpectedError) {
    console.error("Unerwarteter Fehler bei der Anmeldung:", unexpectedError);
    return { 
      success: false, 
      error: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut."
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
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      console.error('Fehler beim Abmelden:', error);
      return { success: false, error: error.message };
    }
    
    // Erfolgreiche Abmeldung
    return { success: true, redirectTo: "/sign-in" };
  } catch (err) {
    console.error('Unerwarteter Fehler beim Abmelden:', err);
    return { success: false, error: 'Ein Fehler ist aufgetreten.' };
  }
};
