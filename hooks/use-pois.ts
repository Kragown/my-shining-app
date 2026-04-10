import { useEffect, useState } from 'react';

import * as poiService from '@/services/poi-service';

import type { CreatePOI, PointOfInterest } from '@/types/poi';

export function usePois() {
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = poiService.subscribePois(
      (list) => {
        setPois(list);
        setError(null);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const addPoi = async (data: CreatePOI) => {
    await poiService.addPoi(data);
  };

  const deletePoi = async (id: string) => {
    await poiService.deletePoi(id);
  };

  return { pois, loading, error, addPoi, deletePoi };
}
