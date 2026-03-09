export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.WORKOS_API_KEY ?? "";
  const clientId = process.env.WORKOS_CLIENT_ID ?? "";
  const redirectUri = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ?? "";
  const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD ?? "";

  return Response.json({
    WORKOS_API_KEY: apiKey
      ? `${apiKey.slice(0, 12)}...${apiKey.slice(-4)} (len=${apiKey.length})`
      : "MISSING",
    WORKOS_CLIENT_ID: clientId || "MISSING",
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: redirectUri || "MISSING",
    WORKOS_COOKIE_PASSWORD_LEN: cookiePassword.length,
    WORKOS_COOKIE_PASSWORD_OK: cookiePassword.length >= 32,
  });
}
