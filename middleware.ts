import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
}

// Definiere, welche Pfade von der Middleware überprüft werden sollen
export const config = {
  matcher: [],
};
