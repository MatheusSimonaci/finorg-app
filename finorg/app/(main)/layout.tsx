import { withAuth } from '@workos-inc/authkit-nextjs'
import { cache } from 'react'
import { AppShell } from '@/components/ui/app-shell'
import { prisma } from '@/lib/db'

/**
 * Memoised within a single server render so multiple Server Components in
 * the same page tree don't trigger redundant DB round-trips.
 */
const syncUser = cache(async (workosId: string, email: string, name: string, avatarUrl: string | null) => {
  return prisma.user.upsert({
    where: { workosId },
    create: { workosId, email, name, avatarUrl },
    update: { email, name, avatarUrl },
  })
})

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // ensureSignedIn:true lets the middleware/AuthKit handle the redirect to /login
  // so we never reach this layout with a null user.
  const { user: workosUser } = await withAuth({ ensureSignedIn: true })

  const fullName =
    [workosUser.firstName, workosUser.lastName].filter(Boolean).join(' ') ||
    workosUser.email

  const dbUser = await syncUser(
    workosUser.id,
    workosUser.email,
    fullName,
    workosUser.profilePictureUrl ?? null,
  )

  const appUser = { name: dbUser.name, email: dbUser.email, avatarUrl: dbUser.avatarUrl }

  return <AppShell user={appUser}>{children}</AppShell>
}
