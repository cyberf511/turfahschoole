import { currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) return <div>No user</div>;
  return <div>Dashboard — {user.id}</div>;
}
