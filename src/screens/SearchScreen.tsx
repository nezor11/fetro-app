import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getPosts, WPPost } from '../services/posts';
import { getProducts, WPProduct } from '../services/products';
import PostCard from '../components/PostCard';
import ProductCard from '../components/ProductCard';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [products, setProducts] = useState<WPProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setPosts([]);
      setProducts([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const [postsResult, productsResult] = await Promise.all([
        getPosts(1, 10, undefined, term),
        getProducts(1, 10, term),
      ]);
      setPosts(postsResult.data);
      setProducts(productsResult.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(text), 500);
    },
    [doSearch]
  );

  const totalResults = posts.length + products.length;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Buscar noticias y productos..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {!loading && !searched && (
        <View style={styles.centered}>
          <Text style={styles.hintText}>Escribe al menos 2 caracteres para buscar</Text>
        </View>
      )}

      {!loading && searched && totalResults === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No se encontraron resultados para "{query}"</Text>
        </View>
      )}

      {!loading && searched && totalResults > 0 && (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <>
              {posts.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>
                    Noticias ({posts.length})
                  </Text>
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPress={() =>
                        navigation.navigate('PostDetail', { postId: post.id })
                      }
                    />
                  ))}
                </View>
              )}
              {products.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>
                    Productos ({products.length})
                  </Text>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onPress={() =>
                        navigation.navigate('ProductDetail', {
                          productId: product.id,
                        })
                      }
                    />
                  ))}
                </View>
              )}
            </>
          }
          contentContainerStyle={styles.results}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBar: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONTS.regular,
    color: COLORS.text,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  hintText: {
    fontSize: FONTS.regular,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FONTS.small,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  results: {
    paddingBottom: SPACING.lg,
  },
});
