import React from 'react';
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
import TrainingCard from '../components/TrainingCard';
import { getTrainings } from '../services/trainings';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../queryClient';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TrainingsScreen() {
  const navigation = useNavigation<Nav>();
  const { cookie } = useAuth();

  const {
    data: trainings = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: queryKeys.trainings(cookie),
    queryFn: () => getTrainings(cookie!),
    enabled: !!cookie,
  });

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
        <Text style={styles.errorTitle}>No se pudieron cargar las formaciones</Text>
        <Text style={styles.errorText}>
          {(error as Error).message || 'Error desconocido'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={trainings}
      keyExtractor={(item) => item.ID}
      renderItem={({ item }) => (
        <TrainingCard
          training={item}
          onPress={() =>
            navigation.navigate('TrainingDetail', { trainingId: item.ID })
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
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>No hay formaciones disponibles</Text>
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
