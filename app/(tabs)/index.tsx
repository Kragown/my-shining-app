import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { LocationMap } from '@/components/location-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type LocationCoords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  const requestAndGetLocation = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const { status: existing } = await Location.getForegroundPermissionsAsync();

      if (existing !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);

        if (status !== 'granted') {
          setError('Accès à la position refusé. Activez-la dans les réglages.');
          setLoading(false);
          return;
        }
      } else {
        setPermissionStatus(existing);
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        altitude: position.coords.altitude ?? null,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Impossible d’obtenir la position';
      setError(message);
      setLocation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const openInMaps = useCallback(() => {
    if (!location) return;
    const { latitude, longitude } = location;
    const url =
      Platform.select({
        ios: `maps://?q=${latitude},${longitude}`,
        android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
        default: `https://www.google.com/maps?q=${latitude},${longitude}`,
      }) ?? `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url);
  }, [location]);

  const openSettings = useCallback(() => {
    if (typeof Linking.openSettings === 'function') {
      Linking.openSettings();
    }
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.title}>
          Ma position
        </ThemedText>

        {location && (
          <LocationMap
            location={location}
            onOpenInMaps={openInMaps}
            buttonColor={colors.tint}
          />
        )}

        {loading && (
          <ThemedView style={styles.card}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={styles.loadingText}>Localisation en cours…</ThemedText>
          </ThemedView>
        )}

        {error && !loading && (
          <ThemedView style={[styles.card, styles.errorCard]}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <Pressable style={[styles.button, { backgroundColor: colors.tint }]} onPress={openSettings}>
              <ThemedText style={styles.buttonText}>Ouvrir les réglages</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {!location && !loading && !error && (
          <ThemedView style={styles.card}>
            <ThemedText style={styles.placeholder}>Aucune position pour le moment.</ThemedText>
          </ThemedView>
        )}

        <Pressable
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={requestAndGetLocation}
          disabled={loading}>
          <ThemedText style={styles.buttonText}>
            {location ? 'Actualiser ma position' : 'Obtenir ma position'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    gap: 16,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: 8,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    gap: 8,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  errorCard: {
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    textAlign: 'center',
    color: '#e74c3c',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
  },
  value: {
    fontVariant: ['tabular-nums'],
  },
  placeholder: {
    opacity: 0.7,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
