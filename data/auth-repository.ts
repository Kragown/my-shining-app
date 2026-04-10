import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut,
  type UserCredential,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';

export function isAuthClientAvailable(): boolean {
  return auth != null;
}

export async function signUpWithEmailAndPassword(
  email: string,
  password: string
): Promise<UserCredential> {
  if (!auth) throw new Error('auth/not-configured');
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithEmailAndPassword(
  email: string,
  password: string
): Promise<UserCredential> {
  if (!auth) throw new Error('auth/not-configured');
  return firebaseSignInWithEmailAndPassword(auth, email, password);
}

export async function signOutCurrentUser(): Promise<void> {
  if (!auth) throw new Error('auth/not-configured');
  await signOut(auth);
}
