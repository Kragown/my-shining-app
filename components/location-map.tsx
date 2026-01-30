import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import type { PointOfInterest } from '@/types/poi';

type LocationCoords = {
  latitude: number;
  longitude: number;
};

type Props = {
  location: LocationCoords;
  pois?: PointOfInterest[];
  onMapLongPress?: (coords: { latitude: number; longitude: number }) => void;
  onOpenInMaps: () => void;
  buttonColor: string;
};

export function LocationMap({ location, onOpenInMaps, buttonColor }: Props) {
  return (
    <Pressable
      style={[styles.button, styles.buttonSecondary, { borderColor: buttonColor }]}
      onPress={onOpenInMaps}>
      <ThemedText style={[styles.buttonText, { color: buttonColor }]}>
        Voir ma position sur la carte (ouvre Google Maps)
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontWeight: '600',
  },
});
