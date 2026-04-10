import { useCallback, useEffect, useState } from 'react';

import * as likesService from '@/services/likes-service';

import type { LikedPoiSnapshot, PointOfInterest } from '@/types/poi';

export function useLikes(userId?: string | null) {
  const [likedPoiIds, setLikedPoiIds] = useState<Set<string>>(new Set());
  const [likedPois, setLikedPois] = useState<LikedPoiSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const uid = userId ?? null;

  useEffect(() => {
    if (!uid) {
      setLikedPoiIds(new Set());
      setLikedPois([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = likesService.subscribeUserLikes(
      uid,
      (ids, list) => {
        setLikedPoiIds(ids);
        setLikedPois(list);
        setError(null);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  const like = useCallback(
    async (poi: PointOfInterest) => {
      if (!uid) throw new Error('Connectez-vous pour liker');
      await likesService.likePoi(uid, poi);
    },
    [uid]
  );

  const unlike = useCallback(
    async (poiId: string) => {
      if (!uid) throw new Error('Connectez-vous pour retirer un like');
      await likesService.unlikePoi(uid, poiId);
    },
    [uid]
  );

  const isLiked = useCallback((poiId: string) => likedPoiIds.has(poiId), [likedPoiIds]);

  return { likedPoiIds, likedPois, isLiked, like, unlike, loading, error };
}
