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
import ConsultaCard from '../components/ConsultaCard';
import {
  getSpecialities,
  buildSpecialityGroups,
  Specialist,
} from '../services/consultas';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../queryClient';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Section {
  key: string;
  title: string;
  emoji: string;
  data: Specialist[];
}

/**
 * Pantalla de directorio de especialistas. Consume `get_specialities` y
 * pinta un SectionList con un grupo por línea de negocio (animales de
 * compañía, vacuno, porcino…). Al tocar una card se navega al detalle.
 */
export default function ConsultasScreen() {
  const navigation = useNavigation<Nav>();
  const { cookie } = useAuth();

  const {
    data: map = {},
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: queryKeys.consultas(cookie),
    queryFn: () => getSpecialities(cookie!),
    enabled: !!cookie,
  });

  const sections = useMemo<Section[]>(() => {
    return buildSpecialityGroups(map).map((g) => ({
      key: g.key,
      title: g.title,
      emoji: g.emoji,
      data: g.specialists,
    }));
  }, [map]);

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
          No se pudieron cargar las consultas
        </Text>
        <Text style={styles.errorText}>
          {(error as Error).message || 'Error desconocido'}
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, idx) =>
        `${item.specialist_slug || 'spec'}-${item.specialist_img}-${idx}`
      }
      renderItem={({ item, section }) => (
        <ConsultaCard
          specialist={item}
          onPress={() =>
            navigation.navigate('ConsultaDetail', {
              groupKey: section.key,
              slug: item.specialist_slug,
            })
          }
        />
      )}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {section.emoji} {section.title}
          </Text>
          <Text style={styles.sectionCount}>
            {section.data.length}{' '}
            {section.data.length === 1 ? 'especialista' : 'especialistas'}
          </Text>
        </View>
      )}
      stickySectionHeadersEnabled={false}
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
          <Text style={styles.introTitle}>Consulta a un especialista</Text>
          <Text style={styles.introText}>
            Consulta dudas técnicas directamente con los especialistas de
            Fatro por línea de negocio.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            No hay especialistas disponibles todavía.
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
