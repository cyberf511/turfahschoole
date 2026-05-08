'use client';

import { useAuth } from '@clerk/nextjs';

export function ClerkGate({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth();
  if (!isLoaded) return null;
  return <>{children}</>;
}
