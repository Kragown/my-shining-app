import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LocationMap } from '@/components/location-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLikes } from '@/hooks/use-likes';
import { usePois } from '@/hooks/use-pois';
import { useUserRole } from '@/hooks/use-user-role';

type LocationCoords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isAdmin } = useUserRole();
  const { pois, loading: poisLoading, error: poisError, addPoi, deletePoi } = usePois();
  const { isLiked, like, unlike } = useLikes();

  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [pendingPoi, setPendingPoi] = useState<{ latitude: number; longitude: number } | null>(null);
  const [poiName, setPoiName] = useState('');
  const [addPoiLoading, setAddPoiLoading] = useState(false);
  const [savePoiError, setSavePoiError] = useState<string | null>(null);

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

  const handleMapLongPress = useCallback((coords: { latitude: number; longitude: number }) => {
    setPendingPoi(coords);
    setPoiName('');
    setAddPoiLoading(false);
    setSavePoiError(null);
  }, []);

  const closePoiModal = useCallback(() => {
    setPendingPoi(null);
    setPoiName('');
    setSavePoiError(null);
  }, []);

  const getSaveErrorMessage = useCallback((e: unknown): string => {
    const err = e as { code?: string; message?: string };
    if (err?.code === 'permission-denied') {
      return 'Permission refusée. Vérifiez les règles Firestore (collection pointsOfInterest).';
    }
    if (err?.code === 'unavailable') {
      return 'Réseau indisponible. Vérifiez votre connexion.';
    }
    if (err?.message) return err.message;
    return 'Erreur lors de l’enregistrement. Réessayez.';
  }, []);

  const savePoi = useCallback(async () => {
    if (!pendingPoi || !poiName.trim()) return;
    setAddPoiLoading(true);
    setSavePoiError(null);
    try {
      await addPoi({ name: poiName.trim(), ...pendingPoi });
      closePoiModal();
    } catch (e) {
      setSavePoiError(getSaveErrorMessage(e));
    } finally {
      setAddPoiLoading(false);
    }
  }, [pendingPoi, poiName, addPoi, closePoiModal, getSaveErrorMessage]);

  const addCurrentLocationAsPoi = useCallback(async () => {
    if (!location) return;
    setPendingPoi({ latitude: location.latitude, longitude: location.longitude });
    setPoiName('');
  }, [location]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Pressable
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={requestAndGetLocation}
          disabled={loading}>
          <ThemedText style={styles.buttonText}>
            {location ? 'Actualiser ma position' : 'Obtenir ma position'}
          </ThemedText>
        </Pressable>

        {location && (
          <LocationMap
            location={location}
            pois={pois}
            onMapLongPress={isAdmin ? handleMapLongPress : undefined}
            onOpenInMaps={openInMaps}
            buttonColor={colors.tint}
          />
        )}

        {(location && isAdmin && (Platform.OS === 'ios' || Platform.OS === 'android')) && (
          <ThemedText style={styles.hint}>
            Appuyez longuement sur la carte pour ajouter un point d’intérêt.
          </ThemedText>
        )}

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Points d’intérêt
        </ThemedText>
        {poisError && (
          <ThemedText style={styles.errorText}>{poisError}</ThemedText>
        )}
        {poisLoading && <ActivityIndicator size="small" color={colors.tint} />}
        {!poisLoading && pois.length === 0 && (
          <ThemedText style={styles.placeholder}>Aucun point pour le moment.</ThemedText>
        )}
        {!poisLoading && pois.length > 0 && (
          <ThemedView style={styles.poiList}>
            {pois.map((poi) => (
              <ThemedView key={poi.id} style={styles.poiRow}>
                <ThemedText style={styles.poiName}>{poi.name}</ThemedText>
                {poi.address ? (
                  <ThemedText style={styles.poiAddress}>{poi.address}</ThemedText>
                ) : null}
                <ThemedText style={styles.poiCoords}>
                  {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}
                  {(poi.likesCount ?? 0) > 0 && ` · ${poi.likesCount} like${(poi.likesCount ?? 0) > 1 ? 's' : ''}`}
                </ThemedText>
                {user && (
                  <Pressable
                    style={styles.likeButton}
                    onPress={() => (isLiked(poi.id) ? unlike(poi.id) : like(poi))}>
                    <MaterialIcons
                      name={isLiked(poi.id) ? 'favorite' : 'favorite-border'}
                      size={22}
                      color={isLiked(poi.id) ? '#e74c3c' : colors.icon}
                    />
                  </Pressable>
                )}
                {isAdmin && (
                  <Pressable
                    style={[styles.deleteButton, { borderColor: colors.tint }]}
                    onPress={() => deletePoi(poi.id)}>
                    <ThemedText style={{ color: colors.tint, fontSize: 12 }}>Supprimer</ThemedText>
                  </Pressable>
                )}
              </ThemedView>
            ))}
          </ThemedView>
        )}

        {location && isAdmin && Platform.OS === 'web' && (
          <Pressable
            style={[styles.button, styles.buttonSecondary, { borderColor: colors.tint }]}
            onPress={addCurrentLocationAsPoi}>
            <ThemedText style={[styles.buttonText, { color: colors.tint }]}>
              Ajouter ma position comme point d’intérêt
            </ThemedText>
          </Pressable>
        )}

        <Modal
          visible={pendingPoi !== null}
          transparent
          animationType="fade"
          onRequestClose={closePoiModal}>
          <Pressable style={styles.modalOverlay} onPress={closePoiModal}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalContentWrap}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <ThemedView style={styles.modalCard}>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    Nouveau point d’intérêt
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.tint }]}
                    placeholder="Nom du lieu"
                    placeholderTextColor={colors.icon}
                    value={poiName}
                    onChangeText={setPoiName}
                    autoFocus
                    editable={!addPoiLoading}
                  />
                  <ThemedText style={styles.modalHint}>
                    Pour ajouter un autre point plus tard, appuyez longuement sur la carte.
                  </ThemedText>
                  {savePoiError && (
                    <ThemedText style={styles.saveErrorText}>{savePoiError}</ThemedText>
                  )}
                  <ThemedView style={styles.modalActions}>
                    <Pressable
                      style={[styles.modalButton, { borderColor: colors.tint }]}
                      onPress={closePoiModal}
                      disabled={addPoiLoading}>
                      <ThemedText style={{ color: colors.tint }}>Annuler</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.modalButton, { backgroundColor: colors.tint }]}
                      onPress={savePoi}
                      disabled={!poiName.trim() || addPoiLoading}>
                      <ThemedText style={styles.buttonText}>
                        {addPoiLoading ? 'Enregistrement…' : 'Enregistrer'}
                      </ThemedText>
                    </Pressable>
                  </ThemedView>
                </ThemedView>
              </Pressable>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>

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
  hint: {
    fontSize: 13,
    opacity: 0.8,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  poiList: {
    gap: 10,
  },
  poiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
  },
  poiName: {
    fontWeight: '600',
    flex: 1,
    minWidth: 100,
  },
  poiAddress: {
    fontSize: 13,
    opacity: 0.85,
    width: '100%',
  },
  poiCoords: {
    fontSize: 12,
    opacity: 0.8,
    fontVariant: ['tabular-nums'],
  },
  likeButton: {
    padding: 6,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentWrap: {
    width: '100%',
    maxWidth: 340,
  },
  modalCard: {
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  modalTitle: {
    marginBottom: 4,
  },
  modalHint: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: -4,
    marginBottom: 4,
  },
  saveErrorText: {
    fontSize: 13,
    color: '#e74c3c',
    marginTop: 4,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
});
