import React, { useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import VetsicsCard from '../components/VetsicsCard';
import TrainingCard from '../components/TrainingCard';
import { getVetsicsRaces, VetsicsRace } from '../services/vetsics';
import {
  getTrainings,
  Training,
  isUserRegisteredInTraining,
} from '../services/trainings';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../queryClient';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Asistencias: lista las carreras VetSICS y las formaciones a las que
 * el usuario ya se ha inscrito. Replicar el concepto de la app Android
 * original (`AsistenciasFragment`), que cubre la pregunta clave del
 * veterinario profesional: "¿en qué me inscribí y ya está confirmado?".
 *
 * Fuentes:
 * - Carreras VetSICS donde `requested > 0` (el backend cuenta los
 *   envíos del formulario de inscripción contra Flamingo).
 * - Formaciones donde el `user.id` del usuario actual aparece en el
 *   meta `usuarios_registrados` (array JSON de IDs).
 *
 * Comparte los mismos endpoints que las pantallas de VetSICS y
 * Formación, así que aprovecha el cache de TanStack Query: si el
 * usuario ha pasado por esas pestañas en los últimos 5 min, entrar
 * aquí es instantáneo sin una sola petición.
 */
type Kind = 'vetsics' | 'training';

type AsistenciaItem =
  | { kind: 'vetsics'; race: VetsicsRace }
  | { kind: 'training'; training: Training };

interface Section {
  key: Kind;
  title: string;
  emoji: string;
  data: AsistenciaItem[];
}

export default function AsistenciasScreen() {
  const navigation = useNavigation<Nav>();
  const { cookie, user } = useAuth();

  const vetsicsQuery = useQuery({
    queryKey: queryKeys.vetsics(cookie),
    queryFn: () => getVetsicsRaces(cookie!),
    enabled: !!cookie,
  });

  const trainingsQuery = useQuery({
    queryKey: queryKeys.trainings(cookie),
    queryFn: () => getTrainings(cookie!),
    enabled: !!cookie,
  });

  const isLoading = vetsicsQuery.isLoading || trainingsQuery.isLoading;
  const isRefetching =
    vetsicsQuery.isRefetching || trainingsQuery.isRefetching;

  const refetchAll = () => {
    vetsicsQuery.refetch();
    trainingsQuery.refetch();
  };

  const sections = useMemo<Section[]>(() => {
    const out: Section[] = [];

    const inscritasVetsics = (vetsicsQuery.data ?? []).filter((r) => {
      const n = parseInt(String(r.requested), 10);
      return Number.isFinite(n) && n > 0;
    });

    const inscritasTrainings = user
      ? (trainingsQuery.data ?? []).filter((t) =>
          isUserRegisteredInTraining(t, user.id)
        )
      : [];

    if (inscritasVetsics.length > 0) {
      out.push({
        key: 'vetsics',
        title: 'Carreras VetSICS',
        emoji: '🏁',
        data: inscritasVetsics.map((r) => ({ kind: 'vetsics' as const, race: r })),
      });
    }
    if (inscritasTrainings.length > 0) {
      out.push({
        key: 'training',
        title: 'Formaciones',
        emoji: '📚',
        data: inscritasTrainings.map((t) => ({
          kind: 'training' as const,
          training: t,
        })),
      });
    }
    return out;
  }, [vetsicsQuery.data, trainingsQuery.data, user]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) =>
        item.kind === 'vetsics'
          ? `vet-${item.race.ID}`
          : `tr-${item.training.ID}`
      }
      renderItem={({ item }) =>
        item.kind === 'vetsics' ? (
          <VetsicsCard
            race={item.race}
            onPress={() =>
              navigation.navigate('VetsicsDetail', { raceId: item.race.ID })
            }
          />
        ) : (
          <TrainingCard
            training={item.training}
            onPress={() =>
              navigation.navigate('TrainingDetail', {
                trainingId: item.training.ID,
              })
            }
          />
        )
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {section.emoji} {section.title}
          </Text>
          <Text style={styles.sectionCount}>
            {section.data.length}{' '}
            {section.data.length === 1 ? 'inscripción' : 'inscripciones'}
          </Text>
        </View>
      )}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingVertical: SPACING.sm }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetchAll}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
      ListHeaderComponent={
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Asistencias</Text>
          <Text style={styles.introText}>
            Las carreras VetSICS y formaciones en las que te has
            inscrito. Toca cualquiera para ver el detalle o comprobar
            información práctica del evento.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎟️</Text>
          <Text style={styles.emptyTitle}>
            Todavía no tienes inscripciones confirmadas
          </Text>
          <Text style={styles.emptyText}>
            Cuando te inscribas en una carrera VetSICS o una formación
            aparecerán aquí. La inscripción se registra automáticamente
            al enviar el formulario correspondiente.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  intro: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  introTitle: {
    fontSize: FONTS.title,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  introText: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionCount: {
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
