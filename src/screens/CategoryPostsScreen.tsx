import React, { useEffect, useState, useCallback } from 'react';
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
import { getPosts, WPPost } from '../services/posts';
import PostCard from '../components/PostCard';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Route = RouteProp<RootStackParamList, 'CategoryPosts'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CategoryPostsScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { categoryId, categoryName } = route.params;
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: categoryName });
  }, [navigation, categoryName]);

  const fetchPosts = useCallback(
    async (pageNum: number, refresh = false) => {
      try {
        const result = await getPosts(pageNum, 10, categoryId);
        if (refresh) {
          setPosts(result.data);
        } else {
          setPosts((prev) => [...prev, ...result.data]);
        }
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error(err);
      }
    },
    [categoryId]
  );

  useEffect(() => {
    fetchPosts(1, true).finally(() => setLoading(false));
  }, [fetchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchPosts(1, true);
    setRefreshing(false);
  }, [fetchPosts]);

  const onEndReached = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPosts(nextPage);
    setLoadingMore(false);
  }, [loadingMore, page, totalPages, fetchPosts]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No hay posts en esta categoría</Text>
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
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? (
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
  footer: {
    paddingVertical: SPACING.md,
  },
});
