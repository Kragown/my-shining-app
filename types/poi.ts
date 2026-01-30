export type PointOfInterest = {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  likesCount?: number;
  createdAt: Date;
};

export type CreatePOI = {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
};

export type LikedPoiSnapshot = {
  poiId: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
};
