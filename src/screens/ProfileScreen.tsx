import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { getProfile, UserProfile } from '../services/profile';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Pantalla de perfil. Muestra los datos del usuario y permite navegar a
 * `EditProfile` para modificarlos. Refresca `useFocusEffect` al volver
 * de la edición, así el usuario ve los cambios inmediatamente sin
 * necesidad de un `refreshUser` global en el AuthContext.
 */
export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, cookie, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!cookie) return;
    try {
      const data = await getProfile(cookie);
      setProfile(data);
    } catch {
      // Si falla la carga del perfil extendido seguimos mostrando lo
      // básico del `user` del login (sin petar la pantalla).
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [cookie]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!user) return null;

  // Nombre completo, preferimos los del perfil extendido si ya cargó.
  const firstName = profile?.firstName || user.firstname || '';
  const lastName = [profile?.lastName, profile?.lastName2]
    .filter(Boolean)
    .join(' ')
    .trim() || user.lastname || '';
  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') || user.displayname;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {(firstName || user.displayname || '?')[0].toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>✏️ Editar perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('MyRequests')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>📦 Mis solicitudes</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuenta</Text>
            <InfoRow label="Nombre" value={firstName} />
            <InfoRow label="Apellidos" value={lastName} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Usuario" value={user.username} />
          </View>

          {profile &&
          (profile.phone ||
            profile.company ||
            profile.direccion ||
            profile.cp ||
            profile.city) ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contacto profesional</Text>
              <InfoRow label="Clínica/Empresa" value={profile.company} />
              <InfoRow label="Teléfono" value={profile.phone} />
              <InfoRow label="Dirección" value={profile.direccion} />
              <InfoRow label="Código postal" value={profile.cp} />
              <InfoRow label="Provincia" value={profile.city} />
            </View>
          ) : null}

          {profile?.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sobre ti</Text>
              <Text style={styles.description}>{profile.description}</Text>
            </View>
          ) : null}
        </>
      )}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
  },
  name: {
    fontSize: FONTS.xlarge,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SPACING.sm,
  },
  email: {
    fontSize: FONTS.small,
    color: COLORS.white + 'CC',
    marginTop: SPACING.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  actionButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    fontWeight: '700',
  },
  loadingBlock: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.small,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONTS.regular,
    color: COLORS.textLight,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: FONTS.regular,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  description: {
    fontSize: FONTS.regular,
    color: COLORS.text,
    lineHeight: 22,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingVertical: SPACING.sm + 6,
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: '700',
  },
});
