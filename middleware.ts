import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routen, die ohne Authentifizierung zugänglich sein sollen
const publicRoutes = ["/sign-in", "/sign-up", "/forgot-password", "/about"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Prüfen, ob die aktuelle Route öffentlich ist
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Wenn es eine öffentliche Route ist, erlaube den Zugriff
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Cookies aus dem Request lesen
  const requestHeaders = new Headers(request.headers);
  const cookieStore = request.cookies;
  
  // Supabase Client erstellen
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Wir setzen in der Middleware keine Cookies
        },
        remove(name: string, options: any) {
          // Wir entfernen in der Middleware keine Cookies
        },
      },
    }
  );
  
  // Aktuelle Session abrufen
  const { data: { session } } = await supabase.auth.getSession();
  
  // Wenn keine Session vorhanden ist, zur Anmeldeseite umleiten
  if (!session) {
    const redirectUrl = new URL("/sign-in", request.url);
    // Ursprüngliche URL als Parameter hinzufügen, um nach der Anmeldung dorthin zurückzuleiten
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Wenn eine Session vorhanden ist, Zugriff erlauben
  return NextResponse.next();
}

// Konfiguriere auf welche Routen die Middleware angewendet werden soll
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
