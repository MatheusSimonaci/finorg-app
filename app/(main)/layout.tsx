import { withAuth } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/ui/app-shell'
import { prisma } from '@/lib/db'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { user: workosUser } = await withAuth()
  if (!workosUser) redirect('/login')

  // Upsert user in database on every login (keeps profile in sync)
  const fullName =
    [workosUser.firstName, workosUser.lastName].filter(Boolean).join(' ') ||
    workosUser.email

  const dbUser = await prisma.user.upsert({
    where: { workosId: workosUser.id },
    create: {
      workosId: workosUser.id,
      email: workosUser.email,
      name: fullName,
      avatarUrl: workosUser.profilePictureUrl ?? null,
    },
    update: {
      email: workosUser.email,
      name: fullName,
      avatarUrl: workosUser.profilePictureUrl ?? null,
    },
  })

  const appUser = { name: dbUser.name, email: dbUser.email, avatarUrl: dbUser.avatarUrl }

  return <AppShell user={appUser}>{children}</AppShell>
}
