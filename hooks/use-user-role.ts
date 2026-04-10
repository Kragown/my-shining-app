import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import * as authService from '@/services/auth-service';
import * as userProfileService from '@/services/user-profile-service';

export type UserRole = 'admin' | 'user' | null;

export function useUserRole() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthState(async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setRole(null);
        setLoading(false);
        return;
      }
      const resolved = await userProfileService.resolveUserRole(
        firebaseUser.uid,
        firebaseUser.email ?? ''
      );
      setRole(resolved);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = role === 'admin';

  return { user, role, isAdmin, loading };
}
