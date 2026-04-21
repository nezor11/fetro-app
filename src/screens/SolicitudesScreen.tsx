import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import SolicitudCard from '../components/SolicitudCard';
import {
  getSolicitudes,
  Solicitud,
  isSolicitudVigente,
} from '../services/solicitudes';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../queryClient';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Listado de solicitudes. Usa TanStack Query para cache (5 min stale
 * time por defecto en el client) y pull-to-refresh vía `refetch()`.
 *
 * Las vigentes van primero y las finalizadas al final. El orden dentro
 * de cada bloque respeta el que vino del backend (cronológico inverso).
 */
export default function SolicitudesScreen() {
  const navigation = useNavigation<Nav>();
  const { cookie } = useAuth();

  const {
    data: list = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: queryKeys.solicitudes(cookie),
    queryFn: () => getSolicitudes(cookie!),
    // Solo arranca cuando tenemos cookie. Evita una petición con
    // `cookie=null` antes de que el AuthContext termine de hidratar.
    enabled: !!cookie,
  });

  const sorted = useMemo(() => {
    const vigentes: Solicitud[] = [];
    const finalizadas: Solicitud[] = [];
    for (const s of list) {
      (isSolicitudVigente(s) ? vigentes : finalizadas).push(s);
    }
    return [...vigentes, ...finalizadas];
  }, [list]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          No se pudieron cargar las solicitudes
        </Text>
        <Text style={styles.errorText}>
          {(error as Error).message || 'Error desconocido'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => String(item.ID)}
      renderItem={({ item }) => (
        <SolicitudCard
          solicitud={item}
          onPress={() =>
            navigation.navigate('SolicitudDetail', {
              solicitudId: String(item.ID),
            })
          }
        />
      )}
      contentContainerStyle={{ paddingVertical: SPACING.sm }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
      ListHeaderComponent={
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Solicitudes y promociones</Text>
          <Text style={styles.introText}>
            Merchandising, muestras y sorteos que Fatro pone a tu
            disposición. Toca cualquier tarjeta para ver el detalle y
            rellenar el formulario de solicitud.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            No hay solicitudes disponibles ahora mismo.
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
    paddingBottom: SPACING.sm,
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
  errorTitle: {
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONTS.regular,
    color: COLORS.textMuted,
  },
});
