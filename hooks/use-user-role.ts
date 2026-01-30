import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { auth, db } from '@/lib/firebase';

const USERS_COLLECTION = 'users';

export type UserRole = 'admin' | 'user' | null;

export function useUserRole() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setRole(null);
        setLoading(false);
        return;
      }
      if (!db) {
        setRole(null);
        setLoading(false);
        return;
      }
      try {
        const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setRole((data?.role === 'admin' ? 'admin' : 'user') as UserRole);
        } else {
          await setDoc(userRef, {
            role: 'user',
            email: firebaseUser.email ?? '',
          });
          setRole('user');
        }
      } catch {
        setRole('user');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = role === 'admin';

  return { user, role, isAdmin, loading };
}
