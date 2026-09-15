import React, { useMemo } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getProducts, WPProduct } from '../services/products';
import ProductCard from '../components/ProductCard';
import ErrorState from '../components/ErrorState';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Listado de productos con scroll infinito. Mismo patrón que HomeScreen:
 * `useInfiniteQuery` con `getNextPageParam` basado en el `totalPages`
 * que devuelve el servicio (leído del header X-WP-TotalPages).
 */
export default function ProductsScreen() {
  const navigation = useNavigation<Nav>();

  const {
    data,
    isLoading,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    error,
  } = useInfiniteQuery({
    queryKey: ['products', 'all'],
    queryFn: ({ pageParam }) => getProducts(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
  });

  const products = useMemo<WPProduct[]>(() => {
    return data?.pages.flatMap((p) => p.data) ?? [];
  }, [data]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <ErrorState
        title="No se pudieron cargar los productos"
        message={(error as Error).message}
        onRetry={refetch}
      />
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          onPress={() =>
            navigation.navigate('ProductDetail', { productId: item.id })
          }
        />
      )}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          // `isRefetching` también es true al cargar la siguiente página;
          // sin este filtro el spinner de pull-to-refresh aparecía al
          // hacer scroll infinito.
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={refetch}
          colors={[COLORS.primary]}
        />
      }
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.footer}
          />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.regular,
    color: COLORS.textLight,
  },
  list: {
    paddingVertical: SPACING.sm,
  },
  footer: {
    paddingVertical: SPACING.md,
  },
});
