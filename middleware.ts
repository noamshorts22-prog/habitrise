import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms");

  console.log("MW pathname:", pathname, "| user:", user?.id ?? "none", "| isPublic:", isPublic);

  // Not logged in → onboarding (unless already on a public page)
  if (!user && !isPublic) {
    console.log("MW → redirect to /onboarding (no user)");
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    const hasUsername = profile && profile.username;
    console.log("MW profile username:", profile?.username ?? "NULL", "| hasUsername:", !!hasUsername);

    // Logged in + no username → send to onboarding (unless already on a public page)
    if (!hasUsername && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // Logged in + has username + still on onboarding/login → send to home
    if (hasUsername && (pathname.startsWith("/onboarding") || pathname.startsWith("/login"))) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|avatars|icons|manifest.json|sw.js|habitrise-icon.png|habitrise-logo.png).*)"],
};
