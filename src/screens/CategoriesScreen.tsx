import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { getCategories, WPCategory } from '../services/categories';
import { getPosts } from '../services/posts';
import { queryKeys } from '../queryClient';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface CategoryWithPostCount extends WPCategory {
  postCount: number;
  children: CategoryWithPostCount[];
}

function buildTree(categories: CategoryWithPostCount[]): CategoryWithPostCount[] {
  const map = new Map<number, CategoryWithPostCount>();
  const roots: CategoryWithPostCount[] = [];

  categories.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));

  map.forEach((node) => {
    if (node.parent === 0) {
      roots.push(node);
    } else {
      const parent = map.get(node.parent);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  });

  // Filter: keep only categories (or parents) that have posts
  function hasPostsInTree(node: CategoryWithPostCount): boolean {
    if (node.postCount > 0) return true;
    return node.children.some(hasPostsInTree);
  }

  function filterTree(nodes: CategoryWithPostCount[]): CategoryWithPostCount[] {
    return nodes
      .filter(hasPostsInTree)
      .map((node) => ({ ...node, children: filterTree(node.children) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return filterTree(roots);
}

function CategoryItem({
  node,
  level,
  onPress,
}: {
  node: CategoryWithPostCount;
  level: number;
  onPress: (id: number, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(level === 0);
  const hasChildren = node.children.length > 0;

  return (
    <View>
      <TouchableOpacity
        style={[styles.item, { paddingLeft: SPACING.md + level * 20 }]}
        onPress={() => {
          if (hasChildren) {
            setExpanded(!expanded);
          }
          onPress(node.id, node.name);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.itemLeft}>
          {hasChildren && (
            <Text style={styles.arrow}>{expanded ? '▼' : '▶'}</Text>
          )}
          <Text style={[styles.itemName, level > 0 && styles.childName]}>
            {node.name}
          </Text>
        </View>
        <View style={styles.itemRight}>
          {node.postCount > 0 && (
            <Text style={styles.count}>{node.postCount}</Text>
          )}
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>

      {hasChildren && expanded && (
        <View>
          {node.children.map((child) => (
            <CategoryItem
              key={child.id}
              node={child}
              level={level + 1}
              onPress={onPress}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function CategoriesScreen() {
  const navigation = useNavigation<Nav>();

  /**
   * Hacemos dos peticiones en cadena dentro de una sola query:
   * 1. `getCategories(100)` — trae todas las categorías de WP.
   * 2. Por cada categoría hacemos un `getPosts(1, 1, cat.id)` en
   *    paralelo solo para leer el contador total desde el header
   *    X-WP-Total. Es un workaround: WP no devuelve el post_count en
   *    /categories cuando `hide_empty=false`, pero queremos saber
   *    qué categorías tienen posts para filtrarlas.
   *
   * TanStack Query cachea el resultado final (árbol filtrado) durante
   * `staleTime` (5 min por defecto), así que entrar/salir de la
   * pantalla no re-ejecuta las N peticiones.
   */
  const { data: tree = [], isLoading } = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: async () => {
      const cats = await getCategories(100, false);
      const withCounts = await Promise.all(
        cats.map(async (cat) => {
          try {
            const result = await getPosts(1, 1, cat.id);
            return {
              ...cat,
              postCount: result.total,
              children: [] as CategoryWithPostCount[],
            };
          } catch {
            return {
              ...cat,
              postCount: 0,
              children: [] as CategoryWithPostCount[],
            };
          }
        })
      );
      return buildTree(withCounts);
    },
  });

  const handlePress = (categoryId: number, categoryName: string) => {
    navigation.navigate('CategoryPosts', { categoryId, categoryName });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando categorías...</Text>
      </View>
    );
  }

  if (tree.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No hay categorías con noticias</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tree}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <CategoryItem node={item} level={0} onPress={handlePress} />
      )}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  emptyText: {
    fontSize: FONTS.regular,
    color: COLORS.textMuted,
  },
  list: {
    backgroundColor: COLORS.white,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingRight: SPACING.md,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  arrow: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginRight: SPACING.sm,
  },
  itemName: {
    fontSize: FONTS.regular,
    fontWeight: '600',
    color: COLORS.text,
  },
  childName: {
    fontWeight: '400',
    color: COLORS.textLight,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  count: {
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.md,
  },
});
