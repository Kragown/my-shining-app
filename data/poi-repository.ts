import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';

import type { CreatePOI, PointOfInterest } from '@/types/poi';

export const POIS_COLLECTION = 'pointsOfInterest';

type PoiDoc = {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  likesCount?: number;
  createdAt: Timestamp;
};

export function mapDocToPoi(id: string, data: PoiDoc): PointOfInterest {
  return {
    id,
    name: data.name,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    likesCount: data.likesCount ?? 0,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}

export function subscribeAllPois(
  db: Firestore,
  onData: (pois: PointOfInterest[]) => void,
  onError: (message: string) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, POIS_COLLECTION)),
    (snapshot) => {
      const list = snapshot.docs.map((d) => mapDocToPoi(d.id, d.data() as PoiDoc));
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(list);
    },
    (err) => onError(err.message)
  );
}

export async function createPoiDocument(db: Firestore, data: CreatePOI): Promise<void> {
  await addDoc(collection(db, POIS_COLLECTION), {
    name: data.name,
    ...(data.address?.trim() && { address: data.address.trim() }),
    latitude: data.latitude,
    longitude: data.longitude,
    likesCount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function deletePoiDocument(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, POIS_COLLECTION, id));
}

export async function adjustPoiLikesCount(
  db: Firestore,
  poiId: string,
  delta: number
): Promise<void> {
  await updateDoc(doc(db, POIS_COLLECTION, poiId), {
    likesCount: increment(delta),
  });
}
