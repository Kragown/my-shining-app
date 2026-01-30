import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  increment,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { auth, db } from '@/lib/firebase';

import type { LikedPoiSnapshot, PointOfInterest } from '@/types/poi';

const LIKES_COLLECTION = 'likes';
const POIS_COLLECTION = 'pointsOfInterest';

function likeDocId(poiId: string, userId: string) {
  return `${poiId}_${userId}`;
}

function mapLikeToSnapshot(poiId: string, data: { name: string; address?: string; latitude: number; longitude: number; createdAt: Timestamp }): LikedPoiSnapshot {
  return {
    poiId,
    name: data.name,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}

export function useLikes(userId?: string | null) {
  const [likedPoiIds, setLikedPoiIds] = useState<Set<string>>(new Set());
  const [likedPois, setLikedPois] = useState<LikedPoiSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const uid = userId ?? auth?.currentUser?.uid ?? null;

  useEffect(() => {
    if (!db || !uid) {
      setLikedPoiIds(new Set());
      setLikedPois([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, LIKES_COLLECTION),
      where('userId', '==', uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ids = new Set<string>();
        const list: LikedPoiSnapshot[] = [];
        snapshot.docs.forEach((d) => {
          const data = d.data();
          const poiId = data.poiId as string;
          ids.add(poiId);
          list.push(mapLikeToSnapshot(poiId, {
            name: data.name,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
            createdAt: data.createdAt as Timestamp,
          }));
        });
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setLikedPoiIds(ids);
        setLikedPois(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const like = useCallback(async (poi: PointOfInterest) => {
    const currentUid = auth?.currentUser?.uid;
    if (!db || !currentUid) throw new Error('Connectez-vous pour liker');
    const docId = likeDocId(poi.id, currentUid);
    const likeRef = doc(db, LIKES_COLLECTION, docId);
    await setDoc(likeRef, {
      poiId: poi.id,
      userId: currentUid,
      name: poi.name,
      ...(poi.address && { address: poi.address }),
      latitude: poi.latitude,
      longitude: poi.longitude,
      createdAt: serverTimestamp(),
    });
    const poiRef = doc(db, POIS_COLLECTION, poi.id);
    await updateDoc(poiRef, { likesCount: increment(1) });
  }, []);

  const unlike = useCallback(async (poiId: string) => {
    const currentUid = auth?.currentUser?.uid;
    if (!db || !currentUid) throw new Error('Connectez-vous pour retirer un like');
    const docId = likeDocId(poiId, currentUid);
    await deleteDoc(doc(db, LIKES_COLLECTION, docId));
    const poiRef = doc(db, POIS_COLLECTION, poiId);
    await updateDoc(poiRef, { likesCount: increment(-1) });
  }, []);

  const isLiked = useCallback((poiId: string) => likedPoiIds.has(poiId), [likedPoiIds]);

  return { likedPoiIds, likedPois, isLiked, like, unlike, loading, error };
}
