import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';

import { adjustPoiLikesCount } from '@/data/poi-repository';

import type { LikedPoiSnapshot, PointOfInterest } from '@/types/poi';

export const LIKES_COLLECTION = 'likes';

function likeDocId(poiId: string, userId: string) {
  return `${poiId}_${userId}`;
}

type LikeDocFields = {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  createdAt: Timestamp;
};

function mapLikeToSnapshot(poiId: string, data: LikeDocFields): LikedPoiSnapshot {
  return {
    poiId,
    name: data.name,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}

export function subscribeLikesForUser(
  db: Firestore,
  userId: string,
  onData: (ids: Set<string>, list: LikedPoiSnapshot[]) => void,
  onError: (message: string) => void
): Unsubscribe {
  const q = query(collection(db, LIKES_COLLECTION), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const ids = new Set<string>();
      const list: LikedPoiSnapshot[] = [];
      snapshot.docs.forEach((d) => {
        const data = d.data();
        const poiId = data.poiId as string;
        ids.add(poiId);
        list.push(
          mapLikeToSnapshot(poiId, {
            name: data.name,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
            createdAt: data.createdAt as Timestamp,
          })
        );
      });
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(ids, list);
    },
    (err) => onError(err.message)
  );
}

export async function createLikeDocument(
  db: Firestore,
  userId: string,
  poi: PointOfInterest
): Promise<void> {
  const docId = likeDocId(poi.id, userId);
  await setDoc(doc(db, LIKES_COLLECTION, docId), {
    poiId: poi.id,
    userId,
    name: poi.name,
    ...(poi.address && { address: poi.address }),
    latitude: poi.latitude,
    longitude: poi.longitude,
    createdAt: serverTimestamp(),
  });
  await adjustPoiLikesCount(db, poi.id, 1);
}

export async function deleteLikeDocument(
  db: Firestore,
  userId: string,
  poiId: string
): Promise<void> {
  const docId = likeDocId(poiId, userId);
  await deleteDoc(doc(db, LIKES_COLLECTION, docId));
  await adjustPoiLikesCount(db, poiId, -1);
}
