import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import SolicitudCard from '../components/SolicitudCard';
import {
  getSolicitudes,
  Solicitud,
  isSolicitudVigente,
} from '../services/solicitudes';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Listado de solicitudes vigentes (y al final, las finalizadas atenuadas).
 * No hay agrupación por línea de negocio como en Consultas: el volumen es
 * bajo (típicamente <10 promociones activas a la vez) y el filtro por
 * línea de negocio ya se vende visualmente vía los chips.
 */
export default function SolicitudesScreen() {
  const navigation = useNavigation<Nav>();
  const { cookie } = useAuth();
  const [list, setList] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!cookie) return;
    try {
      setError(null);
      const data = await getSolicitudes(cookie);
      setList(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar solicitudes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cookie]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Colocamos las vigentes primero y las finalizadas al final, para que
   * el usuario encuentre antes lo accionable. Dentro de cada bloque se
   * preserva el orden del backend (suele ser cronológico inverso).
   */
  const sorted = useMemo(() => {
    const vigentes: Solicitud[] = [];
    const finalizadas: Solicitud[] = [];
    for (const s of list) {
      (isSolicitudVigente(s) ? vigentes : finalizadas).push(s);
    }
    return [...vigentes, ...finalizadas];
  }, [list]);

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
        <Text style={styles.errorTitle}>
          No se pudieron cargar las solicitudes
        </Text>
        <Text style={styles.errorText}>{error}</Text>
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
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
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
