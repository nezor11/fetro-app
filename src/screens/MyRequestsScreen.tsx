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
import SolicitudCard from '../components/SolicitudCard';
import { getVetsicsRaces, VetsicsRace } from '../services/vetsics';
import { getSolicitudes, Solicitud } from '../services/solicitudes';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../queryClient';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Un "item solicitado" puede ser una carrera VetSICS o una solicitud
 * (merchandising, promoción). Los wrappeamos en un tipo discriminado
 * para poder renderizarlos en el mismo SectionList con el card
 * correspondiente.
 */
type RequestedItem =
  | { kind: 'vetsics'; count: number; race: VetsicsRace }
  | { kind: 'solicitud'; count: number; solicitud: Solicitud };

interface Section {
  key: 'vetsics' | 'solicitudes';
  title: string;
  emoji: string;
  data: RequestedItem[];
}

/**
 * Parsea el `requested` que llega del backend como string numérico
 * (`"0"`, `"3"`). Devuelve 0 si no es parseable para no mostrar el item
 * en esta pantalla.
 */
function parseRequested(raw: string | number): number {
  const n = typeof raw === 'number' ? raw : parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * "Mis solicitudes": listado unificado de todo lo que el usuario ya ha
 * pedido. Combina dos endpoints (`get_vetsics` y `get_solicitudes`)
 * aprovechando el cache de TanStack Query — si el usuario visitó antes
 * VetSICS o Solicitudes, entramos aquí sin fetch adicional.
 *
 * Fuente del contador: el backend hace un conteo contra el plugin
 * Flamingo (submissions de Contact Form 7 cuyo título de post coincide
 * y cuyo campo email coincide con el del usuario). Es exacto pero pesado
 * en SQL — por eso el cache de 5 min es especialmente útil aquí.
 */
export default function MyRequestsScreen() {
  const navigation = useNavigation<Nav>();
  const { cookie } = useAuth();

  const vetsicsQuery = useQuery({
    queryKey: queryKeys.vetsics(cookie),
    queryFn: () => getVetsicsRaces(cookie!),
    enabled: !!cookie,
  });

  const solicitudesQuery = useQuery({
    queryKey: queryKeys.solicitudes(cookie),
    queryFn: () => getSolicitudes(cookie!),
    enabled: !!cookie,
  });

  const isLoading = vetsicsQuery.isLoading || solicitudesQuery.isLoading;
  const isRefetching =
    vetsicsQuery.isRefetching || solicitudesQuery.isRefetching;

  /**
   * Refetch paralelo. Disparamos los dos aunque uno aún esté cargando;
   * TanStack Query deduplica si ya hay uno en curso.
   */
  const refetchAll = () => {
    vetsicsQuery.refetch();
    solicitudesQuery.refetch();
  };

  const sections = useMemo<Section[]>(() => {
    const out: Section[] = [];

    const requestedRaces: RequestedItem[] = (vetsicsQuery.data ?? [])
      .map((race) => ({
        kind: 'vetsics' as const,
        count: parseRequested(race.requested),
        race,
      }))
      .filter((item) => item.count > 0);

    const requestedSolicitudes: RequestedItem[] = (solicitudesQuery.data ?? [])
      .map((s) => ({
        kind: 'solicitud' as const,
        count: parseRequested(s.requested),
        solicitud: s,
      }))
      .filter((item) => item.count > 0);

    if (requestedRaces.length > 0) {
      out.push({
        key: 'vetsics',
        title: 'Carreras solicitadas',
        emoji: '🏁',
        data: requestedRaces,
      });
    }
    if (requestedSolicitudes.length > 0) {
      out.push({
        key: 'solicitudes',
        title: 'Promociones solicitadas',
        emoji: '📝',
        data: requestedSolicitudes,
      });
    }
    return out;
  }, [vetsicsQuery.data, solicitudesQuery.data]);

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
          : `sol-${item.solicitud.ID}`
      }
      renderItem={({ item }) => (
        <View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              🔁 Solicitado {item.count} {item.count === 1 ? 'vez' : 'veces'}
            </Text>
          </View>
          {item.kind === 'vetsics' ? (
            <VetsicsCard
              race={item.race}
              onPress={() =>
                navigation.navigate('VetsicsDetail', { raceId: item.race.ID })
              }
            />
          ) : (
            <SolicitudCard
              solicitud={item.solicitud}
              onPress={() =>
                navigation.navigate('SolicitudDetail', {
                  solicitudId: String(item.solicitud.ID),
                })
              }
            />
          )}
        </View>
      )}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {section.emoji} {section.title}
          </Text>
          <Text style={styles.sectionCount}>
            {section.data.length}{' '}
            {section.data.length === 1 ? 'ítem' : 'ítems'}
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
          <Text style={styles.introTitle}>Lo que ya has solicitado</Text>
          <Text style={styles.introText}>
            Aquí aparecen las carreras y promociones en las que te has
            inscrito o que has pedido. El contador se actualiza en cuanto
            el backend registra el envío de tu formulario.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>Todavía no has solicitado nada</Text>
          <Text style={styles.emptyText}>
            Cuando te inscribas en una carrera VetSICS o rellenes una
            solicitud de merchandising, aparecerá aquí para que lleves el
            histórico a mano.
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
  countBadge: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: -SPACING.xs, // engancha visualmente con la card de abajo
    backgroundColor: COLORS.primary + '15',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    zIndex: 1,
  },
  countBadgeText: {
    fontSize: FONTS.xsmall,
    color: COLORS.primary,
    fontWeight: '700',
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
