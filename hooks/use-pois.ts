import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/lib/firebase';

import type { CreatePOI, PointOfInterest } from '@/types/poi';

const COLLECTION = 'pointsOfInterest';

function mapDocToPOI(
  id: string,
  data: { name: string; address?: string; latitude: number; longitude: number; likesCount?: number; createdAt: Timestamp }
): PointOfInterest {
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

export function usePois() {
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      setError('Firebase non configuré');
      return;
    }

    const unsubscribe = onSnapshot(
      query(collection(db, COLLECTION)),
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data() as { name: string; address?: string; latitude: number; longitude: number; likesCount?: number; createdAt: Timestamp };
          return mapDocToPOI(d.id, data);
        });
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setPois(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addPoi = async (data: CreatePOI) => {
    if (!db) throw new Error('Firebase non configuré');
    await addDoc(collection(db, COLLECTION), {
      name: data.name,
      ...(data.address?.trim() && { address: data.address.trim() }),
      latitude: data.latitude,
      longitude: data.longitude,
      likesCount: 0,
      createdAt: serverTimestamp(),
    });
  };

  const deletePoi = async (id: string) => {
    if (!db) throw new Error('Firebase non configuré');
    await deleteDoc(doc(db, COLLECTION, id));
  };

  return { pois, loading, error, addPoi, deletePoi };
}
