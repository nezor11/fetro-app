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
import { getPosts, WPPost } from '../services/posts';
import PostCard from '../components/PostCard';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Listado de noticias (posts WP) con scroll infinito. Usa
 * `useInfiniteQuery` de TanStack Query: cada "página" es una respuesta
 * de `/wp-json/wp/v2/posts?page=N`. El hook cachea todas las páginas
 * cargadas hasta ahora, invalida solo cuando hay pull-to-refresh, y
 * expone `hasNextPage` y `fetchNextPage` para engancharlo al
 * `onEndReached` del FlatList.
 *
 * `getNextPageParam` recibe la última página cargada y su índice, y
 * devuelve el número de la siguiente página (o `undefined` si ya no hay
 * más). La heurística usa `totalPages` que WP devuelve en el header
 * `X-WP-TotalPages`.
 */
export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

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
    queryKey: ['posts', 'home'],
    queryFn: ({ pageParam }) => getPosts(pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
  });

  // Aplanamos las páginas en un único array de posts para el FlatList.
  const posts = useMemo<WPPost[]>(() => {
    return data?.pages.flatMap((p) => p.data) ?? [];
  }, [data]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando noticias...</Text>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {(error as Error).message || 'Error al cargar las noticias'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
        />
      )}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
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
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.regular,
    color: COLORS.textLight,
  },
  errorText: {
    fontSize: FONTS.regular,
    color: COLORS.error,
    textAlign: 'center',
  },
  list: {
    paddingVertical: SPACING.sm,
  },
  footer: {
    paddingVertical: SPACING.md,
  },
});
