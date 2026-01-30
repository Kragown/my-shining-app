export type PointOfInterest = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
};

export type CreatePOI = {
  name: string;
  latitude: number;
  longitude: number;
};
