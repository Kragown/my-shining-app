import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';

export const USERS_COLLECTION = 'users';

export type StoredUserRole = 'admin' | 'user';

export async function getOrInitUserRole(
  db: Firestore,
  uid: string,
  email: string
): Promise<StoredUserRole> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data();
    return data?.role === 'admin' ? 'admin' : 'user';
  }
  await setDoc(userRef, {
    role: 'user',
    email,
  });
  return 'user';
}
