import React, { useEffect, useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { getPosts, WPPost } from '../services/posts';
import { getProducts, WPProduct } from '../services/products';
import PostCard from '../components/PostCard';
import ProductCard from '../components/ProductCard';
import { queryKeys } from '../queryClient';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface SearchResults {
  posts: WPPost[];
  products: WPProduct[];
}

/**
 * Búsqueda combinada de posts y productos.
 *
 * - `query` → lo que el usuario escribe (actualización inmediata del input).
 * - `debounced` → copia retrasada 500 ms; es la que entra en el `queryKey`.
 *   Así evitamos disparar una petición con cada tecla.
 *
 * Cachear por término permite que si el usuario vuelve a escribir
 * exactamente lo mismo (o pasa de "zoe" a "zo" y de vuelta a "zoe"),
 * recibamos los resultados inmediatos del cache sin pegarle al servidor.
 */
export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 500);
    return () => clearTimeout(t);
  }, [query]);

  const isValid = debounced.length >= 2;

  const { data, isLoading } = useQuery<SearchResults>({
    queryKey: queryKeys.search(debounced),
    queryFn: async () => {
      const [postsResult, productsResult] = await Promise.all([
        getPosts(1, 10, undefined, debounced),
        getProducts(1, 10, debounced),
      ]);
      return { posts: postsResult.data, products: productsResult.data };
    },
    enabled: isValid,
  });

  const posts = data?.posts ?? [];
  const products = data?.products ?? [];
  const totalResults = posts.length + products.length;
  const hasSearched = isValid && !isLoading;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Buscar noticias y productos..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {!isLoading && !isValid && (
        <View style={styles.centered}>
          <Text style={styles.hintText}>
            Escribe al menos 2 caracteres para buscar
          </Text>
        </View>
      )}

      {hasSearched && totalResults === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No se encontraron resultados para "{debounced}"
          </Text>
        </View>
      )}

      {hasSearched && totalResults > 0 && (
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
