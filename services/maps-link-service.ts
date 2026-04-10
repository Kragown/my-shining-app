import { Linking, Platform } from 'react-native';

export function buildMapsUrl(latitude: number, longitude: number): string {
  return (
    Platform.select({
      ios: `maps://?q=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
      default: `https://www.google.com/maps?q=${latitude},${longitude}`,
    }) ?? `https://www.google.com/maps?q=${latitude},${longitude}`
  );
}

export function openMapsAt(latitude: number, longitude: number): void {
  Linking.openURL(buildMapsUrl(latitude, longitude));
}
