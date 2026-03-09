import { authkitMiddleware } from '@workos-inc/authkit-nextjs'

// NEXT_PUBLIC_WORKOS_REDIRECT_URI is the canonical var read by the WorkOS SDK in
// Edge Runtime. WORKOS_REDIRECT_URI is kept as fallback for server-side code.
const redirectUri =
  process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ?? process.env.WORKOS_REDIRECT_URI

export default authkitMiddleware({
  redirectUri,
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ['/login'],
  },
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
