import React, { useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getPosts, WPPost } from '../services/posts';
import PostCard from '../components/PostCard';
import ErrorState from '../components/ErrorState';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Route = RouteProp<RootStackParamList, 'CategoryPosts'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Posts de una categoría con scroll infinito. Mismo patrón que
 * `HomeScreen` (`useInfiniteQuery`), lo que resuelve dos problemas de
 * la versión anterior basada en `useState`:
 *
 * - Los errores se tragaban con `console.error` y se mostraba "No hay
 *   posts en esta categoría" aunque hubiera fallado la red.
 * - Un `onEndReached` en vuelo durante un pull-to-refresh añadía la
 *   página N a la lista ya reseteada → posts duplicados.
 */
export default function CategoryPostsScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { categoryId, categoryName } = route.params;

  useEffect(() => {
    navigation.setOptions({ title: categoryName });
  }, [navigation, categoryName]);

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
    queryKey: ['posts', 'category', categoryId],
    queryFn: ({ pageParam }) => getPosts(pageParam, 10, categoryId),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
  });

  const posts = useMemo<WPPost[]>(() => {
    return data?.pages.flatMap((p) => p.data) ?? [];
  }, [data]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <ErrorState
        title="No se pudieron cargar las noticias"
        message={(error as Error).message}
        onRetry={() => refetch()}
      />
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
      contentContainerStyle={posts.length === 0 ? styles.emptyList : styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={refetch}
          colors={[COLORS.primary]}
        />
      }
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No hay posts en esta categoría</Text>
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.footer} />
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
  emptyText: {
    fontSize: FONTS.regular,
    color: COLORS.textMuted,
  },
  list: {
    paddingVertical: SPACING.sm,
  },
  emptyList: {
    flexGrow: 1,
  },
  footer: {
    paddingVertical: SPACING.md,
  },
});
