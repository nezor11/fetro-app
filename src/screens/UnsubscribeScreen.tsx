import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { unsubscribeAccount } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING } from '../constants/theme';

/**
 * Pantalla de baja de cuenta (GDPR soft-delete).
 *
 * Consume el endpoint `unsubscribe_account` del plugin, que pone
 * `account_activated = 0` en el meta del usuario. Los datos se
 * preservan en el backend (histórico de inscripciones, facturación,
 * cumplimiento fiscal), pero desde la perspectiva de la app el usuario
 * pierde acceso inmediato y su sesión local se borra.
 *
 * Diseño de fricción intencional: el usuario debe escribir la palabra
 * "BAJA" antes de que el botón destructivo se active. Esto evita
 * tappeos accidentales en una acción irreversible desde la app
 * (reactivar la cuenta requiere intervención del equipo Fatro).
 */
const CONFIRMATION_WORD = 'BAJA';

export default function UnsubscribeScreen() {
  const navigation = useNavigation();
  const { cookie, logout } = useAuth();
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = confirmation.trim().toUpperCase() === CONFIRMATION_WORD;

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleUnsubscribe = async () => {
    if (!cookie || !canSubmit || loading) return;

    setLoading(true);
    try {
      await unsubscribeAccount(cookie);
      // Limpiamos la sesión local. El RootNavigator detecta el cambio
      // de `isLoggedIn` y lleva al usuario a Login automáticamente.
      await logout();
      showAlert(
        'Cuenta dada de baja',
        'Tu cuenta ha sido desactivada. Si quieres volver a usar la app en el futuro, contacta con Fatro para reactivarla.'
      );
    } catch (err: any) {
      showAlert(
        'No se pudo completar la baja',
        err.message || 'Inténtalo de nuevo en unos minutos.'
      );
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Dar de baja tu cuenta</Text>
      <Text style={styles.subtitle}>Esta acción no se puede deshacer desde la app.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Qué pasa al confirmar</Text>
        <Text style={styles.bullet}>
          • Tu cuenta queda <Text style={styles.bold}>desactivada</Text>{' '}
          en el backend de Fatro.
        </Text>
        <Text style={styles.bullet}>
          • Perderás acceso inmediato a formaciones, carreras VetSICS,
          consultas, solicitudes y favoritos.
        </Text>
        <Text style={styles.bullet}>
          • Tu sesión local se cierra automáticamente.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Qué datos se conservan (GDPR)</Text>
        <Text style={styles.bullet}>
          • Se mantiene el histórico mínimo exigido por ley (facturación,
          inscripciones emitidas, obligaciones fiscales).
        </Text>
        <Text style={styles.bullet}>
          • Si quieres el <Text style={styles.bold}>borrado completo</Text>{' '}
          de tus datos, contacta con{' '}
          <Text style={styles.inline}>dpo@fatroiberica.es</Text>.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reactivar la cuenta</Text>
        <Text style={styles.bullet}>
          Solo se puede reactivar contactando con el equipo de Fatro. No
          hay botón de auto-reactivación.
        </Text>
      </View>

      <View style={styles.confirmBlock}>
        <Text style={styles.confirmLabel}>
          Para confirmar, escribe <Text style={styles.bold}>{CONFIRMATION_WORD}</Text>{' '}
          abajo:
        </Text>
        <TextInput
          style={styles.input}
          value={confirmation}
          onChangeText={setConfirmation}
          placeholder={CONFIRMATION_WORD}
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.dangerButton,
          (!canSubmit || loading) && styles.dangerButtonDisabled,
        ]}
        onPress={handleUnsubscribe}
        disabled={!canSubmit || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.dangerButtonText}>Dar de baja mi cuenta</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={loading}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  icon: {
    fontSize: 56,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  title: {
    fontSize: FONTS.title,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.small,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  bullet: {
    fontSize: FONTS.regular,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '800',
  },
  inline: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    color: COLORS.primary,
  },
  confirmBlock: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  confirmLabel: {
    fontSize: FONTS.regular,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.error + '30',
    textAlign: 'center',
    letterSpacing: 2,
  },
  dangerButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  dangerButtonText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cancelButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textLight,
    fontSize: FONTS.regular,
    fontWeight: '600',
  },
});
