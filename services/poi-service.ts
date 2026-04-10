import * as poiRepository from '@/data/poi-repository';
import { db } from '@/lib/firebase';

import type { CreatePOI, PointOfInterest } from '@/types/poi';

export function subscribePois(
  onData: (pois: PointOfInterest[]) => void,
  onError: (message: string) => void
): () => void {
  if (!db) {
    onError('Firebase non configuré');
    return () => {};
  }
  return poiRepository.subscribeAllPois(db, onData, onError);
}

export async function addPoi(data: CreatePOI): Promise<void> {
  if (!db) throw new Error('Firebase non configuré');
  await poiRepository.createPoiDocument(db, data);
}

export async function deletePoi(id: string): Promise<void> {
  if (!db) throw new Error('Firebase non configuré');
  await poiRepository.deletePoiDocument(db, id);
}
