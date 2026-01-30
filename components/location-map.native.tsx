import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';

type LocationCoords = {
  latitude: number;
  longitude: number;
};

type Props = {
  location: LocationCoords;
  onOpenInMaps?: () => void;
  buttonColor?: string;
};

export function LocationMap({ location }: Props) {
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
      />
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
