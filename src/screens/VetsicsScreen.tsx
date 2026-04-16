import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import VetsicsCard from '../components/VetsicsCard';
import {
  getVetsicsRaces,
  categorizeRaces,
  VetsicsRace,
} from '../services/vetsics';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Section {
  title: string;
  emoji: string;
  data: VetsicsRace[];
}

export default function VetsicsScreen() {
  const navigation = useNavigation<Nav>();
  const { cookie } = useAuth();
  const [races, setRaces] = useState<VetsicsRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!cookie) return;
    try {
      setError(null);
      const data = await getVetsicsRaces(cookie);
      setRaces(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar carreras');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cookie]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const sections = useMemo<Section[]>(() => {
    const { future, past } = categorizeRaces(races);
    const out: Section[] = [];
    if (future.length > 0) {
      out.push({ title: 'Próximas carreras', emoji: '🏁', data: future });
    }
    if (past.length > 0) {
      out.push({ title: 'Carreras pasadas', emoji: '🗄️', data: past });
    }
    return out;
  }, [races]);

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
        <Text style={styles.errorTitle}>No se pudieron cargar las carreras</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.ID}
      renderItem={({ item }) => (
        <VetsicsCard
          race={item}
          onPress={() =>
            navigation.navigate('VetsicsDetail', { raceId: item.ID })
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
            {section.data.length === 1 ? 'carrera' : 'carreras'}
          </Text>
        </View>
      )}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingVertical: SPACING.sm }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>No hay carreras disponibles</Text>
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
