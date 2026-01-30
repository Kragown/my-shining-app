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
        {pois.map((poi) => (
          <Marker
            key={poi.id}
            coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
            title={poi.name}
          />
        ))}
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
