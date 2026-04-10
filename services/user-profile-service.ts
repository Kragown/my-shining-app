import * as userProfileRepository from '@/data/user-profile-repository';
import { db } from '@/lib/firebase';

import type { StoredUserRole } from '@/data/user-profile-repository';

export async function resolveUserRole(uid: string, email: string): Promise<StoredUserRole> {
  if (!db) return 'user';
  try {
    return await userProfileRepository.getOrInitUserRole(db, uid, email);
  } catch {
    return 'user';
  }
}
