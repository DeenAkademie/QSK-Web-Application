// supabase/functions/create-user/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
    try {
        // Alle Daten aus dem Registrierungsformular
        const {
            email,
            password,
            userName,
            firstName,
            lastName,
            gender,
            role = "user",
        } = await req.json();

        // Admin-Client mit voller Berechtigung
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        // 1. Auth Benutzer erstellen
        const { data: authData, error: authError } = await supabaseAdmin.auth
            .admin.createUser({
                email,
                password,
                email_confirm: true, // Bei lokaler Entwicklung: keine Email-Bestätigung nötig
            });

        if (authError) throw authError;

        // 2. Client-Eintrag erstellen
        const { data: clientData, error: clientError } = await supabaseAdmin
            .from("clients")
            .insert({
                auth_id: authData.user.id,
                user_name: userName || email.split("@")[0],
                email: email,
                first_name: firstName || null,
                last_name: lastName || null,
                gender: gender || null,
                role: role,
                is_active: true,
            })
            .select()
            .single();

        if (clientError) throw clientError;

        // Erfolgreiche Antwort
        return new Response(
            JSON.stringify({
                success: true,
                user: authData.user,
                client: clientData,
            }),
            {
                headers: { "Content-Type": "application/json" },
                status: 201,
            },
        );
    } catch (error: unknown) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Unbekannter Fehler",
            }),
            {
                headers: { "Content-Type": "application/json" },
                status: 400,
            },
        );
    }
});
