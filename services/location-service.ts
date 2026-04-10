import * as Location from 'expo-location';

export type DeviceLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
};

export type LocationRequestResult =
  | {
      ok: true;
      location: DeviceLocation;
      permissionStatus: Location.PermissionStatus;
    }
  | {
      ok: false;
      permissionDenied: boolean;
      error?: string;
      permissionStatus?: Location.PermissionStatus;
    };

export async function requestDeviceLocation(): Promise<LocationRequestResult> {
  try {
    let permissionStatus: Location.PermissionStatus;
    const { status: existing } = await Location.getForegroundPermissionsAsync();

    if (existing !== 'granted') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      permissionStatus = status;
      if (status !== 'granted') {
        return {
          ok: false,
          permissionDenied: true,
          permissionStatus: status,
        };
      }
    } else {
      permissionStatus = existing;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      ok: true,
      permissionStatus,
      location: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        altitude: position.coords.altitude ?? null,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Impossible d’obtenir la position';
    return { ok: false, permissionDenied: false, error: message };
  }
}
