import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getProfile, updateProfile, UserProfile } from '../services/profile';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface Field {
  key: keyof UserProfile;
  label: string;
  placeholder: string;
  /** Propiedades de TextInput que varían según el tipo de campo. */
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'off' | 'name' | 'family-name' | 'given-name' | 'tel' | 'postal-code' | 'street-address';
  multiline?: boolean;
  maxLength?: number;
}

/**
 * Orden de campos pensado para que el usuario rellene de arriba abajo
 * como en una ficha de cliente: identidad → contacto → profesional → bio.
 */
const FIELDS: Field[] = [
  {
    key: 'firstName',
    label: 'Nombre',
    placeholder: 'Tu nombre',
    autoCapitalize: 'words',
    autoComplete: 'given-name',
  },
  {
    key: 'lastName',
    label: 'Primer apellido',
    placeholder: 'Tu primer apellido',
    autoCapitalize: 'words',
    autoComplete: 'family-name',
  },
  {
    key: 'lastName2',
    label: 'Segundo apellido',
    placeholder: 'Tu segundo apellido (opcional)',
    autoCapitalize: 'words',
  },
  {
    key: 'phone',
    label: 'Teléfono',
    placeholder: '+34 600 000 000',
    keyboardType: 'phone-pad',
    autoComplete: 'tel',
  },
  {
    key: 'company',
    label: 'Clínica o empresa',
    placeholder: 'Nombre de tu clínica o empresa',
    autoCapitalize: 'words',
  },
  {
    key: 'direccion',
    label: 'Dirección',
    placeholder: 'Calle y número',
    autoCapitalize: 'sentences',
    autoComplete: 'street-address',
  },
  {
    key: 'cp',
    label: 'Código postal',
    placeholder: '28001',
    keyboardType: 'numeric',
    autoComplete: 'postal-code',
    maxLength: 5,
  },
  {
    key: 'city',
    label: 'Provincia',
    placeholder: 'Madrid',
    autoCapitalize: 'words',
  },
  {
    key: 'description',
    label: 'Sobre ti',
    placeholder: 'Cuéntanos brevemente tu perfil profesional (opcional)',
    autoCapitalize: 'sentences',
    multiline: true,
    maxLength: 500,
  },
];

const EMPTY_PROFILE: UserProfile = {
  firstName: '',
  lastName: '',
  lastName2: '',
  phone: '',
  company: '',
  direccion: '',
  cp: '',
  city: '',
  description: '',
};

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { cookie } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cookie) return;
    (async () => {
      try {
        const data = await getProfile(cookie);
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    })();
  }, [cookie]);

  const updateField = (key: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!cookie || saving) return;

    // Validaciones mínimas. Hacemos pocas a propósito: mejor dejar que
    // el usuario avance y que el backend decida, que imponerle reglas
    // que no conoce. Pero CP y nombre sí los validamos localmente.
    if (!profile.firstName.trim()) {
      showError('El nombre es obligatorio');
      return;
    }
    if (profile.cp && !/^\d{5}$/.test(profile.cp.trim())) {
      showError('El código postal debe tener 5 dígitos');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(cookie, profile);
      showSuccess('Perfil actualizado correctamente');
      navigation.goBack();
    } catch (err: any) {
      showError(err.message || 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  // Envoltura cross-platform para feedback al usuario, mismo patrón que
  // en Solicitudes/Consultas: Alert.alert solo funciona en móvil.
  const showError = (message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`Error\n\n${message}`);
    } else {
      Alert.alert('Error', message);
    }
  };

  const showSuccess = (message: string) => {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('Listo', message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Actualiza tus datos. Se guardarán en tu cuenta de Fatro y se
          usarán para pre-rellenar los formularios de solicitudes y
          consultas.
        </Text>

        {FIELDS.map((field) => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={[styles.input, field.multiline && styles.inputMultiline]}
              value={profile[field.key]}
              onChangeText={(value) => updateField(field.key, value)}
              placeholder={field.placeholder}
              placeholderTextColor={COLORS.textMuted}
              keyboardType={field.keyboardType ?? 'default'}
              autoCapitalize={field.autoCapitalize ?? 'sentences'}
              autoComplete={field.autoComplete}
              multiline={field.multiline}
              maxLength={field.maxLength}
              numberOfLines={field.multiline ? 4 : 1}
              editable={!saving}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Guardar cambios</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footnote}>
          Email y nombre de usuario no se pueden editar desde aquí. Si
          necesitas cambiarlos contacta con soporte.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: FONTS.regular,
    color: COLORS.error,
    textAlign: 'center',
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  subtitle: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.small,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONTS.regular,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footnote: {
    marginTop: SPACING.md,
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
