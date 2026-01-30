import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { PointOfInterest } from '@/types/poi';

type LocationCoords = {
  latitude: number;
  longitude: number;
};

type Props = {
  location: LocationCoords;
  pois?: PointOfInterest[];
  onMapLongPress?: (coords: { latitude: number; longitude: number }) => void;
  onOpenInMaps?: () => void;
  buttonColor?: string;
};

export function LocationMap({ location, pois = [], onMapLongPress }: Props) {
  return (
    <View style={styles.wrapper}>
      <MapView
        style={styles.map}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton
        onLongPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          onMapLongPress?.({ latitude, longitude });
        }}
      >
        {pois.map((poi) => {
          const likesLabel = (poi.likesCount ?? 0) > 0 ? `${poi.likesCount} like${(poi.likesCount ?? 0) > 1 ? 's' : ''}` : null;
          const descParts = [poi.address, likesLabel].filter(Boolean);
          return (
            <Marker
              key={poi.id}
              coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
              title={poi.name}
              description={descParts.length > 0 ? descParts.join(' · ') : undefined}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
