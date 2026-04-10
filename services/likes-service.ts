import * as likesRepository from '@/data/likes-repository';
import { db } from '@/lib/firebase';

import type { LikedPoiSnapshot, PointOfInterest } from '@/types/poi';

export function subscribeUserLikes(
  userId: string,
  onData: (ids: Set<string>, list: LikedPoiSnapshot[]) => void,
  onError: (message: string) => void
): () => void {
  if (!db) {
    return () => {};
  }
  return likesRepository.subscribeLikesForUser(db, userId, onData, onError);
}

export async function likePoi(userId: string, poi: PointOfInterest): Promise<void> {
  if (!db || !userId) throw new Error('Connectez-vous pour liker');
  await likesRepository.createLikeDocument(db, userId, poi);
}

export async function unlikePoi(userId: string, poiId: string): Promise<void> {
  if (!db || !userId) throw new Error('Connectez-vous pour retirer un like');
  await likesRepository.deleteLikeDocument(db, userId, poiId);
}
