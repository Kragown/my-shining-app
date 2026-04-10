import { onAuthStateChanged, type User } from 'firebase/auth';

import * as authRepository from '@/data/auth-repository';
import { auth } from '@/lib/firebase';

function mapAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Erreur de connexion';
  if (message.includes('auth/email-already-in-use')) {
    return 'Cet email est déjà utilisé. Connectez-vous.';
  }
  if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
    return 'Email ou mot de passe incorrect';
  }
  if (message.includes('auth/weak-password')) {
    return 'Le mot de passe doit faire au moins 6 caractères';
  }
  if (message.includes('auth/invalid-email')) {
    return 'Email invalide';
  }
  if (message === 'auth/not-configured' || message.includes('auth/not-configured')) {
    return 'Firebase non configuré';
  }
  return message;
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function registerWithEmail(email: string, password: string): Promise<void> {
  if (!authRepository.isAuthClientAvailable()) {
    throw new Error(mapAuthError(new Error('auth/not-configured')));
  }
  try {
    await authRepository.signUpWithEmailAndPassword(email, password);
  } catch (e) {
    throw new Error(mapAuthError(e));
  }
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  if (!authRepository.isAuthClientAvailable()) {
    throw new Error(mapAuthError(new Error('auth/not-configured')));
  }
  try {
    await authRepository.signInWithEmailAndPassword(email, password);
  } catch (e) {
    throw new Error(mapAuthError(e));
  }
}

export async function logout(): Promise<void> {
  if (!authRepository.isAuthClientAvailable()) {
    return;
  }
  try {
    await authRepository.signOutCurrentUser();
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Erreur lors de la déconnexion');
  }
}
