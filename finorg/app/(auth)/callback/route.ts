import { handleAuth } from '@workos-inc/authkit-nextjs'
import { NextRequest, NextResponse } from 'next/server'

const authHandler = handleAuth()

export async function GET(request: NextRequest) {
  // If no code param, redirect to login instead of crashing
  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return authHandler(request)
}
