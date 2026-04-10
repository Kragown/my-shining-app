import { Linking } from 'react-native';

export function openSystemSettings(): void {
  if (typeof Linking.openSettings === 'function') {
    Linking.openSettings();
  }
}
