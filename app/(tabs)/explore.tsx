import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUserRole } from '@/hooks/use-user-role';
import { auth } from '@/lib/firebase';

const CARD_RADIUS = 20;
const INPUT_RADIUS = 12;
const BUTTON_RADIUS = 12;

export default function AuthScreen() {
  const { user, role, isAdmin } = useUserRole();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const headerBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,126,164,0.12)';
  const cardBg = isDark ? '#1c1c1e' : '#ffffff';
  const cardShadow =
    isDark
      ? { elevation: 2 }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        };
  const inputBg = isDark ? '#2c2c2e' : '#f5f5f7';
  const inputBorder = isDark ? '#3a3a3c' : '#e5e5ea';
  const errorBg = isDark ? 'rgba(220,53,69,0.2)' : 'rgba(220,53,69,0.1)';
  const errorBorder = isDark ? 'rgba(220,53,69,0.5)' : 'rgba(220,53,69,0.3)';

  const handleSubmit = async () => {
    if (!auth) {
      setError('Firebase non configuré');
      return;
    }
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion';
      if (message.includes('auth/email-already-in-use')) {
        setError('Cet email est déjà utilisé. Connectez-vous.');
      } else if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
        setError('Email ou mot de passe incorrect');
      } else if (message.includes('auth/weak-password')) {
        setError('Le mot de passe doit faire au moins 6 caractères');
      } else if (message.includes('auth/invalid-email')) {
        setError('Email invalide');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };

  const getInitial = (email: string) => (email ? email[0].toUpperCase() : '?');

  if (user) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.headerBand, { backgroundColor: headerBg }]}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.tint }]}>
              <ThemedText style={styles.avatarText}>{getInitial(user.email ?? '')}</ThemedText>
            </View>
            <ThemedText type="title" style={styles.headerTitle}>
              Bienvenue
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: colors.icon }]}>
              {user.email}
            </ThemedText>
            {role && (
              <ThemedText style={[styles.roleBadge, { color: colors.icon }]}>
                {isAdmin ? 'Administrateur' : 'Utilisateur'}
              </ThemedText>
            )}
          </View>
          <View style={[styles.card, { backgroundColor: cardBg }, cardShadow]}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.logoutButton,
                { backgroundColor: isDark ? '#3a3a3c' : '#f0f0f0' },
                pressed && styles.buttonPressed,
              ]}
              onPress={handleLogout}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.tint} />
              ) : (
                <>
                  <IconSymbol name="lock.fill" size={20} color={colors.tint} style={styles.buttonIcon} />
                  <ThemedText style={[styles.logoutButtonText, { color: colors.text }]}>
                    Se déconnecter
                  </ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.headerBand, { backgroundColor: headerBg }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.tint }]}>
              <IconSymbol name="person.fill" size={40} color="#fff" />
            </View>
            <ThemedText type="title" style={styles.headerTitle}>
              {isSignUp ? 'Créer un compte' : 'Connexion'}
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: colors.icon }]}>
              {isSignUp
                ? 'Remplissez les champs pour vous inscrire'
                : 'Entrez vos identifiants pour continuer'}
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }, cardShadow]}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: errorBg, borderColor: errorBorder }]}>
                <ThemedText style={[styles.errorText, { color: isDark ? '#ff6b6b' : '#c62828' }]}>
                  {error}
                </ThemedText>
              </View>
            ) : null}

            <ThemedText style={[styles.label, { color: colors.icon }]}>Email</ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, borderColor: inputBorder, color: colors.text },
              ]}
              placeholder="vous@exemple.com"
              placeholderTextColor={colors.icon}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />

            <ThemedText style={[styles.label, { color: colors.icon }]}>Mot de passe</ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, borderColor: inputBorder, color: colors.text },
              ]}
              placeholder="••••••••"
              placeholderTextColor={colors.icon}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'password'}
              editable={!loading}
            />

            <Pressable
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.tint },
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>
                  {isSignUp ? "S'inscrire" : 'Se connecter'}
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.switchMode, pressed && { opacity: 0.7 }]}
              onPress={() => {
                setIsSignUp((prev) => !prev);
                setError(null);
              }}
              disabled={loading}>
              <ThemedText style={[styles.switchModeText, { color: colors.tint }]}>
                {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 32,
    paddingBottom: 48,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  headerBand: {
    borderRadius: CARD_RADIUS,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
  },
  headerTitle: {
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  roleBadge: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  card: {
    borderRadius: CARD_RADIUS,
    padding: 24,
    overflow: 'hidden',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 4,
  },
  errorBox: {
    padding: 14,
    borderRadius: INPUT_RADIUS,
    marginBottom: 20,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: INPUT_RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    borderRadius: BUTTON_RADIUS,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 4,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchMode: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchModeText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
